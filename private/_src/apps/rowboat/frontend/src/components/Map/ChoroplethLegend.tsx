import { useUiStore } from '@/state/uiStore';
import { useParcelsStore } from '@/state/parcelsStore';
import { usePolicyStore } from '@/state/policyStore';
import { money, percent } from '@/lib/format';
import type { ParcelProperties } from '@/types';

// Same ramp as lib/geo/choropleth.ts — keep in sync.
const CYAN_PALETTE = [
  '#155e75',
  '#0891b2',
  '#06b6d4',
  '#22d3ee',
  '#67e8f9',
  '#a3e635',
  '#fde047',
];

const STATUS_LEGEND: { label: string; color: string; border?: string }[] = [
  { label: 'Available', color: '#475569' },
  { label: 'Negotiating', color: '#fbbf24' },
  { label: 'Acquired (sale)', color: '#16a34a', border: '#15803d' },
  { label: 'Easement', color: '#16a34a', border: '#1d4ed8' },
  { label: 'Blocked', color: '#dc2626' },
];

function metricOf(mode: 'constructionCost' | 'landUnitPrice' | 'acquisitionProbability') {
  return (p: ParcelProperties): number => {
    switch (mode) {
      case 'constructionCost':
        return p.unitConstructionCost;
      case 'landUnitPrice':
        return p.areaHectares > 0 ? p.landCost / p.areaHectares : 0;
      case 'acquisitionProbability':
        return p.acquisitionProbability;
    }
  };
}

const TITLE: Record<string, string> = {
  status: 'Parcel status',
  constructionCost: 'Construction ($/m)',
  landUnitPrice: 'Land ($/ha)',
  acquisitionProbability: 'Acquisition probability',
};

/**
 * Floating legend for the active choropleth. Only shown when a numeric or
 * status choropleth is active and we're NOT viewing a scenario (the
 * scenario-state legend takes priority in that case).
 */
export function ChoroplethLegend() {
  const choropleth = useUiStore((s) => s.choropleth);
  const parcels = useParcelsStore((s) => s.parcels);
  const inScenarioView = usePolicyStore(
    (s) => s.currentScenarioIndex != null && s.result != null
  );

  if (choropleth === 'none' || inScenarioView) return null;

  if (choropleth === 'status') {
    return (
      <Frame title={TITLE.status}>
        {STATUS_LEGEND.map((s) => (
          <div key={s.label} className="flex items-center gap-2">
            <span
              className="inline-block h-3 w-4 shrink-0 rounded-sm"
              style={{
                background: s.color,
                border: s.border ? `1.5px solid ${s.border}` : 'none',
                opacity: 0.9,
              }}
            />
            <span className="text-[11px] leading-tight">{s.label}</span>
          </div>
        ))}
      </Frame>
    );
  }

  const m = metricOf(choropleth);
  let values: number[] = parcels.features.map((f) => m(f.properties));
  values = values.filter((v) => isFinite(v));
  if (values.length === 0) return null;
  let min = Math.min(...values);
  let max = Math.max(...values);
  if (min === max) {
    min = min * 0.95;
    max = max * 1.05;
  }
  const fmt = choropleth === 'acquisitionProbability' ? percent : money;

  return (
    <Frame title={TITLE[choropleth]}>
      <div
        className="h-2 w-44 rounded-sm"
        style={{ background: `linear-gradient(to right, ${CYAN_PALETTE.join(',')})` }}
      />
      <div className="flex justify-between font-mono text-[10px] text-muted-foreground">
        <span>{fmt(min)}</span>
        <span>{fmt(max)}</span>
      </div>
    </Frame>
  );
}

function Frame({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      className="absolute bottom-3 right-3 z-[1000] flex flex-col gap-1.5 rounded-md border border-border bg-card/95 px-3 py-2 text-card-foreground shadow-md backdrop-blur"
      style={{ pointerEvents: 'none' }}
    >
      <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </div>
      {children}
    </div>
  );
}
