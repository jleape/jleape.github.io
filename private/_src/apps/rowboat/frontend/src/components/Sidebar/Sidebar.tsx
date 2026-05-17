import { useUiStore } from '@/state/uiStore';
import { useDestinationsStore } from '@/state/destinationsStore';
import { useParcelsStore } from '@/state/parcelsStore';
import { usePolicyStore } from '@/state/policyStore';
import { useProjectStore } from '@/state/projectStore';
import { trainPolicyInBrowser } from '@/lib/sim/trainPolicy';
import type { ChoroplethMode } from '@/types';

const CHOROPLETH_OPTIONS: { value: ChoroplethMode; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'constructionCost', label: 'Construction Cost ($/m)' },
  { value: 'landUnitPrice', label: 'Land Cost ($/ha)' },
];

// Demo: client-only simulator with a modest rollout count so the in-browser
// run completes inside ~1 minute on a typical laptop.
const NUM_ROLLOUTS = 50;

export function Sidebar() {
  const ui = useUiStore();
  const destinations = useDestinationsStore((s) => s.destinations);
  const destinationsCount = destinations.length;
  const clearDestinations = useDestinationsStore((s) => s.clear);
  const parcels = useParcelsStore((s) => s.parcels);
  const parcelsCount = parcels.features.length;
  const isLearning = usePolicyStore((s) => s.isLearning);
  const setLearning = usePolicyStore((s) => s.setLearning);
  const setPolicyResult = usePolicyStore((s) => s.setResult);
  const projectSettings = useProjectStore((s) => s.settings);

  const onLearn = async () => {
    // Calibrated to the demo's web-worker simulator: ~0.3 ms per parcel per
    // rollout on a recent laptop (283 parcels × 50 rollouts ≈ 4 s).
    const estimateSec = Math.max(
      3,
      Math.round(parcels.features.length * NUM_ROLLOUTS * 0.0003)
    );
    try {
      setLearning(true, estimateSec);
      const result = await trainPolicyInBrowser(
        parcels,
        destinations,
        projectSettings,
        NUM_ROLLOUTS
      );
      setPolicyResult(result);
    } catch (err) {
      console.error(err);
      alert(`Policy training failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLearning(false);
    }
  };

  return (
    <aside className="z-[900] flex h-full w-72 flex-col gap-4 overflow-y-auto border-r border-border bg-card p-4 text-sm text-card-foreground">
      <Section title="Layers">
        <Toggle
          label={`Parcels (${parcelsCount})`}
          value={ui.showParcels}
          onChange={() => ui.toggle('showParcels')}
        />
        <Toggle
          label="Alignment"
          value={ui.showAlignment}
          onChange={() => ui.toggle('showAlignment')}
        />
        <Toggle
          label={`Destinations (${destinationsCount})`}
          value={ui.showDestinations}
          onChange={() => ui.toggle('showDestinations')}
        />
      </Section>

      <Section title="Choropleth">
        <select
          className="w-full rounded border border-input bg-background px-2 py-1 text-xs text-foreground"
          value={ui.choropleth}
          onChange={(e) => ui.setChoropleth(e.target.value as ChoroplethMode)}
        >
          {CHOROPLETH_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </Section>

      <Section title="Destinations">
        <button
          className={
            'w-full rounded px-2 py-1 text-xs transition-colors ' +
            (ui.drawingDestinations
              ? 'bg-primary text-primary-foreground hover:bg-primary/90'
              : 'border border-input text-foreground hover:bg-muted')
          }
          onClick={() => ui.toggle('drawingDestinations')}
        >
          {ui.drawingDestinations
            ? 'Drawing… click map (toggle to stop)'
            : 'Add destinations on map'}
        </button>
        <button
          className="mt-2 w-full rounded border border-input px-2 py-1 text-xs text-foreground hover:bg-muted"
          onClick={clearDestinations}
        >
          Clear destinations
        </button>
        <p className="mt-2 text-[11px] text-muted-foreground">
          1st click = start, 2nd = end. Additional clicks insert intermediate stops.
        </p>
      </Section>

      <Section title="Policy">
        <button
          className="w-full rounded bg-white px-2 py-1.5 text-xs font-semibold uppercase tracking-wide text-black shadow-sm ring-1 ring-white/40 transition-colors hover:bg-zinc-100 disabled:opacity-50"
          disabled={isLearning || parcelsCount === 0 || destinationsCount < 2}
          onClick={onLearn}
        >
          {isLearning ? 'Learning…' : 'Learn ROW policy'}
        </button>
        <p className="mt-2 text-[11px] text-muted-foreground">
          Runs a Monte-Carlo simulator in your browser ({NUM_ROLLOUTS} rollouts).
          Requires ≥2 destinations.
        </p>
      </Section>

      <footer className="mt-auto text-[10px] leading-tight text-muted-foreground/70">
        ROWboat demo · client-only build
        <br />
        <a
          href="https://github.com/jleape/ROWboat"
          target="_blank"
          rel="noreferrer"
          className="underline hover:text-foreground"
        >
          source on GitHub
        </a>
      </footer>
    </aside>
  );
}

function Section(props: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {props.title}
      </h3>
      {props.children}
    </section>
  );
}

function Toggle(props: { label: string; value: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      onClick={props.onChange}
      className="mb-1 flex w-full items-center gap-2 rounded px-1 py-0.5 text-xs text-foreground hover:bg-muted/40"
    >
      <span
        className={
          'flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-sm border ' +
          (props.value
            ? 'border-primary bg-primary text-primary-foreground'
            : 'border-border bg-transparent')
        }
        aria-checked={props.value}
        role="checkbox"
      >
        {props.value && (
          <svg viewBox="0 0 12 12" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M2.5 6.5 L5 9 L9.5 3.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
      <span className="text-left">{props.label}</span>
    </button>
  );
}
