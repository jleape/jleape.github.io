import { create } from 'zustand';
import type { PolicyResult } from '@/types';

interface PolicyState {
  result: PolicyResult | null;
  // null = "plan mode" (planned alignment shown, no scenario overlay).
  // number = scenario index being displayed.
  currentScenarioIndex: number | null;
  // Step within the currently selected scenario. Defaults to the final event
  // when a scenario is selected so the slider works immediately and the user
  // sees the realised outcome by default.
  currentStepIndex: number | null;
  isLearning: boolean;
  /** Epoch ms when the current learning run started (used by ProgressBar). */
  learningStartedAt: number | null;
  /** Estimated wall-clock seconds for the current learning run. */
  learningEstimateSeconds: number | null;
  /** Autoplay: when true, the step scrubber advances on a timer. */
  isPlaying: boolean;
  /** Autoplay speed in steps per second. Hard-coded to a default for now. */
  playbackStepsPerSecond: number;
  setResult: (r: PolicyResult | null) => void;
  setScenarioIndex: (i: number | null) => void;
  setStepIndex: (i: number | null) => void;
  setLearning: (b: boolean, estimateSeconds?: number) => void;
  setPlaying: (b: boolean) => void;
  setPlaybackSpeed: (sps: number) => void;
  clear: () => void;
}

const lastEventOf = (result: PolicyResult | null, scenarioIdx: number): number | null => {
  if (!result) return null;
  const sc = result.scenarios[scenarioIdx];
  if (!sc || !sc.events || sc.events.length === 0) return null;
  return sc.events.length - 1;
};

export const usePolicyStore = create<PolicyState>((set, get) => ({
  result: null,
  currentScenarioIndex: null,
  currentStepIndex: null,
  isLearning: false,
  learningStartedAt: null,
  learningEstimateSeconds: null,
  isPlaying: false,
  playbackStepsPerSecond: 6,
  setResult: (result) => {
    // After training, default straight into scenario 0 at the final step —
    // both sliders are immediately functional. The user can flip to plan
    // mode with the Show plan button if they want.
    if (!result) {
      set({
        result: null,
        currentScenarioIndex: null,
        currentStepIndex: null,
        isPlaying: false,
      });
      return;
    }
    set({
      result,
      currentScenarioIndex: 0,
      currentStepIndex: lastEventOf(result, 0),
      isPlaying: false,
    });
  },
  setScenarioIndex: (currentScenarioIndex) => {
    // Reset step index to the new scenario's last event so the step slider
    // continues to make sense as the user moves between scenarios. Stop
    // autoplay so we don't immediately race past the user's selection.
    const { result } = get();
    const step =
      currentScenarioIndex == null ? null : lastEventOf(result, currentScenarioIndex);
    set({ currentScenarioIndex, currentStepIndex: step, isPlaying: false });
  },
  setStepIndex: (currentStepIndex) => set({ currentStepIndex }),
  setLearning: (isLearning, estimateSeconds) =>
    set(
      isLearning
        ? {
            isLearning: true,
            learningStartedAt: Date.now(),
            learningEstimateSeconds: estimateSeconds ?? 30,
          }
        : { isLearning: false, learningStartedAt: null, learningEstimateSeconds: null }
    ),
  setPlaying: (isPlaying) => set({ isPlaying }),
  setPlaybackSpeed: (playbackStepsPerSecond) =>
    set({ playbackStepsPerSecond: Math.max(1, playbackStepsPerSecond) }),
  clear: () =>
    set({
      result: null,
      currentScenarioIndex: null,
      currentStepIndex: null,
      isPlaying: false,
    }),
}));
