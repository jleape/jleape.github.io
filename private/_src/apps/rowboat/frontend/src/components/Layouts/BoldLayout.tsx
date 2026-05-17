import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { MapView } from '@/components/Map/MapContainer';
import { MapLegend } from '@/components/Map/MapLegend';
import { ChoroplethLegend } from '@/components/Map/ChoroplethLegend';
import { Sidebar } from '@/components/Sidebar/Sidebar';
import { PolicyPanel } from '@/components/PolicyPanel/PolicyPanel';
import { RowboatIcon } from '@/components/RowboatIcon';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ProgressStrip } from '@/components/ProgressBar';
import { useAlignmentStore } from '@/state/alignmentStore';
import { usePolicyStore } from '@/state/policyStore';
import { useProjectStore } from '@/state/projectStore';
import { money, sigfig } from '@/lib/format';

/**
 * Bold layout: map fills the viewport, controls live in a collapsible left
 * drawer (open by default at app start), and a persistent telemetry bar at
 * the top reports the planned alignment cost and the most recent policy
 * distribution stats.
 */
export function BoldLayout() {
  const [drawerOpen, setDrawerOpen] = useState(true);
  return (
    <div className="relative flex h-screen w-screen flex-col bg-background text-foreground">
      <TelemetryBar onToggleDrawer={() => setDrawerOpen((o) => !o)} drawerOpen={drawerOpen} />
      <main className="relative flex-1 overflow-hidden">
        <ErrorBoundary>
          <MapView />
        </ErrorBoundary>
        <MapLegend />
        <ChoroplethLegend />
        <ErrorBoundary>
          <PolicyPanel />
        </ErrorBoundary>
        {drawerOpen && (
          <div className="absolute left-0 top-0 z-[950] h-full w-72 shadow-2xl">
            <Sidebar />
          </div>
        )}
      </main>
      <ProgressStrip />
    </div>
  );
}

function TelemetryBar(props: { onToggleDrawer: () => void; drawerOpen: boolean }) {
  const alignment = useAlignmentStore((s) => s.alignment);
  const breakdown = useAlignmentStore((s) => s.breakdown);
  const expectedCost = useAlignmentStore((s) => s.expectedCost);
  const result = usePolicyStore((s) => s.result);
  const longStopDays = useProjectStore((s) => s.settings.longStopDays);

  const costs = result?.costDistribution ?? [];
  const days = result?.timeDistribution ?? [];
  const p50Cost = percentile(costs, 0.5);
  const p95Cost = percentile(costs, 0.95);
  const breachFrac =
    days.length > 0 ? days.filter((d) => d > longStopDays).length / days.length : null;

  return (
    <header className="z-[1050] grid grid-cols-[auto_1fr_auto] items-center gap-3 border-b border-border bg-card px-3 py-2">
      <button
        className="rounded border border-border p-1 text-foreground hover:bg-muted"
        onClick={props.onToggleDrawer}
        aria-label="Toggle controls"
      >
        {props.drawerOpen ? <X size={14} /> : <Menu size={14} />}
      </button>
      <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
        <GroupBadge label="plan" />
        <Cell
          label="total cost"
          value={alignment ? money(expectedCost) : '—'}
          tooltip="Expected total cost of the planned alignment (construction + expected ROW). Pre-simulation deterministic estimate."
        />
        <Cell
          label="construction cost"
          value={alignment ? money(breakdown.construction) : '—'}
          tooltip="Construction cost component: alignment length × per-parcel unit construction cost."
        />
        <Cell
          label="land cost"
          value={alignment ? money(breakdown.landOnPath + breakdown.landClipped) : '—'}
          tooltip="Expected ROW acquisition cost on the planned alignment (probability-weighted between consensual sale and expropriation)."
        />
        <Cell
          label="parcels"
          value={alignment ? `${breakdown.pathParcelCount}` : '—'}
          tooltip="Number of parcels the planned alignment passes through."
        />
        <Cell
          label="length"
          value={alignment ? `${sigfig(breakdown.pathLengthMeters / 1000)} km` : '—'}
          tooltip="Total length of the planned alignment polyline."
        />
        <Divider />
        <GroupBadge label="sim" />
        {result ? (
          <>
            <Cell
              label="median cost"
              value={money(p50Cost)}
              tooltip="Median (P50) total project cost across simulated rollouts."
            />
            <Cell
              label="p95 cost"
              value={money(p95Cost)}
              tooltip="95th-percentile total project cost across simulated rollouts — a downside-tail estimate."
            />
            <Cell
              label="long-stop breach"
              value={breachFrac != null ? `${(breachFrac * 100).toFixed(0)}%` : '—'}
              highlight={breachFrac != null && breachFrac > 0.1}
              tooltip="Fraction of simulated rollouts whose project completion runs past the contractual long-stop date."
            />
          </>
        ) : (
          <span className="opacity-50" title="Click ‘Learn ROW policy’ in the sidebar to run simulated rollouts.">
            run learn to simulate
          </span>
        )}
      </div>
      <span className="flex items-center gap-1.5 font-mono text-sm font-semibold tracking-tight text-foreground">
        <RowboatIcon hullColor="#ffffff" width={48} />
        <span>
          <span>ROW</span>
          <span className="text-muted-foreground">boat</span>
        </span>
      </span>
    </header>
  );
}

function Divider() {
  return <span className="h-4 w-px bg-border" />;
}

function Cell(props: { label: string; value: string; highlight?: boolean; tooltip?: string }) {
  return (
    <span className="flex items-baseline gap-1.5" title={props.tooltip}>
      <span className="opacity-60">{props.label}</span>
      <span className={props.highlight ? 'text-destructive' : 'text-foreground'}>
        {props.value}
      </span>
    </span>
  );
}

function GroupBadge(props: { label: string }) {
  return (
    <span className="rounded-sm border border-border/70 px-1.5 py-px text-[9px] font-semibold tracking-widest text-muted-foreground">
      {props.label}
    </span>
  );
}

function percentile(arr: number[], p: number): number {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.floor(sorted.length * p));
  return sorted[idx];
}
