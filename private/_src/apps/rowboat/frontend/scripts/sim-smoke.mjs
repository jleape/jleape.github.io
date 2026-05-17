// Quick smoke test: generate the synthetic corridor, run a handful of
// rollouts in Node, verify the simulator produces non-empty scenarios.
//
//   cd frontend && node --experimental-vm-modules scripts/sim-smoke.mjs

import { generateCorridorParcels, defaultDestinations } from '../src/data/sampleCorridor.ts';
import { runRollouts } from '../src/lib/sim/monteCarlo.ts';

const settings = {
  engagementCost: 80_000,
  negotiationCostPerDay: 3_000,
  responseMinDays: 15,
  responseMaxDays: 185,
  decisionWindowDays: 30,
  expropriationDays: 230,
  projectCarryCostPerDay: 110_000,
  longStopDays: 1825,
  longStopPenalty: 500_000_000,
  maxConcurrentEngagements: 5,
  minRadiusOfCurvatureM: 500,
  easementOfferProbability: 0.45,
  easementCostFraction: 0.4,
};

const parcels = generateCorridorParcels();
const dests = defaultDestinations().map((coord, i) => ({
  type: 'Feature',
  geometry: { type: 'Point', coordinates: coord },
  properties: { id: `seed-${i}`, order: i, label: i === 0 ? 'Start' : 'End' },
}));

console.log(`parcels: ${parcels.features.length}`);
const N = 50;
const t0 = Date.now();
const result = runRollouts({ type: 'FeatureCollection', features: parcels.features }, dests, settings, N, 42);
const dt = (Date.now() - t0) / 1000;
console.log(`${N} rollouts in ${dt.toFixed(1)}s`);
for (const sc of result.scenarios.slice(0, 8)) {
  console.log(
    `  ${sc.scenarioId}: events=${sc.events.length} purchased=${sc.acquired.length} easement=${sc.easement.length} expropriated=${sc.expropriated.length} blocked=${sc.abandoned.length} cost=$${(sc.totalCost / 1e6).toFixed(0)}M time=${sc.totalTimeSteps}d`
  );
}
const avgBlocked = result.scenarios.reduce((s, x) => s + x.abandoned.length, 0) / result.scenarios.length;
console.log(`Avg blocked per scenario: ${avgBlocked.toFixed(1)}`);
const all4 = result.scenarios.filter(
  (s) => s.acquired.length > 0 && s.easement.length > 0 && s.expropriated.length > 0 && s.abandoned.length > 0
).length;
console.log(`scenarios with all 4 outcomes: ${all4}/${result.scenarios.length}`);
const longStop = 1825;
const underLongStop = result.scenarios.filter((s) => s.totalTimeSteps <= longStop).length;
console.log(`scenarios finishing under long-stop (${longStop}d): ${underLongStop}/${result.scenarios.length}`);
