class MinHeap<T> {
  private items: T[] = [];
  constructor(private cmp: (a: T, b: T) => number) {}
  push(x: T): void {
    this.items.push(x);
    this.bubbleUp(this.items.length - 1);
  }
  pop(): T | undefined {
    if (this.items.length === 0) return undefined;
    const top = this.items[0];
    const last = this.items.pop()!;
    if (this.items.length > 0) {
      this.items[0] = last;
      this.bubbleDown(0);
    }
    return top;
  }
  isEmpty(): boolean {
    return this.items.length === 0;
  }
  private bubbleUp(i: number): void {
    while (i > 0) {
      const p = (i - 1) >>> 1;
      if (this.cmp(this.items[i], this.items[p]) < 0) {
        [this.items[i], this.items[p]] = [this.items[p], this.items[i]];
        i = p;
      } else break;
    }
  }
  private bubbleDown(i: number): void {
    const n = this.items.length;
    while (true) {
      const l = 2 * i + 1;
      const r = 2 * i + 2;
      let best = i;
      if (l < n && this.cmp(this.items[l], this.items[best]) < 0) best = l;
      if (r < n && this.cmp(this.items[r], this.items[best]) < 0) best = r;
      if (best === i) break;
      [this.items[i], this.items[best]] = [this.items[best], this.items[i]];
      i = best;
    }
  }
}

export interface DijkstraResult {
  distances: Map<string, number>;
  predecessors: Map<string, string | null>;
}

/**
 * Dijkstra over an arbitrary node set with a callback-based neighbour and cost interface.
 * `cost(from, to)` is the edge cost; node-only cost can be folded in by the caller.
 */
export function dijkstra(
  nodes: Iterable<string>,
  neighbors: (id: string) => Iterable<string>,
  cost: (from: string, to: string) => number,
  source: string,
  sink?: string
): DijkstraResult {
  const dist = new Map<string, number>();
  const prev = new Map<string, string | null>();
  for (const id of nodes) {
    dist.set(id, Infinity);
    prev.set(id, null);
  }
  if (!dist.has(source)) return { distances: dist, predecessors: prev };
  dist.set(source, 0);
  const heap = new MinHeap<{ id: string; d: number }>((a, b) => a.d - b.d);
  heap.push({ id: source, d: 0 });
  while (!heap.isEmpty()) {
    const { id, d } = heap.pop()!;
    if (d > (dist.get(id) ?? Infinity)) continue;
    if (sink !== undefined && id === sink) break;
    for (const nbr of neighbors(id)) {
      const w = cost(id, nbr);
      if (!isFinite(w)) continue;
      const alt = d + w;
      if (alt < (dist.get(nbr) ?? Infinity)) {
        dist.set(nbr, alt);
        prev.set(nbr, id);
        heap.push({ id: nbr, d: alt });
      }
    }
  }
  return { distances: dist, predecessors: prev };
}

export function reconstructPath(result: DijkstraResult, sink: string): string[] | null {
  if (!isFinite(result.distances.get(sink) ?? Infinity)) return null;
  const path: string[] = [];
  let cur: string | null = sink;
  const guard = new Set<string>();
  while (cur !== null) {
    if (guard.has(cur)) return null;
    guard.add(cur);
    path.push(cur);
    cur = result.predecessors.get(cur) ?? null;
  }
  return path.reverse();
}

/**
 * Prev-aware Dijkstra: shortest path from source to sink where each step's
 * validity depends on the previous node as well. Used to enforce a min radius
 * of curvature on the routed corridor.
 *
 * State space is (current, previous). For a graph of ~600 nodes with avg
 * degree 6 this is bounded by ~3.6k state-edges per step, well within budget.
 *
 * `validTransition(prev, curr, next)` returns false to forbid a transition.
 * The first valid step from source has prev = null.
 */
export function dijkstraPrevAware(
  neighbors: (id: string) => Iterable<string>,
  cost: (from: string, to: string) => number,
  validTransition: (prev: string | null, curr: string, next: string) => boolean,
  source: string,
  sink: string
): { path: string[] | null; cost: number } {
  if (source === sink) return { path: [source], cost: 0 };
  const stateKey = (curr: string, prev: string | null) => `${curr}${prev ?? ''}`;
  const startKey = stateKey(source, null);
  const dist = new Map<string, number>([[startKey, 0]]);
  const parent = new Map<string, string | null>([[startKey, null]]);
  const heap = new MinHeap<{ key: string; curr: string; prev: string | null; d: number }>(
    (a, b) => a.d - b.d
  );
  heap.push({ key: startKey, curr: source, prev: null, d: 0 });

  while (!heap.isEmpty()) {
    const { key, curr, prev, d } = heap.pop()!;
    if (d > (dist.get(key) ?? Infinity)) continue;
    if (curr === sink) {
      // Reconstruct: walk parent chain extracting curr from each key.
      const out: string[] = [];
      let k: string | null = key;
      const guard = new Set<string>();
      while (k !== null) {
        if (guard.has(k)) return { path: null, cost: Infinity };
        guard.add(k);
        const sep = k.indexOf('');
        out.push(sep >= 0 ? k.slice(0, sep) : k);
        k = parent.get(k) ?? null;
      }
      out.reverse();
      return { path: out, cost: d };
    }
    for (const nbr of neighbors(curr)) {
      if (!validTransition(prev, curr, nbr)) continue;
      const w = cost(curr, nbr);
      if (!isFinite(w)) continue;
      const newKey = stateKey(nbr, curr);
      const alt = d + w;
      if (alt < (dist.get(newKey) ?? Infinity)) {
        dist.set(newKey, alt);
        parent.set(newKey, key);
        heap.push({ key: newKey, curr: nbr, prev: curr, d: alt });
      }
    }
  }
  return { path: null, cost: Infinity };
}
