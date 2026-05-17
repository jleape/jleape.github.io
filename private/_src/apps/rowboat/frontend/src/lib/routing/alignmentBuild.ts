/**
 * Shared helper for the AlignmentLayer / BoatLayer / FishingLayer to rebuild
 * the smoothed alignment polyline for *any* parcel-path (plan or scenario)
 * using the same control-point + Catmull-Rom recipe as `computeAutoAlignment`.
 *
 * Returns the smoothed polyline (coords for a Leaflet polyline), plus the
 * per-parcel "exit points" (boundary midpoints between consecutive path
 * parcels) so callers can place the boat at the leading edge of the
 * obtained-ROW prefix without doing their own geometry.
 *
 * INTERMEDIATE destinations are inserted as explicit control points where
 * their host parcel lives on the path. Without this the spline merely
 * grazes the parcel that contains an intermediate destination — sometimes
 * passing a parcel-width away from the actual destination point on the
 * map. With it, the spline interpolates exactly through every destination.
 */

import * as turf from '@turf/turf';
import type { DestinationFeature, ParcelFeature } from '@/types';
import { catmullRomSmooth, sharedEdgeMidpoint } from './smooth';

export interface BuiltAlignment {
  /** Smoothed lng/lat polyline. Empty if path is too short. */
  smoothed: number[][];
  /** Control points (pre-smoothing): startDest, then for each parcel-pair
   *  the boundary midpoint (+ any intermediate destinations whose host is
   *  that parcel), then endDest. */
  controlPoints: number[][];
  /** `exitPoints[i]` is where the polyline leaves parcel `path[i]`. Equal
   *  to the boundary midpoint between path[i] and path[i+1] for i < N-1;
   *  the end destination for i = N-1. Always on the smoothed curve since
   *  Catmull-Rom interpolates every control point. */
  exitPoints: number[][];
  /** `exitControlIndices[i]` is the index of `exitPoints[i]` inside
   *  `controlPoints`. With each Catmull-Rom segment producing
   *  `samplesPerSegment` smoothed points, the smoothed-array index for
   *  exit `i` is `exitControlIndices[i] * samplesPerSegment`. */
  exitControlIndices: number[];
  samplesPerSegment: number;
}

const SAMPLES = 8;

/**
 * Find, for each intermediate destination (i.e., every destination that
 * isn't the polyline's start or end), the path-index of its host parcel.
 * Returns a map `path-index → list of destination coords`. Multiple
 * destinations occasionally share a host parcel; the list preserves their
 * order of appearance in `sortedDestinations`.
 */
function destinationsByPathIndex(
  path: string[],
  parcelsById: Map<string, ParcelFeature>,
  sortedDestinations: DestinationFeature[]
): Map<number, number[][]> {
  const out = new Map<number, number[][]>();
  for (let d = 1; d < sortedDestinations.length - 1; d++) {
    const coord = sortedDestinations[d].geometry.coordinates as number[];
    const pt = turf.point(coord);
    for (let i = 0; i < path.length; i++) {
      const parcel = parcelsById.get(path[i]);
      if (!parcel) continue;
      if (turf.booleanPointInPolygon(pt, parcel)) {
        const list = out.get(i) ?? [];
        list.push(coord);
        out.set(i, list);
        break;
      }
    }
  }
  return out;
}

/**
 * Build a smoothed alignment from a parcel-path + destination endpoints.
 */
export function buildSmoothAlignment(
  path: string[],
  parcelsById: Map<string, ParcelFeature>,
  sortedDestinations: DestinationFeature[]
): BuiltAlignment {
  if (path.length === 0 || sortedDestinations.length < 2) {
    return {
      smoothed: [],
      controlPoints: [],
      exitPoints: [],
      exitControlIndices: [],
      samplesPerSegment: SAMPLES,
    };
  }
  const startDest = sortedDestinations[0].geometry.coordinates as number[];
  const endDest =
    sortedDestinations[sortedDestinations.length - 1].geometry.coordinates as number[];
  const destMap = destinationsByPathIndex(path, parcelsById, sortedDestinations);

  const controlPoints: number[][] = [startDest];
  const exitPoints: number[][] = [];
  const exitControlIndices: number[] = [];

  // Walk the path. After every boundary midpoint we insert any intermediate
  // destinations whose host parcel is the one we just entered.
  for (let i = 0; i < path.length - 1; i++) {
    const a = parcelsById.get(path[i]);
    const b = parcelsById.get(path[i + 1]);
    if (!a || !b) continue;
    const mid =
      sharedEdgeMidpoint(a, b) ??
      (turf.centroid(b).geometry.coordinates as number[]);
    controlPoints.push(mid);
    exitPoints.push(mid);
    exitControlIndices.push(controlPoints.length - 1);
    // After entering parcel path[i+1] via that boundary midpoint, route
    // the spline through any intermediate destinations sitting in that
    // parcel.
    const dests = destMap.get(i + 1);
    if (dests) for (const d of dests) controlPoints.push(d);
  }
  controlPoints.push(endDest);
  exitPoints.push(endDest);
  exitControlIndices.push(controlPoints.length - 1);

  const smoothed = catmullRomSmooth(controlPoints, SAMPLES, 0.5);
  return {
    smoothed,
    controlPoints,
    exitPoints,
    exitControlIndices,
    samplesPerSegment: SAMPLES,
  };
}

/**
 * Split a smoothed alignment into a SOLID prefix and a DASHED suffix at the
 * leading edge of the obtained-ROW prefix. `lastObtained` is the largest
 * index `k` of the parcel-path such that every parcel up to and including
 * `path[k]` has had its ROW obtained. -1 means nothing obtained yet.
 */
export function splitAlignmentByPrefix(
  built: BuiltAlignment,
  lastObtained: number
): { solid: number[][]; dashed: number[][] } {
  const { smoothed, samplesPerSegment, exitControlIndices } = built;
  if (smoothed.length < 2) return { solid: [], dashed: smoothed };
  if (lastObtained < 0) return { solid: [], dashed: smoothed };
  const k = Math.min(exitControlIndices.length - 1, lastObtained);
  const cpIndex = exitControlIndices[k];
  const cutIndex = Math.min(smoothed.length - 1, cpIndex * samplesPerSegment);
  if (cutIndex >= smoothed.length - 1) return { solid: smoothed, dashed: [] };
  return {
    solid: smoothed.slice(0, cutIndex + 1),
    dashed: smoothed.slice(cutIndex), // overlap one point so the two lines join
  };
}
