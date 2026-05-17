import { useEffect, useRef } from 'react';
import { Play, Pause } from 'lucide-react';
import { usePolicyStore } from '@/state/policyStore';
import { useUiStore } from '@/state/uiStore';
import { useAlignmentStore } from '@/state/alignmentStore';
import { useProjectStore } from '@/state/projectStore';
import { Histogram } from './Histogram';
import { money, days as fmtDays, sigfig } from '@/lib/format';
import { scenarioStateAt } from '@/state/scenarioView';
import type { PolicyRolloutScenario } from '@/types';

const ACTION_LABELS: Record<string, string> = {
  engage: 'Engaged',
  offer: 'Owner offered',
  refuse: 'Owner refused',
  acquire: 'Purchase agreed',
  easement: 'Easement agreed',
  'expropriate-start': 'Expropriation filed',
  expropriate: 'Expropriation complete',
  abandon: 'Blocked — rerouting',
};

export function PolicyPanel() {
  const result = usePolicyStore((s) => s.result);
  const idx = usePolicyStore((s) => s.currentScenarioIndex);
  const setIdx = usePolicyStore((s) => s.setScenarioIndex);
  const stepIdx = usePolicyStore((s) => s.currentStepIndex);
  const setStepIdx = usePolicyStore((s) => s.setStepIndex);
  const clear = usePolicyStore((s) => s.clear);
  const highlightFirstActions = useUiStore((s) => s.highlightFirstActions);
  const toggleHighlight = useUiStore((s) => s.toggle);
  const plannedCost = useAlignmentStore((s) => s.expectedCost);
  const longStopDays = useProjectStore((s) => s.settings.longStopDays);
  const isPlaying = usePolicyStore((s) => s.isPlaying);
  const setPlaying = usePolicyStore((s) => s.setPlaying);
  const playbackSps = usePolicyStore((s) => s.playbackStepsPerSecond);
  const setPlaybackSpeed = usePolicyStore((s) => s.setPlaybackSpeed);

  // Autoplay: advance the step scrubber on a timer. We use a self-rescheduling
  // setTimeout (rather than setInterval) so changing playbackSps takes effect
  // on the next tick instead of waiting out the old interval. Stops at the
  // final event so the catch animations on the last step are visible.
  const stepIdxRef = useRef(stepIdx);
  stepIdxRef.current = stepIdx;
  useEffect(() => {
    if (!isPlaying) return;
    if (!result || idx == null) return;
    const sc = result.scenarios[idx];
    const n = sc?.events?.length ?? 0;
    if (n === 0) {
      setPlaying(false);
      return;
    }
    let cancelled = false;
    const tick = () => {
      if (cancelled) return;
      const cur = stepIdxRef.current ?? -1;
      const next = cur + 1;
      if (next >= n) {
        setPlaying(false);
        return;
      }
      setStepIdx(next);
      window.setTimeout(tick, 1000 / Math.max(1, playbackSps));
    };
    const handle = window.setTimeout(tick, 1000 / Math.max(1, playbackSps));
    return () => {
      cancelled = true;
      window.clearTimeout(handle);
    };
  }, [isPlaying, idx, result, playbackSps, setPlaying, setStepIdx]);

  if (!result) return null;

  const n = result.scenarios.length;
  const current = idx != null ? result.scenarios[idx] : null;
  const events = current?.events ?? [];
  const eventCount = events.length;
  const currentEvent = stepIdx != null && stepIdx < events.length ? events[stepIdx] : null;
  const firstActionsCount = result.firstActions.length;

  return (
    <div className="absolute bottom-3 left-3 right-3 z-[1000] mx-auto max-w-[1364px] rounded-md border border-border bg-card px-3 py-2 text-card-foreground shadow-lg">
      <div className="mb-2 flex items-center justify-between">
        <div className="text-xs text-muted-foreground">
          Policy <span className="font-mono text-foreground">{result.policyId}</span> ·{' '}
          {result.scenarios.length} rollouts
        </div>
        <button
          className="text-[11px] text-muted-foreground hover:text-foreground"
          onClick={clear}
        >
          Clear
        </button>
      </div>

      <div className="grid grid-cols-[1fr_1fr_150px_340px] gap-4">
        <Histogram
          title="Total acquisition cost"
          values={result.costDistribution}
          highlightValue={current ? current.totalCost : null}
          referenceValue={plannedCost > 0 ? plannedCost : null}
          referenceLabel="plan"
          format={money}
          width={380}
        />
        <Histogram
          title="Total project duration"
          values={result.timeDistribution}
          highlightValue={current ? current.totalTimeSteps : null}
          referenceValue={longStopDays > 0 ? longStopDays : null}
          referenceLabel="long-stop"
          format={fmtDays}
          width={380}
        />
        <div>
          <div className="mb-1 text-[11px] font-medium uppercase leading-[1.1] tracking-wider text-foreground">
            First parcels
            <br />
            to acquire
          </div>
          <button
            className={
              'mb-1 w-full rounded border px-2 py-1 text-[10px] uppercase tracking-wider transition-colors ' +
              (highlightFirstActions
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-input text-muted-foreground hover:bg-muted hover:text-foreground')
            }
            disabled={firstActionsCount === 0}
            onClick={() => toggleHighlight('highlightFirstActions')}
          >
            {highlightFirstActions ? 'Hide on map' : 'Highlight on map'}
          </button>
          <ul className="max-h-[88px] overflow-y-auto text-[11px]">
            {result.firstActions.length === 0 ? (
              <li className="text-muted-foreground">No actions recommended</li>
            ) : (
              result.firstActions.map((a) => (
                <li key={a.parcelId} className="py-0.5 font-mono text-foreground">
                  {a.parcelId}
                </li>
              ))
            )}
          </ul>
        </div>
        <StepMetrics scenario={current} stepIdx={stepIdx} eventCount={eventCount} />
      </div>

      <div className="mt-2">
        <div className="flex items-center gap-3">
          <span className="w-[60px] shrink-0 text-[11px] uppercase tracking-wide text-muted-foreground">
            Scenario
          </span>
          <input
            type="range"
            min={0}
            max={Math.max(0, n - 1)}
            value={idx ?? 0}
            disabled={idx == null || n === 0}
            onChange={(e) => setIdx(Number(e.target.value))}
            className="min-w-0 flex-1 accent-primary"
          />
          <button
            className="w-[120px] shrink-0 rounded border border-input px-2 py-1 text-[11px] text-foreground hover:bg-muted"
            disabled={n === 0}
            onClick={() => setIdx(idx == null ? 0 : null)}
          >
            {idx == null ? 'Show scenario' : 'Show plan'}
          </button>
        </div>
        <div className="ml-[72px] mt-1 text-[11px] text-muted-foreground">
          {idx == null ? <span>Planned alignment</span> : <>{idx + 1} / {n}</>}
        </div>
      </div>

      {current && eventCount > 0 && (
        <div className="mt-1">
          <div className="flex items-center gap-3">
            <span className="w-[60px] shrink-0 text-[11px] uppercase tracking-wide text-muted-foreground">
              Step
            </span>
            <button
              className={
                'shrink-0 rounded border px-2 py-1 text-[11px] transition-colors ' +
                (isPlaying
                  ? 'border-primary bg-primary text-primary-foreground hover:bg-primary/90'
                  : 'border-input text-foreground hover:bg-muted')
              }
              onClick={() => {
                if (!isPlaying && (stepIdx ?? 0) >= eventCount - 1) {
                  // If we're already at the end, rewind to 0 before playing.
                  setStepIdx(0);
                }
                setPlaying(!isPlaying);
              }}
              title={isPlaying ? 'Pause autoplay' : 'Autoplay through the scenario'}
            >
              {isPlaying ? <Pause size={11} /> : <Play size={11} />}
            </button>
            <select
              className="shrink-0 rounded border border-input bg-background px-1 py-1 text-[10px] text-foreground"
              value={playbackSps}
              onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
              title="Autoplay speed"
            >
              <option value={3}>0.5×</option>
              <option value={6}>1×</option>
              <option value={12}>2×</option>
            </select>
            <input
              type="range"
              min={0}
              max={Math.max(0, eventCount - 1)}
              value={stepIdx ?? eventCount - 1}
              disabled={isPlaying}
              onChange={(e) => setStepIdx(Number(e.target.value))}
              className="min-w-0 flex-1 accent-primary"
            />
            <button
              className="w-[120px] shrink-0 rounded border border-input px-2 py-1 text-[11px] text-foreground hover:bg-muted"
              onClick={() => {
                setPlaying(false);
                setStepIdx(eventCount - 1);
              }}
              title="Jump the step slider to the final state of this scenario"
            >
              Final
            </button>
          </div>
          <div className="ml-[72px] mt-1 truncate text-[11px] text-muted-foreground">
            {currentEvent ? (
              <>
                {stepIdx == null ? eventCount : stepIdx + 1} / {eventCount} · day{' '}
                {sigfig(currentEvent.day)} ·{' '}
                <span className="font-mono text-foreground">{currentEvent.parcelId}</span> ·{' '}
                {ACTION_LABELS[currentEvent.action]}
              </>
            ) : (
              <span>—</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function StepMetrics(props: {
  scenario: PolicyRolloutScenario | null;
  stepIdx: number | null;
  eventCount: number;
}) {
  const { scenario, stepIdx, eventCount } = props;
  if (!scenario) {
    return (
      <div className="text-[11px] text-muted-foreground">
        Select a scenario to see metrics.
      </div>
    );
  }

  const effectiveStep = stepIdx ?? eventCount - 1;
  const cumulative = scenarioStateAt(scenario, effectiveStep);
  const currentEvent =
    effectiveStep >= 0 && effectiveStep < scenario.events.length
      ? scenario.events[effectiveStep]
      : null;
  const currentDay = currentEvent?.day ?? scenario.totalTimeSteps;
  const costToDate = currentEvent?.costToDate ?? scenario.totalCost;

  return (
    <div className="grid grid-cols-2 gap-3 font-mono text-[11px]">
      <Section title="Scenario totals">
        <Row label="cost" value={money(scenario.totalCost)} />
        <Row label="days" value={fmtDays(scenario.totalTimeSteps)} />
        <Row label="purchased" value={(scenario.acquired?.length ?? 0).toString()} />
        <Row label="easement" value={(scenario.easement?.length ?? 0).toString()} />
        <Row label="expropriated" value={(scenario.expropriated?.length ?? 0).toString()} />
        <Row label="blocked" value={(scenario.abandoned?.length ?? 0).toString()} />
      </Section>
      <Section title={`At step ${(effectiveStep + 1).toLocaleString('en-US')}`}>
        <Row label="cost" value={money(costToDate)} />
        <Row label="day" value={fmtDays(currentDay)} />
        <Row label="purchased" value={cumulative.acquired.size.toString()} />
        <Row label="easement" value={cumulative.easement.size.toString()} />
        <Row label="expropriated" value={cumulative.expropriated.size.toString()} />
        <Row label="blocked" value={cumulative.abandoned.size.toString()} />
      </Section>
    </div>
  );
}

function Section(props: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        {props.title}
      </div>
      <div className="space-y-0">{props.children}</div>
    </div>
  );
}

function Row(props: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-2 py-px">
      <span className="text-muted-foreground">{props.label}</span>
      <span className="tabular-nums text-foreground">{props.value}</span>
    </div>
  );
}
