import { generateCorridorParcels, defaultDestinations } from '../src/data/sampleCorridor.ts';
const parcels = generateCorridorParcels();
const dests = defaultDestinations().map((c,i)=>({type:'Feature',geometry:{type:'Point',coordinates:c},properties:{id:'s'+i,order:i}}));
const settings = {
  engagementCost: 100000, negotiationCostPerDay: 3000,
  responseMinDays: 15, responseMaxDays: 300,
  decisionWindowDays: 30, expropriationDays: 1095,
  projectCarryCostPerDay: 20000,
  longStopDays: 2190, longStopPenalty: 250000000,
  maxConcurrentEngagements: 50,
};
const trainRes = await fetch('http://localhost:8001/api/policy/train', {
  method:'POST', headers:{'content-type':'application/json'},
  body: JSON.stringify({parcels, destinations:dests, project_settings:settings, num_rollouts:25, seed:7}),
});
const t = await trainRes.json();
const r = await (await fetch(`http://localhost:8001/api/policy/${t.policyId}`)).json();
const align = new Map();
for (const s of r.scenarios) {
  const key = [...new Set([...s.acquired, ...s.expropriated])].sort().join('|');
  align.set(key, (align.get(key)||0)+1);
}
let tA=0,tE=0,tR=0;
for (const s of r.scenarios) { tA+=s.acquired.length; tE+=s.expropriated.length; tR+=s.abandoned.length; }
const n = r.scenarios.length;
const costs = r.costDistribution.sort((a,b)=>a-b);
const days = r.timeDistribution.sort((a,b)=>a-b);
console.log('alignments=', align.size, '/', n);
console.log('avg acquired=', (tA/n).toFixed(1), 'expropriated=', (tE/n).toFixed(1), 'blocked=', (tR/n).toFixed(1));
console.log('cost p10=$'+(costs[2]/1e6).toFixed(0)+'M p50=$'+(costs[12]/1e6).toFixed(0)+'M p95=$'+(costs[23]/1e6).toFixed(0)+'M');
console.log('days p10='+days[2]+' p50='+days[12]+' p95='+days[23]);
