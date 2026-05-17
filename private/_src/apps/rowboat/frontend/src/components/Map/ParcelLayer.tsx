import { GeoJSON } from 'react-leaflet';
import { useMemo } from 'react';
import type { PathOptions } from 'leaflet';
import { useParcelsStore } from '@/state/parcelsStore';
import { useUiStore } from '@/state/uiStore';
import { usePolicyStore } from '@/state/policyStore';
import { scenarioStateAt } from '@/state/scenarioView';
import { computeColorScale, statusStyle } from '@/lib/geo/choropleth';
import type { ParcelFeature } from '@/types';

export function ParcelLayer() {
  const parcels = useParcelsStore((s) => s.parcels);
  // Demo: parcel editing is removed. We still track selectedId for highlight
  // continuity but never set it from a click handler.
  const selectedId = null;
  const choropleth = useUiStore((s) => s.choropleth);
  const show = useUiStore((s) => s.showParcels);
  const scenario = usePolicyStore((s) =>
    s.currentScenarioIndex != null && s.result
      ? s.result.scenarios[s.currentScenarioIndex]
      : null
  );
  const stepIndex = usePolicyStore((s) => s.currentStepIndex);
  const highlightFirstActions = useUiStore((s) => s.highlightFirstActions);
  const firstActionIds = usePolicyStore((s) =>
    s.result ? new Set(s.result.firstActions.map((a) => a.parcelId)) : new Set<string>()
  );

  const view = useMemo(
    () => (scenario ? scenarioStateAt(scenario, stepIndex) : null),
    [scenario, stepIndex]
  );
  const currentTarget =
    scenario && stepIndex != null && scenario.events?.[stepIndex]
      ? scenario.events[stepIndex].parcelId
      : null;

  const scale = useMemo(
    () => computeColorScale(parcels.features, choropleth),
    [parcels.features, choropleth]
  );

  const key = `${choropleth}-${parcels.features.length}-${
    scenario ? scenario.scenarioId : 'plan'
  }-${stepIndex ?? 'final'}-${highlightFirstActions ? 'hl' : 'nh'}`;

  if (!show || parcels.features.length === 0) return null;

  const baseStyle = (feature?: ParcelFeature): PathOptions => {
    if (!feature) return {};
    const props = feature.properties;
    const id = props.id;
    const isSelected = id === selectedId;
    const isCurrentTarget = id === currentTarget;

    if (view) {
      // All ROW obtained reads as a green fill; the BORDER COLOR distinguishes
      // how it was obtained (consensual sale vs easement vs forced).
      const greenFill = '#16a34a';
      if (view.acquired.has(id)) {
        return {
          fillColor: greenFill,
          fillOpacity: 0.55,
          color: isCurrentTarget ? '#0f172a' : isSelected ? '#0066ff' : '#15803d',
          weight: isCurrentTarget ? 3 : isSelected ? 3 : 1.5,
        };
      }
      if (view.easement.has(id)) {
        // Easement — strip-of-use ROW. Parcel stays unfilled with a green
        // outline; the AlignmentStripLayer paints the green strip along
        // the alignment band inside this parcel.
        return {
          fillColor: '#475569',
          fillOpacity: 0,
          color: isCurrentTarget ? '#0f172a' : isSelected ? '#0066ff' : '#16a34a',
          weight: isCurrentTarget ? 3 : isSelected ? 3 : 1.6,
        };
      }
      if (view.expropriated.has(id)) {
        // Forced acquisition only takes the alignment buffer, not the
        // whole parcel — the AlignmentStripLayer paints a yellow strip
        // along the alignment band. Parcel itself is unfilled with a
        // yellow outline.
        return {
          fillColor: '#475569',
          fillOpacity: 0,
          color: isCurrentTarget ? '#0f172a' : isSelected ? '#0066ff' : '#eab308',
          weight: isCurrentTarget ? 3 : isSelected ? 3 : 1.6,
        };
      }
      if (view.expropriating.has(id)) {
        // Mid-court expropriation: amber dashed to signal "in progress".
        return {
          fillColor: '#fbbf24',
          fillOpacity: 0.45,
          color: isCurrentTarget ? '#0f172a' : isSelected ? '#0066ff' : '#92400e',
          weight: isCurrentTarget ? 3 : isSelected ? 3 : 1.2,
          dashArray: '5 3',
        };
      }
      if (view.abandoned.has(id)) {
        // Blocked — owner refused, developer rerouted around.
        return {
          fillColor: '#dc2626',
          fillOpacity: 0.5,
          color: isCurrentTarget ? '#0f172a' : isSelected ? '#0066ff' : '#7f1d1d',
          weight: isCurrentTarget ? 3 : isSelected ? 3 : 1.4,
          dashArray: '4 3',
        };
      }
      if (view.engaged.has(id)) {
        return {
          fillColor: '#3b82f6',
          fillOpacity: 0.35,
          color: isCurrentTarget ? '#0f172a' : isSelected ? '#0066ff' : '#1e40af',
          weight: isCurrentTarget ? 3 : isSelected ? 3 : 1,
        };
      }
      return {
        fillColor: '#d4d4d8',
        fillOpacity: 0.15,
        color: isSelected ? '#0066ff' : '#71717a',
        weight: isSelected ? 3 : 0.4,
      };
    }

    // Plan mode: choropleth + status border.
    const baseFill = scale.color(feature);
    const s = statusStyle(props.status);
    return {
      fillColor: baseFill,
      fillOpacity: choropleth === 'none' ? 0.25 : 0.55,
      color: isSelected ? '#0066ff' : s.color,
      weight: isSelected ? 3 : s.weight,
      dashArray: s.dashArray,
    };
  };

  const style = (feature?: ParcelFeature): PathOptions => {
    const base = baseStyle(feature);
    if (!feature) return base;
    // Highlight overlay: a thick primary outline on parcels that the learned
    // policy ranks among its first actions. The base fill (status / scenario /
    // choropleth) shows through.
    if (highlightFirstActions && firstActionIds.has(feature.properties.id)) {
      return {
        ...base,
        color: 'hsl(var(--primary))',
        weight: 3.5,
        dashArray: undefined,
      };
    }
    return base;
  };

  return (
    <GeoJSON
      key={key}
      data={parcels}
      pane="parcelsPane"
      // react-leaflet's GeoJSON types use a generic Feature; cast through
      // our concrete ParcelFeature signature.
      style={style as never}
    />
  );
}
