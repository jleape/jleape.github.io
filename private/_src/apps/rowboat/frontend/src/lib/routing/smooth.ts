import * as turf from '@turf/turf';
import type { Feature, LineString } from 'geojson';
import type { ParcelFeature } from '@/types';

type LngLat = [number, number];

/**
 * Centripetal Catmull-Rom spline through `points`. Generates a C¹-smooth
 * curve that interpolates every control point (so destination endpoints
 * stay exact) and stays close to the control polygon without overshoot —
 * key for keeping the curve inside the path-parcel corridor.
 *
 *   - `samples` per segment (linear count, not arc-length).
 *   - `alpha = 0.5` is the centripetal variant; 0 = uniform, 1 = chordal.
 *
 * For a polyline of fewer than 4 points we fall back to the input so a
 * 2-destination start/end-only run doesn't crash.
 */
export function catmullRomSmooth(
  points: number[][],
  samples = 8,
  alpha = 0.5
): number[][] {
  if (points.length < 2) return points.slice();
  if (points.length === 2) return points.slice();

  const out: number[][] = [points[0].slice()];
  const n = points.length;
  for (let i = 0; i < n - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(n - 1, i + 2)];

    const t = (a: number[], b: number[]): number => {
      const d = Math.hypot(b[0] - a[0], b[1] - a[1]);
      return Math.pow(Math.max(d, 1e-12), alpha);
    };
    const t0 = 0;
    const t1 = t0 + t(p0, p1);
    const t2 = t1 + t(p1, p2);
    const t3 = t2 + t(p2, p3);

    for (let j = 1; j <= samples; j++) {
      const u = t1 + ((t2 - t1) * j) / samples;
      const a1 = lerp(p0, p1, safeRatio(u - t0, t1 - t0));
      const a2 = lerp(p1, p2, safeRatio(u - t1, t2 - t1));
      const a3 = lerp(p2, p3, safeRatio(u - t2, t3 - t2));
      const b1 = lerp(a1, a2, safeRatio(u - t0, t2 - t0));
      const b2 = lerp(a2, a3, safeRatio(u - t1, t3 - t1));
      const c = lerp(b1, b2, safeRatio(u - t1, t2 - t1));
      out.push(c);
    }
  }
  return out;
}

function lerp(a: number[], b: number[], t: number): number[] {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
}

function safeRatio(n: number, d: number): number {
  if (d === 0) return 0;
  return n / d;
}

/**
 * Coords of the smoothed line that pass through any blocked parcel. The
 * caller can use this to fall back to the un-smoothed control polyline when
 * the spline strays out of the path-parcel corridor.
 */
export function lineCrossesAny(
  line: number[][],
  obstacles: ParcelFeature[]
): boolean {
  if (line.length < 2 || obstacles.length === 0) return false;
  const ls: Feature<LineString> = turf.lineString(line);
  for (const o of obstacles) {
    if (turf.booleanIntersects(ls, o)) return true;
  }
  return false;
}

/**
 * Midpoint of the shared boundary edge between two Voronoi-adjacent parcels.
 * Voronoi cells share exact coordinate pairs along their boundary, so we
 * scan ring `a` for any segment whose endpoints also appear (as a pair) in
 * ring `b`. Returns `null` for non-adjacent parcels.
 *
 * Used to switch alignment waypoints from centroids (interior points) to
 * boundary midpoints (the literal crossing point between two parcels), so
 * the polyline transitions cleanly across the boundary and naturally
 * follows the corridor between the path parcels.
 */
export function sharedEdgeMidpoint(
  a: ParcelFeature,
  b: ParcelFeature
): LngLat | null {
  const ringA = a.geometry.coordinates[0];
  const ringB = b.geometry.coordinates[0];
  const precision = 7;
  const k = (c: number[]) =>
    `${c[0].toFixed(precision)},${c[1].toFixed(precision)}`;
  // Build the set of un-ordered edge keys present in b.
  const edgesB = new Set<string>();
  for (let i = 0; i < ringB.length - 1; i++) {
    const k1 = k(ringB[i]);
    const k2 = k(ringB[i + 1]);
    edgesB.add(k1 < k2 ? `${k1}|${k2}` : `${k2}|${k1}`);
  }
  for (let i = 0; i < ringA.length - 1; i++) {
    const k1 = k(ringA[i]);
    const k2 = k(ringA[i + 1]);
    const key = k1 < k2 ? `${k1}|${k2}` : `${k2}|${k1}`;
    if (edgesB.has(key)) {
      return [
        (ringA[i][0] + ringA[i + 1][0]) / 2,
        (ringA[i][1] + ringA[i + 1][1]) / 2,
      ];
    }
  }
  return null;
}
