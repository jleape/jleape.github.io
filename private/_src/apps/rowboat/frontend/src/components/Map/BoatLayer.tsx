import { useMemo } from 'react';
import L from 'leaflet';
import { Marker } from 'react-leaflet';
import * as turf from '@turf/turf';
import { useAlignmentStore } from '@/state/alignmentStore';
import { useUiStore } from '@/state/uiStore';
import { usePolicyStore } from '@/state/policyStore';
import { useParcelsStore } from '@/state/parcelsStore';
import { useDestinationsStore } from '@/state/destinationsStore';
import { scenarioStateAt } from '@/state/scenarioView';
import { rowboatSvgMarkup } from '@/components/RowboatIcon';
import { buildSmoothAlignment } from '@/lib/routing/alignmentBuild';
import type { BuiltAlignment } from '@/lib/routing/alignmentBuild';

export type LngLat = [number, number];

// White boat hull on the map — reads cleanly against the dark basemap and
// the magenta alignment line. Used everywhere; the alignment colour conveys
// plan-vs-scenario mode, not the boat.
const BOAT_COLOR = '#ffffff';

export interface BoatPlacement {
  position: LngLat;
  /** Compass-style bearing in degrees (0 = north). Used to flip the icon
   *  horizontally when motion is westward so the bow leads. */
  bearingDeg: number;
  /** Always white on the map (see BOAT_COLOR). */
  color: string;
  /** True when the boat is at the very start (no parcels obtained yet). */
  atDock: boolean;
}

function obtainedPrefixEnd(parcelPath: string[], obtained: Set<string>): number {
  let k = -1;
  for (let i = 0; i < parcelPath.length; i++) {
    if (obtained.has(parcelPath[i])) k = i;
    else break;
  }
  return k;
}

function bearingBetween(a: LngLat, b: LngLat): number {
  return turf.bearing(turf.point(a), turf.point(b));
}

/**
 * Place the boat at the leading edge of the SOLID alignment segment — the
 * boundary midpoint between the last obtained parcel and the next one. When
 * nothing is obtained yet the boat sits at the start destination ("the
 * dock"); when everything is obtained, at the end destination.
 *
 * Anchoring to the polyline's CONTROL POINTS (not the centroid) keeps the
 * boat on the alignment line as it advances/retreats — Catmull-Rom passes
 * through every control point so each exit point is also on the curve.
 */
function placeBoatOnAlignment(
  built: BuiltAlignment,
  parcelPath: string[],
  obtained: Set<string>
): BoatPlacement | null {
  if (built.smoothed.length < 2 || parcelPath.length === 0) {
    if (built.smoothed.length >= 2) {
      const a = built.smoothed[0] as LngLat;
      const b = built.smoothed[1] as LngLat;
      return { position: a, bearingDeg: bearingBetween(a, b), color: BOAT_COLOR, atDock: true };
    }
    return null;
  }
  const k = obtainedPrefixEnd(parcelPath, obtained);
  if (k < 0) {
    const a = built.smoothed[0] as LngLat;
    const b = built.smoothed[1] as LngLat;
    return { position: a, bearingDeg: bearingBetween(a, b), color: BOAT_COLOR, atDock: true };
  }
  // exitPoints[k] is on the smoothed line (Catmull-Rom interpolates control
  // points). Use it directly so the boat sits ON the curve, not off it.
  const position = built.exitPoints[k] as LngLat;
  // Heading: from the previous control point toward this exit point (the
  // direction the boat just travelled). For the very last parcel (boat at
  // end dest), use the previous exit point as the "from".
  const prevControlIdx = Math.max(0, (k + 1) - 1);
  const prev = built.controlPoints[prevControlIdx] as LngLat | undefined;
  const next = built.controlPoints[k + 2] as LngLat | undefined;
  let bearingDeg = 0;
  if (next) bearingDeg = bearingBetween(position, next);
  else if (prev) bearingDeg = bearingBetween(prev, position);
  return { position, bearingDeg, color: BOAT_COLOR, atDock: false };
}

/**
 * Side-view rowboat marker. The boat stays upright on the map (no bearing
 * rotation) so it's always recognisable as a rowboat; the only direction
 * cue is a horizontal flip when the heading has a westward component.
 */
function makeBoatIcon(bearingDeg: number, color: string): L.DivIcon {
  const flipped = bearingDeg < 0 || bearingDeg > 180;
  const size = 88;
  const html = `<div class="boat-anchor">${rowboatSvgMarkup({
    hullColor: color,
    flipped,
    size,
  })}</div>`;
  return L.divIcon({
    html,
    className: 'boat-icon-wrapper',
    iconSize: [size, Math.round(size * 0.5)],
    iconAnchor: [Math.round(size / 2), Math.round(size * 0.25)],
  });
}

/**
 * Shared hook used by BoatLayer + FishingLayer so the fishing lines/fish
 * always anchor to the same boat position used by the marker.
 *
 * Plan view uses the autoAlignment store's exitPoints; scenario view
 * rebuilds the smoothed alignment from the displayed step's pathAfter so
 * the boat snaps to the same boundary midpoints the alignment renders.
 */
export function useBoatPlacement(): BoatPlacement | null {
  const show = useUiStore((s) => s.showAlignment);
  const planSmoothed = useAlignmentStore(
    (s) => s.alignment?.geometry.coordinates as number[][] | undefined
  );
  const planPath = useAlignmentStore((s) => s.parcelPath);
  const planExitPoints = useAlignmentStore((s) => s.exitPoints);
  const planExitControlIndices = useAlignmentStore((s) => s.exitControlIndices);
  const planSamples = useAlignmentStore((s) => s.samplesPerSegment);
  const parcels = useParcelsStore((s) => s.parcels);
  const destinations = useDestinationsStore((s) => s.destinations);
  const scenario = usePolicyStore((s) =>
    s.currentScenarioIndex != null && s.result
      ? s.result.scenarios[s.currentScenarioIndex]
      : null
  );
  const stepIndex = usePolicyStore((s) => s.currentStepIndex);

  return useMemo<BoatPlacement | null>(() => {
    if (!show) return null;

    if (scenario) {
      const events = scenario.events ?? [];
      const stepEv = stepIndex != null ? events[stepIndex] : null;
      const path = stepEv?.pathAfter ?? events[events.length - 1]?.pathAfter ?? [];
      if (path.length === 0) return null;
      const byId = new Map(parcels.features.map((f) => [f.properties.id, f]));
      const sortedDest = [...destinations].sort(
        (a, b) => a.properties.order - b.properties.order
      );
      if (sortedDest.length < 2) return null;
      const built = buildSmoothAlignment(path, byId, sortedDest);
      const view = scenarioStateAt(scenario, stepIndex);
      const obtained = new Set<string>([
        ...view.acquired,
        ...view.easement,
        ...view.expropriated,
      ]);
      return placeBoatOnAlignment(built, path, obtained);
    }

    if (planSmoothed && planSmoothed.length >= 2) {
      const obtained = new Set<string>();
      for (const f of parcels.features) {
        const st = f.properties.status;
        if (st === 'acquired' || st === 'easement') obtained.add(f.properties.id);
      }
      // Reconstruct minimal controlPoints from the smoothed line so the
      // bearing helper has previous/next anchors. The control point at
      // index i is at smoothed[i × samples].
      const samples = planSamples || 8;
      const cp: number[][] = [];
      for (let i = 0; i * samples < planSmoothed.length; i++) cp.push(planSmoothed[i * samples]);
      const built: BuiltAlignment = {
        smoothed: planSmoothed,
        controlPoints: cp,
        exitPoints: planExitPoints,
        exitControlIndices: planExitControlIndices,
        samplesPerSegment: samples,
      };
      return placeBoatOnAlignment(built, planPath, obtained);
    }

    return null;
  }, [
    show,
    scenario,
    stepIndex,
    parcels,
    destinations,
    planSmoothed,
    planExitPoints,
    planExitControlIndices,
    planSamples,
    planPath,
  ]);
}

export function BoatLayer() {
  const placement = useBoatPlacement();

  const icon = useMemo(
    () => (placement ? makeBoatIcon(placement.bearingDeg, placement.color) : null),
    [placement]
  );

  if (!placement || !icon) return null;
  const [lng, lat] = placement.position;
  return (
    <Marker
      position={[lat, lng]}
      icon={icon}
      pane="destinationsPane"
      interactive={false}
      keyboard={false}
    />
  );
}
