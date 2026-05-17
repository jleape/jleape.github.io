import { useMemo } from 'react';
import { Polyline } from 'react-leaflet';
import * as turf from '@turf/turf';
import type { Feature, LineString } from 'geojson';
import { useAlignmentStore } from '@/state/alignmentStore';
import { useDestinationsStore } from '@/state/destinationsStore';
import { useParcelsStore } from '@/state/parcelsStore';
import { usePolicyStore } from '@/state/policyStore';
import { useUiStore } from '@/state/uiStore';
import { scenarioStateAt } from '@/state/scenarioView';
import { buildSmoothAlignment } from '@/lib/routing/alignmentBuild';
import type { ParcelFeature } from '@/types';

// Strip colours, chosen to read against the dark basemap and the magenta
// alignment line.
//
//   EASEMENT       — green strip. The developer obtained a perpetual
//                    right-of-use along the alignment without taking title.
//   EXPROPRIATION  — yellow strip. Same buffer band but secured through
//                    forced acquisition (condemnation).
const EASEMENT_FILL = '#22c55e';      // green-500
const EXPROP_FILL = '#facc15';        // yellow-400

type LngLat = [number, number];

function toLatLng(coords: number[][]): LngLat[] {
  return coords.map(([lng, lat]) => [lat, lng] as LngLat);
}

/**
 * For a polyline transitioning from `outside` → `inside` (or vice-versa)
 * across the parcel boundary, return the lng/lat point where the segment
 * actually crosses. Uses turf.lineIntersect which handles convex and
 * concave polygons cleanly. If there are multiple boundary crossings
 * inside the segment, take the one closest to `from` so we land on the
 * boundary edge nearest the outside endpoint.
 */
function boundaryCrossing(
  from: number[],
  to: number[],
  parcel: ParcelFeature
): number[] | null {
  const seg = turf.lineString([from, to]);
  const ix = turf.lineIntersect(seg, parcel);
  if (ix.features.length === 0) return null;
  let best = ix.features[0].geometry.coordinates;
  let bestD = (best[0] - from[0]) ** 2 + (best[1] - from[1]) ** 2;
  for (let i = 1; i < ix.features.length; i++) {
    const c = ix.features[i].geometry.coordinates;
    const d = (c[0] - from[0]) ** 2 + (c[1] - from[1]) ** 2;
    if (d < bestD) {
      best = c;
      bestD = d;
    }
  }
  return [best[0], best[1]];
}

/**
 * Walk a polyline and emit the contiguous runs of coordinates that fall
 * inside `parcel`. At each inside↔outside transition the segment is
 * clipped EXACTLY at the parcel boundary (via line-intersect) so the
 * strip stops at the parcel edge instead of overshooting into a
 * neighbour.
 */
function segmentsInsideParcel(coords: number[][], parcel: ParcelFeature): number[][][] {
  if (coords.length < 2) return [];
  const inside: number[][][] = [];
  let current: number[][] | null = null;
  let prevInside = false;
  for (let i = 0; i < coords.length; i++) {
    const isIn = turf.booleanPointInPolygon(turf.point(coords[i]), parcel);
    if (i === 0) {
      if (isIn) current = [coords[i].slice()];
    } else if (isIn && prevInside) {
      current!.push(coords[i].slice());
    } else if (isIn && !prevInside) {
      // outside → inside: clip the segment at the boundary, then continue
      // with the inside sample.
      const cross = boundaryCrossing(coords[i - 1], coords[i], parcel);
      current = [];
      if (cross) current.push(cross);
      current.push(coords[i].slice());
    } else if (!isIn && prevInside) {
      // inside → outside: clip at the boundary and close the segment.
      const cross = boundaryCrossing(coords[i - 1], coords[i], parcel);
      if (cross && current) current.push(cross);
      if (current && current.length >= 2) inside.push(current);
      current = null;
    }
    prevInside = isIn;
  }
  if (current && current.length >= 2) inside.push(current);
  return inside;
}

/**
 * AlignmentStripLayer
 *
 * Two related overlays, both anchored to the alignment polyline:
 *
 *   - EASEMENT strips: blue band along the alignment inside any parcel
 *     whose ROW the developer obtained via a strip-of-use easement
 *     (perpetual right of use without title transfer).
 *
 *   - EXPROPRIATION strips: cyan band with a red outline along the
 *     alignment inside any expropriated parcel. The visual conveys that
 *     condemnation only takes the buffer the project actually needs — the
 *     owner keeps the remainder of the parcel.
 *
 * Both are rendered as a 2-pass polyline (outline first, fill on top) so
 * the outline is visible on busy basemaps.
 */
export function AlignmentStripLayer() {
  const show = useUiStore((s) => s.showAlignment);
  const parcels = useParcelsStore((s) => s.parcels);
  const destinations = useDestinationsStore((s) => s.destinations);
  const planSmoothed = useAlignmentStore(
    (s) => s.alignment?.geometry.coordinates as number[][] | undefined
  );
  const scenario = usePolicyStore((s) =>
    s.currentScenarioIndex != null && s.result
      ? s.result.scenarios[s.currentScenarioIndex]
      : null
  );
  const stepIndex = usePolicyStore((s) => s.currentStepIndex);

  const parcelsById = useMemo(
    () => new Map(parcels.features.map((f) => [f.properties.id, f])),
    [parcels]
  );
  const sortedDest = useMemo(
    () => [...destinations].sort((a, b) => a.properties.order - b.properties.order),
    [destinations]
  );

  const { easementIds, expropriatedIds, alignmentCoords } = useMemo<{
    easementIds: Set<string>;
    expropriatedIds: Set<string>;
    alignmentCoords: number[][];
  }>(() => {
    if (scenario) {
      const view = scenarioStateAt(scenario, stepIndex);
      const events = scenario.events ?? [];
      const stepEv = stepIndex != null ? events[stepIndex] : null;
      const path = stepEv?.pathAfter ?? events[events.length - 1]?.pathAfter ?? [];
      const built = buildSmoothAlignment(path, parcelsById, sortedDest);
      return {
        easementIds: new Set(view.easement),
        expropriatedIds: new Set(view.expropriated),
        alignmentCoords: built.smoothed,
      };
    }
    const e = new Set<string>();
    const x = new Set<string>();
    for (const f of parcels.features) {
      if (f.properties.status === 'easement') e.add(f.properties.id);
      // No pre-set "expropriated" status in plan mode; only scenarios show
      // expropriations.
    }
    return { easementIds: e, expropriatedIds: x, alignmentCoords: planSmoothed ?? [] };
  }, [scenario, stepIndex, parcelsById, sortedDest, parcels, planSmoothed]);

  const easementStrips = useMemo(
    () => stripsFor(easementIds, alignmentCoords, parcelsById),
    [easementIds, alignmentCoords, parcelsById]
  );
  const expropStrips = useMemo(
    () => stripsFor(expropriatedIds, alignmentCoords, parcelsById),
    [expropriatedIds, alignmentCoords, parcelsById]
  );

  if (!show) return null;
  if (easementStrips.length === 0 && expropStrips.length === 0) return null;

  return (
    <>
      {easementStrips.map((s, i) => (
        <Polyline
          key={`easement-${i}`}
          positions={toLatLng(s.geometry.coordinates)}
          pane="stripsPane"
          pathOptions={{
            color: EASEMENT_FILL,
            weight: 8,
            opacity: 0.85,
            lineCap: 'butt',
            lineJoin: 'round',
            interactive: false,
          }}
        />
      ))}
      {expropStrips.map((s, i) => (
        <Polyline
          key={`exp-${i}`}
          positions={toLatLng(s.geometry.coordinates)}
          pane="stripsPane"
          pathOptions={{
            color: EXPROP_FILL,
            weight: 8,
            opacity: 0.9,
            lineCap: 'butt',
            lineJoin: 'round',
            interactive: false,
          }}
        />
      ))}
    </>
  );
}

function stripsFor(
  ids: Set<string>,
  alignmentCoords: number[][],
  parcelsById: Map<string, ParcelFeature>
): Feature<LineString>[] {
  if (alignmentCoords.length < 2 || ids.size === 0) return [];
  const out: Feature<LineString>[] = [];
  for (const pid of ids) {
    const parcel = parcelsById.get(pid);
    if (!parcel) continue;
    for (const seg of segmentsInsideParcel(alignmentCoords, parcel)) {
      if (seg.length >= 2) out.push(turf.lineString(seg));
    }
  }
  return out;
}
