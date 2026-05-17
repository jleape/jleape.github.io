import { generateCorridorParcels } from '../src/data/sampleCorridor.ts';
import * as turf from '@turf/turf';

const fc = generateCorridorParcels();
const areas = fc.features.map((f) => f.properties.areaHectares).sort((a, b) => a - b);
const n = areas.length;

// Topology check: build coordinate-string set across all rings; count how many are shared by ≥2 polys.
const edgeMap = new Map();
for (const f of fc.features) {
  const ring = f.geometry.coordinates[0];
  for (let i = 0; i < ring.length - 1; i++) {
    const a = ring[i].map((x) => x.toFixed(7)).join(',');
    const b = ring[i + 1].map((x) => x.toFixed(7)).join(',');
    const key = [a, b].sort().join('|');
    edgeMap.set(key, (edgeMap.get(key) ?? 0) + 1);
  }
}
const totalEdges = edgeMap.size;
const sharedEdges = [...edgeMap.values()].filter((c) => c >= 2).length;
const sharePct = ((sharedEdges / totalEdges) * 100).toFixed(1);

// Overlap check on the first 50 polygons (O(N²) of N=50, manageable).
const polys = fc.features.slice(0, 50);
let overlapsFound = 0;
for (let i = 0; i < polys.length; i++) {
  for (let j = i + 1; j < polys.length; j++) {
    try {
      const inter = turf.intersect(turf.featureCollection([polys[i], polys[j]]));
      if (!inter) continue;
      const a = turf.area(inter);
      if (a > 10) overlapsFound++; // ignore numerical fuzz < 10 m²
    } catch {}
  }
}

console.log(
  JSON.stringify(
    {
      count: n,
      minHa: areas[0],
      p25Ha: areas[Math.floor(n * 0.25)],
      medianHa: areas[Math.floor(n * 0.5)],
      p75Ha: areas[Math.floor(n * 0.75)],
      maxHa: areas[n - 1],
      uniqueEdges: totalEdges,
      sharedEdges,
      sharedEdgePct: Number(sharePct),
      overlapPairsInFirst50: overlapsFound,
    },
    null,
    2
  )
);
