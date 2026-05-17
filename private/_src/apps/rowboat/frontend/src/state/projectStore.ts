import { create } from 'zustand';
import type { ProjectSettings } from '@/types';

interface ProjectState {
  settings: ProjectSettings;
  setSetting: <K extends keyof ProjectSettings>(key: K, value: ProjectSettings[K]) => void;
  reset: () => void;
}

// Defaults chosen so the simple "engage every path parcel on Day 0" policy is
// visibly expensive. X0 + X1 dominate the total cost, project carry is small,
// long-stop date is generous. Under these, a learned policy that engages
// gradually (only when a parcel's marginal value justifies the X0/X1 spend)
// should beat the baseline by a wide margin.
const DEFAULTS: ProjectSettings = {
  // Tuned for the demo: with maxConcurrentEngagements=5, the project
  // duration is bounded by the cadence at which the developer can work
  // through parcels, so carry cost has more weight relative to refusals.
  // Combined with easements (cheaper than purchase) and a realistic
  // construction:land ratio, most scenarios surface all four outcome
  // types (acquired / easement / expropriated / blocked).
  // Durations tuned so a typical scenario finishes inside the long-stop date.
  // ~30 path parcels × ~70 days / parcel (response + decision) / 5 in flight
  // ≈ 420 days, with expropriation/reroute tails landing most scenarios
  // inside the 1825-day window.
  engagementCost: 80_000,         // X0 — outreach + legal setup per parcel
  negotiationCostPerDay: 3_000,   // X1
  responseMinDays: 15,            // X2
  // Wide spread: median response ~3 months, with a long tail so some
  // scenarios stack enough delay to breach the long-stop date in ~10% of
  // runs while the majority complete in time.
  responseMaxDays: 185,           // X3
  decisionWindowDays: 30,         // X4
  expropriationDays: 230,         // X5 — ~7.5 months in court
  projectCarryCostPerDay: 110_000, // realistic for mid-sized infra; high enough that the X5-day expropriation lock-in materially outweighs reroute's avg_response delay.
  longStopDays: 1825,             // 5 years — typical PPP commercial close
  longStopPenalty: 500_000_000,
  maxConcurrentEngagements: 5,    // human-scale ROW team
  // 500 m default — reasonable for an arterial road or pipeline. HSR will
  // typically override to 4000 m and transmission can drop to 100 m.
  minRadiusOfCurvatureM: 500,
  // ~45% of owners who refuse the sale accept an easement instead.
  easementOfferProbability: 0.45,
  easementCostFraction: 0.4,
};

export const useProjectStore = create<ProjectState>((set) => ({
  settings: DEFAULTS,
  setSetting: (key, value) =>
    set((s) => ({ settings: { ...s.settings, [key]: value } })),
  reset: () => set({ settings: DEFAULTS }),
}));
