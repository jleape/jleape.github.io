import * as turf from '@turf/turf';
import type {
  AlignmentFeature,
  DestinationFeature,
  ParcelCollection,
  ParcelFeature,
} from '@/types';
import { buildAdjacency } from './adjacency';
import { dijkstraPrevAware } from './dijkstra';
import { catmullRomSmooth, lineCrossesAny, sharedEdgeMidpoint } from './smooth';

/**
 * Radius of curvature of the corner formed by three points (lng/lat). Returns
 * Infinity for collinear points. Uses a local equirectangular projection
 * around `a` to convert degrees to metres — accurate to within ~0.5% at the
 * sub-10km scales we work with.
 */
function radiusAtCorner(
  a: [number, number],
  b: [number, number],
  c: [number, number]
): number {
  const mPerDegLat = 111_320;
  const mPerDegLng = 111_320 * Math.cos((a[1] * Math.PI) / 180);
  const bx = (b[0] - a[0]) * mPerDegLng;
  const by = (b[1] - a[1]) * mPerDegLat;
  const cx = (c[0] - a[0]) * mPerDegLng;
  const cy = (c[1] - a[1]) * mPerDegLat;
  const dAB = Math.hypot(bx, by);
  const dBC = Math.hypot(cx - bx, cy - by);
  const dAC = Math.hypot(cx, cy);
  const cross = bx * cy - by * cx;
  const area = Math.abs(cross) / 2;
  if (area < 1e-6 || dAB === 0 || dBC === 0) return Infinity;
  return (dAB * dBC * dAC) / (4 * area);
}

export interface CostBreakdown {
  construction: number;       // unit-construction × polyline length
  landOnPath: number;         // expected land for parcels on the path (incl. source!)
  landClipped: number;        // expected land for parcels the polyline geometrically clips
  pathLengthMeters: number;
  pathParcelCount: number;
  clippedParcelCount: number;
}

export interface AutoAlignmentResult {
  alignment: AlignmentFeature | null;
  parcelPath: string[];
  expectedCost: number;
  breakdown: CostBreakdown;
  /**
   * `exitPoints[i]` is the lng/lat where the alignment leaves parcel
   * `parcelPath[i]` and enters parcel `parcelPath[i+1]` — i.e., the boundary
   * midpoint between them. `exitPoints[N-1]` is the end destination. Used
   * to anchor the boat (and per-parcel display elements like easement
   * buffers) to the actual polyline rather than to off-line centroids.
   */
  exitPoints: number[][];
  /** Index into the smooth-spline control-point sequence for each exit
   *  point. Lets downstream code map a parcel index to its position along
   *  the smoothed polyline, accounting for intermediate destinations that
   *  were inserted between parcel-boundary control points. */
  exitControlIndices: number[];
  samplesPerSegment: number;
}

const EMPTY_BREAKDOWN: CostBreakdown = {
  construction: 0,
  landOnPath: 0,
  landClipped: 0,
  pathLengthMeters: 0,
  pathParcelCount: 0,
  clippedParcelCount: 0,
};

const SAMPLES_PER_SEGMENT = 8;

const EMPTY: AutoAlignmentResult = {
  alignment: null,
  parcelPath: [],
  expectedCost: 0,
  breakdown: EMPTY_BREAKDOWN,
  exitPoints: [],
  exitControlIndices: [],
  samplesPerSegment: SAMPLES_PER_SEGMENT,
};

/** Expected acquisition cost given the parcel's current status. */
function expectedLandFor(parcel: ParcelFeature): number {
  const p = parcel.properties;
  if (p.status === 'acquired') return 0;
  if (p.status === 'negotiating') return p.landCost;
  const prob = p.acquisitionProbability;
  return prob * p.landCost + (1 - prob) * p.expropriationCost;
}

function findHostParcel(
  coord: [number, number],
  parcels: Map<string, ParcelFeature>,
  centroidCache: Map<string, [number, number]>
): string | null {
  const pt = turf.point(coord);
  for (const [id, p] of parcels) {
    if (turf.booleanPointInPolygon(pt, p)) return id;
  }
  // Fallback: nearest centroid.
  let bestId: string | null = null;
  let bestDist = Infinity;
  for (const [id] of parcels) {
    const c = centroidCache.get(id)!;
    const d = turf.distance(pt, turf.point(c), { units: 'kilometers' });
    if (d < bestDist) {
      bestDist = d;
      bestId = id;
    }
  }
  return bestId;
}

/**
 * Edge cost used as the Dijkstra weight from `fromId` to `toId`.
 *
 * Construction component: `centroid-distance × ((u_from + u_to) / 2)`. This is
 * the standard half-and-half centroid model — the segment from c_from to the
 * shared border traverses `from` at `u_from`, and the segment from border to
 * c_to traverses `to` at `u_to`; with the border placed at the segment midpoint
 * the average works out exactly.
 *
 * Land component: only `to`'s expected acquisition cost. This is the
 * directed-edge trick that turns node-weighted shortest path into Dijkstra:
 * each node's land cost is paid when *entering* it, so the path total includes
 * land for every node *except the source*. The source's land cost is added
 * back into `landOnPath` outside Dijkstra.
 */
function makeEdgeWeight(
  parcels: Map<string, ParcelFeature>,
  centroidCache: Map<string, [number, number]>
) {
  return (fromId: string, toId: string): number => {
    const from = parcels.get(fromId)!;
    const to = parcels.get(toId)!;
    const fromC = centroidCache.get(fromId)!;
    const toC = centroidCache.get(toId)!;
    const distanceM = turf.distance(turf.point(fromC), turf.point(toC), { units: 'meters' });
    const avgUnit = (from.properties.unitConstructionCost + to.properties.unitConstructionCost) / 2;
    return distanceM * avgUnit + expectedLandFor(to);
  };
}

function buildCentroidCache(features: ParcelFeature[]): Map<string, [number, number]> {
  const cache = new Map<string, [number, number]>();
  for (const f of features) {
    cache.set(f.properties.id, turf.centroid(f).geometry.coordinates as [number, number]);
  }
  return cache;
}

/**
 * Compute the least-expected-cost polyline through ordered destinations.
 *
 * The Dijkstra optimises:
 *   Σ centroid_distance × avg_unit_construction_cost  +  Σ expected_land_for_each_path_node
 * (except the source node's land — that's constant for fixed endpoints, so
 * adding it wouldn't change the chosen path. It's still added to the displayed
 * total.)
 *
 * Costs the Dijkstra does NOT see:
 *   * Stub construction at each end (from destination point to host centroid).
 *     Constant for fixed endpoints, so doesn't bias the choice; added to the
 *     displayed total.
 *   * Parcels the polyline geometrically clips but that aren't on the path.
 *     Varies by path, so technically the chosen path may not minimise the
 *     fully-corrected cost. Their expected land cost is added post-hoc so the
 *     displayed total is at least accurate.
 */
export function computeAutoAlignment(
  parcelsFC: ParcelCollection,
  destinations: DestinationFeature[],
  minRadiusOfCurvatureM = 0
): AutoAlignmentResult {
  if (destinations.length < 2 || parcelsFC.features.length === 0) return EMPTY;

  const activeFeatures = parcelsFC.features.filter((f) => f.properties.status !== 'abandoned');
  if (activeFeatures.length === 0) return EMPTY;
  const parcels = new Map<string, ParcelFeature>(
    activeFeatures.map((f) => [f.properties.id, f])
  );
  const centroidCache = buildCentroidCache(activeFeatures);
  const adj = buildAdjacency({ type: 'FeatureCollection', features: activeFeatures });

  const sorted = [...destinations].sort((a, b) => a.properties.order - b.properties.order);
  const fullPath: string[] = [];

  const weight = makeEdgeWeight(parcels, centroidCache);
  const validTransition = (
    prev: string | null,
    curr: string,
    next: string
  ): boolean => {
    if (minRadiusOfCurvatureM <= 0 || prev == null) return true;
    const r = radiusAtCorner(
      centroidCache.get(prev)!,
      centroidCache.get(curr)!,
      centroidCache.get(next)!
    );
    return r >= minRadiusOfCurvatureM;
  };

  for (let i = 0; i < sorted.length - 1; i++) {
    const startCoord = sorted[i].geometry.coordinates as [number, number];
    const endCoord = sorted[i + 1].geometry.coordinates as [number, number];
    const sourceId = findHostParcel(startCoord, parcels, centroidCache);
    const sinkId = findHostParcel(endCoord, parcels, centroidCache);
    if (!sourceId || !sinkId) return EMPTY;

    let { path: segment } = dijkstraPrevAware(
      (id) => adj.get(id) ?? new Set<string>(),
      weight,
      validTransition,
      sourceId,
      sinkId
    );

    // Fallback: if the curvature constraint makes the path infeasible, drop
    // it and route without the constraint so the user sees *something* rather
    // than a blank map. They can then loosen the radius in settings.
    if (!segment && minRadiusOfCurvatureM > 0) {
      const r = dijkstraPrevAware(
        (id) => adj.get(id) ?? new Set<string>(),
        weight,
        () => true,
        sourceId,
        sinkId
      );
      segment = r.path;
    }
    if (!segment) return EMPTY;

    if (i === 0) fullPath.push(...segment);
    else fullPath.push(...segment.slice(1));
  }

  // Locate any INTERMEDIATE destinations on the path so we can insert them
  // as explicit control points. Without this the spline only grazes the
  // host parcel of an intermediate destination; with it, the spline
  // interpolates exactly through every destination point.
  const intermediateDestByPathIndex = new Map<number, number[][]>();
  for (let d = 1; d < sorted.length - 1; d++) {
    const coord = sorted[d].geometry.coordinates as number[];
    const pt = turf.point(coord);
    for (let i = 0; i < fullPath.length; i++) {
      const parcel = parcels.get(fullPath[i]);
      if (!parcel) continue;
      if (turf.booleanPointInPolygon(pt, parcel)) {
        const list = intermediateDestByPathIndex.get(i) ?? [];
        list.push(coord);
        intermediateDestByPathIndex.set(i, list);
        break;
      }
    }
  }

  // Build the polyline control points. We start from the *start destination*,
  // step through the BOUNDARY MIDPOINT between each pair of adjacent path
  // parcels (rather than the parcel centroid — boundary midpoints are the
  // literal crossing points and keep the polyline inside the path corridor),
  // splice in any intermediate destinations whose host parcel is the one
  // we've just entered, and end at the destination point. Falls back to
  // the centroid if a shared edge can't be found (shouldn't happen for
  // Voronoi adjacency).
  const controlPoints: number[][] = [sorted[0].geometry.coordinates];
  const exitPoints: number[][] = [];
  const exitControlIndices: number[] = [];
  for (let i = 0; i < fullPath.length - 1; i++) {
    const a = parcels.get(fullPath[i])!;
    const b = parcels.get(fullPath[i + 1])!;
    const mid = sharedEdgeMidpoint(a, b) ?? centroidCache.get(fullPath[i + 1])!;
    controlPoints.push(mid);
    exitPoints.push(mid);
    exitControlIndices.push(controlPoints.length - 1);
    const intDests = intermediateDestByPathIndex.get(i + 1);
    if (intDests) for (const d of intDests) controlPoints.push(d);
  }
  controlPoints.push(sorted[sorted.length - 1].geometry.coordinates);
  exitPoints.push(sorted[sorted.length - 1].geometry.coordinates);
  exitControlIndices.push(controlPoints.length - 1);

  // Smooth the polyline. Catmull-Rom interpolates every control point, so
  // start/end + intermediate destinations stay exact and each boundary
  // midpoint is still crossed — only the inter-control segments curve.
  let smoothed = catmullRomSmooth(controlPoints, SAMPLES_PER_SEGMENT, 0.5);

  // Safety: if the spline strays into any blocked parcel, fall back to the
  // un-smoothed control polyline. Blocked parcels were excluded from the
  // graph so the control polygon never touches them; the spline's overshoot
  // is the only way to violate the no-cross constraint.
  const blocked = parcelsFC.features.filter((f) => f.properties.status === 'abandoned');
  if (blocked.length > 0 && lineCrossesAny(smoothed, blocked)) {
    smoothed = controlPoints;
  }
  const coords = smoothed;

  const line = turf.lineString(coords);
  const pathLengthMeters = turf.length(line, { units: 'meters' });

  // ----- Cost breakdown (true expected cost, not what Dijkstra optimised) -----

  // 1) Construction = polyline length × unit cost. We split into:
  //    - Stub start (d_start → c_first), entirely inside the first parcel
  //    - Inter-centroid edges, each half-half between two parcels
  //    - Stub end (c_last → d_end), entirely inside the last parcel
  const firstP = parcels.get(fullPath[0])!;
  const lastP = parcels.get(fullPath[fullPath.length - 1])!;

  let construction = 0;
  {
    const stubStart = turf.distance(
      turf.point(sorted[0].geometry.coordinates),
      turf.point(centroidCache.get(fullPath[0])!),
      { units: 'meters' }
    );
    construction += stubStart * firstP.properties.unitConstructionCost;
  }
  for (let k = 0; k < fullPath.length - 1; k++) {
    const a = parcels.get(fullPath[k])!;
    const b = parcels.get(fullPath[k + 1])!;
    const d = turf.distance(
      turf.point(centroidCache.get(fullPath[k])!),
      turf.point(centroidCache.get(fullPath[k + 1])!),
      { units: 'meters' }
    );
    const u = (a.properties.unitConstructionCost + b.properties.unitConstructionCost) / 2;
    construction += d * u;
  }
  {
    const stubEnd = turf.distance(
      turf.point(centroidCache.get(fullPath[fullPath.length - 1])!),
      turf.point(sorted[sorted.length - 1].geometry.coordinates),
      { units: 'meters' }
    );
    construction += stubEnd * lastP.properties.unitConstructionCost;
  }

  // 2) Land cost for parcels on the path (including the source, which Dijkstra
  //    skipped).
  let landOnPath = 0;
  for (const pid of fullPath) {
    landOnPath += expectedLandFor(parcels.get(pid)!);
  }

  // 3) Polyline-clipped parcels — the centroid-to-centroid polyline sometimes
  //    clips parcels not on the chosen path. They must be acquired too.
  const pathSet = new Set(fullPath);
  let landClipped = 0;
  let clippedCount = 0;
  for (const feat of activeFeatures) {
    const pid = feat.properties.id;
    if (pathSet.has(pid)) continue;
    if (turf.booleanIntersects(line, feat)) {
      landClipped += expectedLandFor(feat);
      clippedCount++;
    }
  }

  const totalCost = construction + landOnPath + landClipped;

  const alignment: AlignmentFeature = {
    type: 'Feature',
    geometry: line.geometry,
    properties: {
      source: 'auto',
      totalLengthMeters: pathLengthMeters,
      expectedCost: totalCost,
    },
  };

  return {
    alignment,
    parcelPath: fullPath,
    expectedCost: totalCost,
    breakdown: {
      construction,
      landOnPath,
      landClipped,
      pathLengthMeters,
      pathParcelCount: fullPath.length,
      clippedParcelCount: clippedCount,
    },
    exitPoints,
    exitControlIndices,
    samplesPerSegment: SAMPLES_PER_SEGMENT,
  };
}
