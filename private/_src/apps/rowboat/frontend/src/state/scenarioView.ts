import type { PolicyRolloutScenario } from '@/types';

export type ParcelLifecycleStatus =
  | 'engaged'
  | 'offered'
  | 'acquired'
  | 'expropriating'
  | 'expropriated';

export interface ScenarioView {
  acquired: Set<string>;
  easement: Set<string>;       // ROW obtained via easement (cheaper than fee acquisition)
  expropriated: Set<string>;
  abandoned: Set<string>;
  engaged: Set<string>;        // currently in negotiation (engaged, not yet offered/refused)
  expropriating: Set<string>;  // refused; expropriation in progress
  pathAfter: string[] | null;
  isFinalState: boolean;
}

const EMPTY_VIEW = (): ScenarioView => ({
  acquired: new Set(),
  easement: new Set(),
  expropriated: new Set(),
  abandoned: new Set(),
  engaged: new Set(),
  expropriating: new Set(),
  pathAfter: null,
  isFinalState: true,
});

function clearAll(view: ScenarioView, pid: string): void {
  view.acquired.delete(pid);
  view.easement.delete(pid);
  view.expropriated.delete(pid);
  view.abandoned.delete(pid);
  view.engaged.delete(pid);
  view.expropriating.delete(pid);
}

/**
 * Reduce a scenario down to the state visible at a given step.
 * `stepIndex === null` returns the full final state (acquired + expropriated).
 * `stepIndex === k` returns the lifecycle state after applying events[0..=k],
 * including transient states like `engaged` and `expropriating`.
 */
export function scenarioStateAt(
  scenario: PolicyRolloutScenario,
  stepIndex: number | null
): ScenarioView {
  const events = scenario.events ?? [];

  if (stepIndex === null || events.length === 0) {
    return {
      acquired: new Set(scenario.acquired ?? []),
      easement: new Set(scenario.easement ?? []),
      expropriated: new Set(scenario.expropriated ?? []),
      abandoned: new Set(scenario.abandoned ?? []),
      engaged: new Set(),
      expropriating: new Set(),
      pathAfter: null,
      isFinalState: true,
    };
  }

  const view = EMPTY_VIEW();
  const upto = Math.min(stepIndex, events.length - 1);
  for (let i = 0; i <= upto; i++) {
    const ev = events[i];
    if (!ev) continue;
    const pid = ev.parcelId;
    clearAll(view, pid);
    switch (ev.action) {
      case 'engage':
        view.engaged.add(pid);
        break;
      case 'offer':
        // Transient: owner offered. We immediately move to acquired in the
        // heuristic, but during scrubbing this state shows briefly.
        view.engaged.add(pid);
        break;
      case 'refuse':
        view.expropriating.add(pid);
        break;
      case 'acquire':
        view.acquired.add(pid);
        break;
      case 'easement':
        view.easement.add(pid);
        break;
      case 'expropriate-start':
        view.expropriating.add(pid);
        break;
      case 'expropriate':
        view.expropriated.add(pid);
        break;
      case 'abandon':
        view.abandoned.add(pid);
        break;
    }
  }
  view.pathAfter = events[upto]?.pathAfter ?? null;
  view.isFinalState = upto === events.length - 1;
  return view;
}
