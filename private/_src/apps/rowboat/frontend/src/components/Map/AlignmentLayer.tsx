import { useMemo } from 'react';
import { Polyline } from 'react-leaflet';
import { useAlignmentStore } from '@/state/alignmentStore';
import { useUiStore } from '@/state/uiStore';
import { usePolicyStore } from '@/state/policyStore';
import { useParcelsStore } from '@/state/parcelsStore';
import { useDestinationsStore } from '@/state/destinationsStore';
import { scenarioStateAt } from '@/state/scenarioView';
import {
  buildSmoothAlignment,
  splitAlignmentByPrefix,
  type BuiltAlignment,
} from '@/lib/routing/alignmentBuild';

// Magenta family for the alignment — chosen to stand clear of the cyan/lime
// choropleth and the slate/red/green/amber parcel-status palette. Lighter
// magenta for the deterministic plan, hotter pink for the realised scenario
// run so the two read distinctly when they overlap.
const PLAN_COLOR = '#f0abfc'; // fuchsia-300
const SCENARIO_COLOR = '#e879f9'; // fuchsia-400

type LngLat = [number, number];

function toLatLng(coords: number[][]): LngLat[] {
  return coords.map(([lng, lat]) => [lat, lng] as LngLat);
}

function obtainedPrefixEnd(parcelPath: string[], obtained: Set<string>): number {
  let last = -1;
  for (let i = 0; i < parcelPath.length; i++) {
    if (obtained.has(parcelPath[i])) last = i;
    else break;
  }
  return last;
}

export function AlignmentLayer() {
  const planSmoothed = useAlignmentStore((s) => s.alignment?.geometry.coordinates as number[][] | undefined);
  const planPath = useAlignmentStore((s) => s.parcelPath);
  const planExitPoints = useAlignmentStore((s) => s.exitPoints);
  const planExitControlIndices = useAlignmentStore((s) => s.exitControlIndices);
  const planSamples = useAlignmentStore((s) => s.samplesPerSegment);
  const show = useUiStore((s) => s.showAlignment);
  const scenario = usePolicyStore((s) =>
    s.currentScenarioIndex != null && s.result
      ? s.result.scenarios[s.currentScenarioIndex]
      : null
  );
  const stepIndex = usePolicyStore((s) => s.currentStepIndex);
  const parcels = useParcelsStore((s) => s.parcels);
  const destinations = useDestinationsStore((s) => s.destinations);

  // Reusable helpers — both scenario step and final views rebuild the
  // smoothed polyline from the scenario's parcel path at render time.
  const parcelsById = useMemo(
    () => new Map(parcels.features.map((f) => [f.properties.id, f])),
    [parcels]
  );
  const sortedDest = useMemo(
    () => [...destinations].sort((a, b) => a.properties.order - b.properties.order),
    [destinations]
  );

  const scenarioBuilt: { built: BuiltAlignment; path: string[] } | null = useMemo(() => {
    if (!scenario) return null;
    const events = scenario.events ?? [];
    const stepEv = stepIndex != null ? events[stepIndex] : null;
    const path = stepEv?.pathAfter ?? events[events.length - 1]?.pathAfter ?? [];
    if (path.length === 0) return null;
    const built = buildSmoothAlignment(path, parcelsById, sortedDest);
    return { built, path };
  }, [scenario, stepIndex, parcelsById, sortedDest]);

  if (!show) return null;

  // Plan mode: solid from start through parcels whose user-set status is
  // acquired or easement; dashed for the rest.
  if (!scenario) {
    if (!planSmoothed || planSmoothed.length < 2 || planPath.length === 0) return null;
    const obtainedPlan = new Set<string>();
    for (const f of parcels.features) {
      const st = f.properties.status;
      if (st === 'acquired' || st === 'easement') obtainedPlan.add(f.properties.id);
    }
    const lastObtained = obtainedPrefixEnd(planPath, obtainedPlan);
    return renderSplit(
      {
        smoothed: planSmoothed,
        controlPoints: [],
        exitPoints: planExitPoints,
        exitControlIndices: planExitControlIndices,
        samplesPerSegment: planSamples,
      },
      lastObtained,
      PLAN_COLOR
    );
  }

  // Scenario mode (step or final) — same smoothing recipe applied to the
  // path the agent was following at the displayed step.
  if (!scenarioBuilt) return null;
  const view = scenarioStateAt(scenario, stepIndex);
  const obtained = new Set<string>([
    ...view.acquired,
    ...view.easement,
    ...view.expropriated,
  ]);
  const lastObtained = obtainedPrefixEnd(scenarioBuilt.path, obtained);
  return renderSplit(scenarioBuilt.built, lastObtained, SCENARIO_COLOR);
}

function renderSplit(built: BuiltAlignment, lastObtained: number, color: string) {
  const { solid, dashed } = splitAlignmentByPrefix(built, lastObtained);
  return (
    <>
      {dashed.length >= 2 && (
        <Polyline
          positions={toLatLng(dashed)}
          pane="alignmentPane"
          pathOptions={{ color, weight: 3, opacity: 0.85, dashArray: '6 6' }}
        />
      )}
      {solid.length >= 2 && (
        <Polyline
          positions={toLatLng(solid)}
          pane="alignmentPane"
          pathOptions={{ color, weight: 3.5, opacity: 0.95 }}
        />
      )}
    </>
  );
}
