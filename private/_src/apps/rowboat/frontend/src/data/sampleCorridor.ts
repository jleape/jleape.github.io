import * as turf from '@turf/turf';
import type { Feature, Point, Polygon } from 'geojson';
import type { ParcelCollection, ParcelFeature, ParcelProperties } from '@/types';
import { buildAdjacency } from '@/lib/routing/adjacency';

// Seeded PRNG so the sample data is stable across reloads.
function mulberry32(seed: number) {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = t;
    r = Math.imul(r ^ (r >>> 15), r | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

interface CorridorOptions {
  origin: [number, number];   // [lng, lat] of the SW corridor endpoint
  bearingDeg: number;         // bearing toward the NE endpoint
  lengthKm: number;
  bandWidthKm: number;        // mean band width
  numParcels: number;         // target number of parcels in the corridor
  clusterCount: number;
  /** 0.0 = fully uniform random, 1.0 = fully clustered. Lower values keep
   *  the cross-section coverage even (no narrow gaps). Default 0.6. */
  clusterFraction: number;
  seed: number;
}

// Tuned for the client-only demo: a moderate-density corridor sized so the
// in-browser Monte Carlo simulator (50 rollouts) finishes in ~45–60 s on a
// typical laptop. Originally 650 in the full app; reduced here for snappier
// demo feedback.
const DEFAULTS: CorridorOptions = {
  origin: [-97.95, 30.25],
  bearingDeg: 65,
  lengthKm: 45,
  bandWidthKm: 14,
  numParcels: 320,
  clusterCount: 10,
  clusterFraction: 0.45,
  seed: 20260515,
};

/**
 * Build a corridor polygon with jittered side widths and lumpy (non-perpendicular) end caps.
 * The polygon is used as a *centroid filter* for parcels, not a clipping mask — so its
 * outline only roughly bounds the visible region; individual parcel borders are natural Voronoi.
 */
function buildCorridorPolygon(o: CorridorOptions, rng: () => number): Feature<Polygon> {
  const segments = 24;
  const halfWidth = o.bandWidthKm / 2;
  const widthJitter = halfWidth * 0.55;
  const leftRing: number[][] = [];
  const rightRing: number[][] = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const along = t * o.lengthKm;
    const center = turf.destination(turf.point(o.origin), along, o.bearingDeg, {
      units: 'kilometers',
    });
    const wL = halfWidth + (rng() - 0.5) * widthJitter;
    const wR = halfWidth + (rng() - 0.5) * widthJitter;
    const left = turf.destination(center, wL, o.bearingDeg + 90, { units: 'kilometers' });
    const right = turf.destination(center, wR, o.bearingDeg - 90, { units: 'kilometers' });
    leftRing.push(left.geometry.coordinates);
    rightRing.push(right.geometry.coordinates);
  }

  // Lumpy caps: half-circle of points around each endpoint, jittered radii.
  const startCenter = turf.point(o.origin);
  const endCenter = turf.destination(startCenter, o.lengthKm, o.bearingDeg, {
    units: 'kilometers',
  });
  const capSegments = 8;
  const capRadiusJitter = 0.25;

  const startCap: number[][] = [];
  for (let i = 1; i < capSegments; i++) {
    const t = i / capSegments;
    // Local angle θ: sweep right (90°) → back (180°) → left (270°), going via the back of the corridor.
    const theta = 90 + 180 * t;
    const r = halfWidth * (1 + (rng() - 0.5) * 2 * capRadiusJitter);
    const bearing = (o.bearingDeg + theta + 720) % 360;
    startCap.push(
      turf.destination(startCenter, r, bearing, { units: 'kilometers' }).geometry.coordinates
    );
  }

  const endCap: number[][] = [];
  for (let i = 1; i < capSegments; i++) {
    const t = i / capSegments;
    // Local angle θ: sweep left (-90°) → forward (0°) → right (90°), going via the front.
    const theta = -90 + 180 * t;
    const r = halfWidth * (1 + (rng() - 0.5) * 2 * capRadiusJitter);
    const bearing = (o.bearingDeg + theta + 720) % 360;
    endCap.push(
      turf.destination(endCenter, r, bearing, { units: 'kilometers' }).geometry.coordinates
    );
  }

  const ring = [
    ...leftRing,
    ...endCap,
    ...rightRing.slice().reverse(),
    ...startCap,
    leftRing[0],
  ];
  return turf.polygon([ring]);
}

/**
 * Generate `target` points inside `region` with mixed clustered + uniform distribution.
 */
function seedsInRegion(
  region: Feature<Polygon>,
  target: number,
  clusterCount: number,
  rng: () => number,
  clusterFraction = 0.6
): Feature<Point>[] {
  const bbox = turf.bbox(region);
  const centers: Feature<Point>[] = [];
  let attempts = 0;
  while (centers.length < clusterCount && attempts < 600) {
    attempts++;
    const x = bbox[0] + rng() * (bbox[2] - bbox[0]);
    const y = bbox[1] + rng() * (bbox[3] - bbox[1]);
    const p = turf.point([x, y]);
    if (turf.booleanPointInPolygon(p, region)) centers.push(p);
  }
  const weights = centers.map(() => 0.4 + rng() * 1.6);
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  const gauss = () => (rng() + rng() + rng() + rng() + rng() + rng() - 3) / 1.5;

  const clusteredTarget = Math.round(target * clusterFraction);
  const uniformTarget = target - clusteredTarget;
  const minSpacingKm = 0.22;

  const points: Feature<Point>[] = [];
  const tryAdd = (p: Feature<Point>): boolean => {
    if (!turf.booleanPointInPolygon(p, region)) return false;
    const tooClose = points.some(
      (other) => turf.distance(other, p, { units: 'kilometers' }) < minSpacingKm
    );
    if (tooClose) return false;
    points.push(p);
    return true;
  };

  let safety = 0;
  while (points.length < clusteredTarget && safety < clusteredTarget * 40 && centers.length > 0) {
    safety++;
    let r = rng() * totalWeight;
    let ci = 0;
    while (ci < centers.length - 1 && r > weights[ci]) {
      r -= weights[ci];
      ci++;
    }
    const distanceKm = Math.abs(gauss()) * 3.2;
    const bearing = rng() * 360;
    tryAdd(turf.destination(centers[ci], distanceKm, bearing, { units: 'kilometers' }));
  }

  safety = 0;
  const uniformGoal = points.length + uniformTarget;
  while (points.length < uniformGoal && safety < uniformTarget * 80) {
    safety++;
    const x = bbox[0] + rng() * (bbox[2] - bbox[0]);
    const y = bbox[1] + rng() * (bbox[3] - bbox[1]);
    tryAdd(turf.point([x, y]));
  }
  return points;
}

// Previously used by the along-axis filter; kept around in case we want to
// resurrect "drop parcels past the corridor ends" logic. Currently unused
// because clipping covers it.
// @ts-expect-error -- intentionally retained for potential future use
function alongDistanceKm(
  vertex: number[],
  origin: [number, number],
  bearingDeg: number
): number {
  const mPerDegLat = 111.32;
  const mPerDegLng = 111.32 * Math.cos((origin[1] * Math.PI) / 180);
  const dE = (vertex[0] - origin[0]) * mPerDegLng;
  const dN = (vertex[1] - origin[1]) * mPerDegLat;
  const bRad = (bearingDeg * Math.PI) / 180;
  return dE * Math.sin(bRad) + dN * Math.cos(bRad);
}

/**
 * Generate a corridor of topologically clean, variable-size parcels.
 *
 * Method:
 *  1. Build a corridor polygon (lumpy outline, jittered semicircular caps).
 *  2. Buffer it by ~3 km to define the seeding region — gives Voronoi cells near the
 *     corridor boundary neighbours instead of huge unbounded cells.
 *  3. Seed clustered + uniform points in the buffered region.
 *  4. Compute Voronoi (cells share edges by construction).
 *  5. Keep cells whose CENTROID falls inside the corridor — no clipping, so each
 *     parcel keeps its natural Voronoi shape and the boundary is parcel-scale jagged.
 */
export function generateCorridorParcels(opts: Partial<CorridorOptions> = {}): ParcelCollection {
  const o = { ...DEFAULTS, ...opts };
  const rng = mulberry32(o.seed);

  const corridor = buildCorridorPolygon(o, rng);
  const seedRegion = turf.buffer(corridor, 3.5, { units: 'kilometers' }) as Feature<Polygon>;
  // Oversample so we still have ~numParcels with centroid in the corridor proper.
  const seedTarget = Math.round(o.numParcels * 1.55);
  const seeds = seedsInRegion(seedRegion, seedTarget, o.clusterCount, rng, o.clusterFraction);

  const bBbox = turf.bbox(seedRegion);
  const pad = 0.05;
  const seedBbox: [number, number, number, number] = [
    bBbox[0] - pad,
    bBbox[1] - pad,
    bBbox[2] + pad,
    bBbox[3] + pad,
  ];
  const voronoi = turf.voronoi(turf.featureCollection(seeds), { bbox: seedBbox });

  const corridorBbox = turf.bbox(corridor);
  const corridorCenter = turf.centroid(corridor).geometry.coordinates as [number, number];
  const corridorHalfLenDeg = Math.max(0.05, (corridorBbox[2] - corridorBbox[0]) / 2);

  const features: ParcelFeature[] = [];
  let idIdx = 0;

  voronoi.features.forEach((cell) => {
    if (!cell || !cell.geometry || cell.geometry.type !== 'Polygon') return;
    const polygonCell = cell as Feature<Polygon>;

    // Clip the Voronoi cell to the corridor. Keeping EVERY cell that has area
    // inside the corridor (rather than a centroid-in-corridor filter) means
    // the corridor is fully tiled — no gaps, no holes for the alignment to
    // get lost in.
    let clipped: Feature | null = null;
    try {
      clipped = turf.intersect(
        turf.featureCollection([polygonCell, corridor])
      ) as Feature | null;
    } catch {
      return;
    }
    if (!clipped || !clipped.geometry) return;

    let resultPolygon: Feature<Polygon> | null = null;
    if (clipped.geometry.type === 'Polygon') {
      resultPolygon = clipped as Feature<Polygon>;
    } else if (clipped.geometry.type === 'MultiPolygon') {
      // Rare — the clipped cell broke into pieces. Keep the largest.
      let largest: Feature<Polygon> | null = null;
      let largestArea = 0;
      for (const coords of clipped.geometry.coordinates) {
        const p = turf.polygon(coords);
        const a = turf.area(p);
        if (a > largestArea) {
          largest = p;
          largestArea = a;
        }
      }
      resultPolygon = largest;
    }
    if (!resultPolygon) return;

    const areaHectares = turf.area(resultPolygon) / 10000;
    if (areaHectares < 0.3) return; // drop slivers (e.g., corner shavings)

    const cellCenter = turf.centroid(resultPolygon).geometry.coordinates as [number, number];
    const lonFrac = Math.abs(cellCenter[0] - corridorCenter[0]) / corridorHalfLenDeg;
    const centerness = Math.max(0, 1 - lonFrac);

    const jitter = (amt: number) => (rng() - 0.5) * 2 * amt;
    // Realistic ratios for a major infrastructure corridor (e.g., expressway,
    // pipeline). Construction dominates the project budget (~70-80% of total
    // cost in real-world projects); land + ROW typically lands at 10-25%.
    // Numbers chosen so that the path through ~30 parcels (~50 km) yields
    // a total construction cost in the low billions, matching real linear
    // infrastructure economics.
    const unitConstructionCost = Math.round(28_000 + centerness * 22_000 + jitter(6_000));
    // Rural to peri-urban land at $8k-$45k per hectare.
    const baseUnitLand = 8_000 + centerness * 32_000 + jitter(6_000);
    const noisyTotal = baseUnitLand * areaHectares * (1 + jitter(0.18));
    const landCost = Math.max(2_000, Math.round(noisyTotal));
    // Expropriation premium of 6-14x landCost — court costs + above-market
    // award + delay penalty. Wide enough that reroute remains the agent's
    // preferred option for marginal parcels, producing a healthy mix of
    // blocked-and-rerouted outcomes alongside expropriations.
    // 2–5× landCost expropriation premium. Low premium AND a long X5
    // expropriation duration means the agent's reroute-vs-expropriate
    // decision is dominated by the carry-cost difference (200d locked in
    // for expropriation vs ~88d avg-response for reroute), so reroute
    // wins for a meaningful fraction of refusals → blocked parcels appear
    // regularly without dominating the outcome mix.
    const expropriationMultiplier = 2.0 + rng() * 3.0;
    const expropriationCost = Math.round(landCost * expropriationMultiplier);
    // Wider spread on acceptance probability so the rollouts produce a mix
    // of acquires, easements, expropriations and reroutes. Median ≈ 0.40.
    const acquisitionProbability = Math.max(
      0.08,
      Math.min(0.85, 0.4 - centerness * 0.2 + jitter(0.25))
    );

    const props: ParcelProperties = {
      id: `p-${idIdx.toString().padStart(4, '0')}`,
      unitConstructionCost,
      landCost,
      expropriationCost,
      acquisitionProbability: Number(acquisitionProbability.toFixed(2)),
      status: 'planned',
      areaHectares: Number(areaHectares.toFixed(2)),
    };
    idIdx++;
    features.push({ type: 'Feature', geometry: resultPolygon.geometry, properties: props });
  });

  // Voronoi clipping occasionally leaves disconnected blobs along the
  // corridor boundary — cells whose seed sits in the buffer-ring outside the
  // corridor but whose clipped portion ended up isolated from the main
  // corpus when the boundary cut them off from their seed-graph neighbours.
  // Keep only the largest connected component (shared-edge adjacency).
  return largestConnectedComponent({ type: 'FeatureCollection', features });
}

/**
 * Filter a parcel collection down to its largest connected component, where
 * "connected" means parcels share a Voronoi boundary edge (the same adjacency
 * the router uses). Drops the orphan blobs that the clipping step sometimes
 * strands along the corridor boundary.
 */
function largestConnectedComponent(fc: ParcelCollection): ParcelCollection {
  if (fc.features.length === 0) return fc;
  const adj = buildAdjacency(fc);
  const visited = new Set<string>();
  let best: string[] = [];
  for (const feat of fc.features) {
    const start = feat.properties.id;
    if (visited.has(start)) continue;
    const stack = [start];
    const component: string[] = [];
    while (stack.length > 0) {
      const id = stack.pop()!;
      if (visited.has(id)) continue;
      visited.add(id);
      component.push(id);
      const nbrs = adj.get(id);
      if (nbrs) for (const n of nbrs) if (!visited.has(n)) stack.push(n);
    }
    if (component.length > best.length) best = component;
  }
  const keep = new Set(best);
  return {
    type: 'FeatureCollection',
    features: fc.features.filter((f) => keep.has(f.properties.id)),
  };
}

export function defaultDestinations(opts: Partial<CorridorOptions> = {}): [number, number][] {
  const o = { ...DEFAULTS, ...opts };
  const end = turf.destination(turf.point(o.origin), o.lengthKm, o.bearingDeg, {
    units: 'kilometers',
  }).geometry.coordinates as [number, number];
  return [o.origin, end];
}

export function corridorCenter(opts: Partial<CorridorOptions> = {}): [number, number] {
  const o = { ...DEFAULTS, ...opts };
  return turf.destination(turf.point(o.origin), o.lengthKm / 2, o.bearingDeg, {
    units: 'kilometers',
  }).geometry.coordinates as [number, number];
}
