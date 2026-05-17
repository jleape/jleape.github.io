import type { ParcelCollection } from '@/types';

const COORD_PRECISION = 7;

function coordKey(c: number[]): string {
  return `${c[0].toFixed(COORD_PRECISION)},${c[1].toFixed(COORD_PRECISION)}`;
}

function edgeKey(a: number[], b: number[]): string {
  const ka = coordKey(a);
  const kb = coordKey(b);
  return ka < kb ? `${ka}|${kb}` : `${kb}|${ka}`;
}

export type Adjacency = Map<string, Set<string>>;

/**
 * Build a parcel adjacency map. Two parcels are adjacent if their boundary rings share an
 * exact edge (coordinate pair). With Voronoi-derived parcels this captures all real
 * neighbours and produces no false positives.
 */
export function buildAdjacency(parcels: ParcelCollection): Adjacency {
  const edgeToParcels = new Map<string, string[]>();

  for (const feature of parcels.features) {
    const ring = feature.geometry.coordinates[0];
    for (let i = 0; i < ring.length - 1; i++) {
      const key = edgeKey(ring[i], ring[i + 1]);
      const list = edgeToParcels.get(key) ?? [];
      list.push(feature.properties.id);
      edgeToParcels.set(key, list);
    }
  }

  const adj: Adjacency = new Map();
  for (const feature of parcels.features) {
    adj.set(feature.properties.id, new Set());
  }
  for (const ids of edgeToParcels.values()) {
    if (ids.length < 2) continue;
    for (let i = 0; i < ids.length; i++) {
      const aSet = adj.get(ids[i])!;
      for (let j = 0; j < ids.length; j++) {
        if (i !== j) aSet.add(ids[j]);
      }
    }
  }
  return adj;
}
