import { usePolicyStore } from '@/state/policyStore';

interface SwatchProps {
  fill: string;
  border: string;
  label: string;
  dashed?: boolean;
}

function Swatch({ fill, border, label, dashed }: SwatchProps) {
  return (
    <div className="flex items-center gap-2">
      <span
        className="inline-block h-3 w-4 shrink-0 rounded-sm"
        style={{
          background: fill,
          border: `1.5px ${dashed ? 'dashed' : 'solid'} ${border}`,
          opacity: 0.9,
        }}
      />
      <span className="text-[11px] leading-tight">{label}</span>
    </div>
  );
}

function LineRow({
  color,
  label,
  height = 3,
  dashed,
}: {
  color: string;
  label: string;
  height?: number;
  dashed?: boolean;
}) {
  const dashStyle = dashed
    ? {
        backgroundImage: `linear-gradient(to right, ${color} 60%, transparent 40%)`,
        backgroundSize: '6px 100%',
        backgroundRepeat: 'repeat-x',
      }
    : { background: color };
  return (
    <div className="flex items-center gap-2">
      <span
        className="inline-block w-4 shrink-0 rounded"
        style={{ height, ...dashStyle }}
      />
      <span className="text-[11px] leading-tight">{label}</span>
    </div>
  );
}

/**
 * Floating legend, positioned bottom-right of the map. Visible only when a
 * scenario is being viewed (otherwise the parcel coloring is choropleth /
 * status and the legend is redundant).
 */
export function MapLegend() {
  const result = usePolicyStore((s) => s.result);
  const idx = usePolicyStore((s) => s.currentScenarioIndex);
  // Show only when a scenario is being viewed so the legend matches the colors
  // actually on the map.
  if (!result || idx == null) return null;

  return (
    <div
      className="absolute bottom-12 right-3 z-[1000] flex flex-col gap-1.5 rounded-md border border-border bg-card/95 px-3 py-2 text-card-foreground shadow-md backdrop-blur"
      style={{ pointerEvents: 'none' }}
    >
      <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        Parcel status
      </div>
      <Swatch fill="#3b82f6" border="#1e40af" label="Engaged" />
      <Swatch fill="#16a34a" border="#15803d" label="Purchased" />
      <Swatch fill="transparent" border="#16a34a" label="Easement" />
      <Swatch fill="#fbbf24" border="#92400e" label="Expropriating" dashed />
      <Swatch fill="transparent" border="#eab308" label="Expropriated" />
      <Swatch fill="#dc2626" border="#7f1d1d" label="Blocked (rerouted)" dashed />
      <div className="mt-1 border-t border-border" />
      <LineRow color="#e879f9" label="Realised alignment" />
      <LineRow color="#22c55e" label="Easement buffer" height={6} />
      <LineRow color="#facc15" label="Expropriation buffer" height={6} />
    </div>
  );
}
