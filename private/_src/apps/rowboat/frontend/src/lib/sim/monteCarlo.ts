/**
 * In-browser Monte Carlo simulator — TypeScript port of the Python
 * `backend/app/sim/monte_carlo.py`. Same state-machine semantics:
 *
 *   NOT_ENGAGED → (engage at t)
 *     ENGAGED → (response after Δ ~ U[X2, X3])
 *       OFFER → ACQUIRED
 *       REFUSE → cheapest of:
 *         (a) EXPROPRIATING → (after X5) → EXPROPRIATED
 *         (b) ABANDONED + reroute (alt path via remaining parcels)
 *
 * The "policy" simulated here is a fixed baseline (FIFO engagement queue,
 * randomised order, hard concurrent-engagement budget). The histogram /
 * scenario panel surfaces the distribution this baseline produces under
 * stochastic responses + refusal-vs-reroute decisions.
 *
 * NOT a learned policy — same as the Python backend. The demo's point is
 * the simulator + scenario explorer; the "Learn" button label is aspirational
 * (matches the full backend version).
 */

import * as turf from '@turf/turf';
import type {
  DestinationFeature,
  ParcelCollection,
  ParcelFeature,
  PolicyResult,
  PolicyRolloutScenario,
  ProjectSettings,
  ScenarioEvent,
} from '@/types';
import type { LineString } from 'geojson';
import { buildAdjacency } from '@/lib/routing/adjacency';

type LngLat = [number, number];

const MAX_REROUTES = 50;

// -------- RNG --------

function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = t;
    r = Math.imul(r ^ (r >>> 15), r | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffleInPlace<T>(arr: T[], rng: () => number): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

// -------- Priority queue --------

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
  get size(): number {
    return this.items.length;
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

// -------- Geometry helpers --------

function centroidOf(f: ParcelFeature): LngLat {
  const c = turf.centroid(f).geometry.coordinates;
  return [c[0], c[1]];
}

function radiusAtCorner(a: LngLat, b: LngLat, c: LngLat): number {
  const mPerDegLat = 111_320;
  const mPerDegLng = 111_320 * Math.cos((a[1] * Math.PI) / 180);
  const bx = (b[0] - a[0]) * mPerDegLng;
  const by = (b[1] - a[1]) * mPerDegLat;
  const cx = (c[0] - a[0]) * mPerDegLng;
  const cy = (c[1] - a[1]) * mPerDegLat;
  const dAB = Math.hypot(bx, by);
  const dBC = Math.hypot(cx - bx, cy - by);
  const dAC = Math.hypot(cx, cy);
  const cross = bx * cy - by * cx;
  const area = Math.abs(cross) / 2;
  if (area < 1e-6 || dAB === 0 || dBC === 0) return Infinity;
  return (dAB * dBC * dAC) / (4 * area);
}

function haversineM(a: LngLat, b: LngLat): number {
  const R = 6_371_000;
  const lat1r = (a[1] * Math.PI) / 180;
  const lat2r = (b[1] * Math.PI) / 180;
  const dLat = ((b[1] - a[1]) * Math.PI) / 180;
  const dLon = ((b[0] - a[0]) * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1r) * Math.cos(lat2r) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// -------- Graph --------

type Graph = Map<string, Map<string, number>>;

function buildGraph(
  parcels: Map<string, ParcelFeature>,
  adj: Map<string, Set<string>>,
  centroids: Map<string, LngLat>
): { graph: Graph; predecessors: Map<string, Set<string>> } {
  const graph: Graph = new Map();
  const predecessors: Map<string, Set<string>> = new Map();
  for (const u of parcels.keys()) {
    graph.set(u, new Map());
    predecessors.set(u, new Set());
  }
  for (const [u, nbrs] of adj) {
    const fu = parcels.get(u);
    if (!fu) continue;
    const cu = centroids.get(u)!;
    for (const v of nbrs) {
      const fv = parcels.get(v);
      if (!fv) continue;
      const cv = centroids.get(v)!;
      const distM = haversineM(cu, cv);
      const avgUnit =
        (fu.properties.unitConstructionCost + fv.properties.unitConstructionCost) / 2;
      const construction = distM * avgUnit;
      let land: number;
      const st = fv.properties.status;
      if (st === 'acquired') land = 0;
      else if (st === 'negotiating') land = fv.properties.landCost;
      else {
        const p = fv.properties.acquisitionProbability;
        land = p * fv.properties.landCost + (1 - p) * fv.properties.expropriationCost;
      }
      graph.get(u)!.set(v, construction + land);
      predecessors.get(v)!.add(u);
    }
  }
  return { graph, predecessors };
}

function removeNode(
  graph: Graph,
  predecessors: Map<string, Set<string>>,
  pid: string
): void {
  const out = graph.get(pid);
  if (out) {
    for (const v of out.keys()) {
      predecessors.get(v)?.delete(pid);
    }
  }
  const preds = predecessors.get(pid);
  if (preds) {
    for (const u of preds) {
      graph.get(u)?.delete(pid);
    }
  }
  graph.delete(pid);
  predecessors.delete(pid);
}

function zeroLand(
  graph: Graph,
  predecessors: Map<string, Set<string>>,
  pid: string,
  landRemoved: number
): void {
  const preds = predecessors.get(pid);
  if (!preds) return;
  for (const u of preds) {
    const edges = graph.get(u);
    if (!edges) continue;
    const w = edges.get(pid);
    if (w !== undefined) edges.set(pid, Math.max(0, w - landRemoved));
  }
}

// -------- Prev-aware shortest path (curvature-respecting) --------

function prevAwareShortestPath(
  graph: Graph,
  centroids: Map<string, LngLat>,
  source: string,
  sink: string,
  minRadiusM: number,
  excluded: Set<string> | null
): string[] | null {
  if (excluded && (excluded.has(source) || excluded.has(sink))) return null;
  if (!graph.has(source) || !graph.has(sink)) return null;
  if (source === sink) return [source];

  // State = (curr, prev). Encode as "curr|prev" (parcel IDs are p-NNNN so | is safe).
  const stateKey = (curr: string, prev: string | null) =>
    prev == null ? `${curr}|` : `${curr}|${prev}`;
  const currOfKey = (k: string): string => k.slice(0, k.indexOf('|'));

  const startKey = stateKey(source, null);
  const dist = new Map<string, number>([[startKey, 0]]);
  const parent = new Map<string, string | null>([[startKey, null]]);
  const heap = new MinHeap<{ key: string; curr: string; prev: string | null; d: number }>(
    (a, b) => a.d - b.d
  );
  heap.push({ key: startKey, curr: source, prev: null, d: 0 });

  while (heap.size > 0) {
    const { key, curr, prev, d } = heap.pop()!;
    if (d > (dist.get(key) ?? Infinity)) continue;
    if (curr === sink) {
      const out: string[] = [];
      let k: string | null = key;
      const guard = new Set<string>();
      while (k !== null) {
        if (guard.has(k)) return null;
        guard.add(k);
        out.push(currOfKey(k));
        k = parent.get(k) ?? null;
      }
      out.reverse();
      return out;
    }
    const nbrs = graph.get(curr);
    if (!nbrs) continue;
    for (const [nbr, w] of nbrs) {
      if (excluded && excluded.has(nbr)) continue;
      if (prev !== null && minRadiusM > 0) {
        const r = radiusAtCorner(centroids.get(prev)!, centroids.get(curr)!, centroids.get(nbr)!);
        if (r < minRadiusM) continue;
      }
      const alt = d + w;
      const newKey = stateKey(nbr, curr);
      if (alt < (dist.get(newKey) ?? Infinity)) {
        dist.set(newKey, alt);
        parent.set(newKey, key);
        heap.push({ key: newKey, curr: nbr, prev: curr, d: alt });
      }
    }
  }
  return null;
}

function pathThroughDestinations(
  graph: Graph,
  centroids: Map<string, LngLat>,
  destHosts: string[],
  minRadiusM: number,
  excluded: Set<string> | null = null
): string[] | null {
  const full: string[] = [];
  for (let i = 0; i < destHosts.length - 1; i++) {
    let seg = prevAwareShortestPath(graph, centroids, destHosts[i], destHosts[i + 1], minRadiusM, excluded);
    if (seg === null && minRadiusM > 0) {
      seg = prevAwareShortestPath(graph, centroids, destHosts[i], destHosts[i + 1], 0, excluded);
    }
    if (seg === null) return null;
    if (i === 0) full.push(...seg);
    else full.push(...seg.slice(1));
  }
  return full;
}

// -------- Host parcel lookup --------

function findHostParcel(
  coord: LngLat,
  parcels: Map<string, ParcelFeature>,
  centroids: Map<string, LngLat>
): string | null {
  const pt = turf.point(coord);
  for (const [id, p] of parcels) {
    if (turf.booleanPointInPolygon(pt, p)) return id;
  }
  let bestId: string | null = null;
  let bestD = Infinity;
  for (const [id, c] of centroids) {
    const d = haversineM(coord, c);
    if (d < bestD) {
      bestD = d;
      bestId = id;
    }
  }
  return bestId;
}

// -------- Polyline-clipped parcels --------

function alignmentCoords(
  path: string[],
  centroids: Map<string, LngLat>,
  sortedDest: DestinationFeature[]
): number[][] {
  const coords: number[][] = [sortedDest[0].geometry.coordinates as number[]];
  for (const pid of path) {
    const c = centroids.get(pid);
    if (c) coords.push([c[0], c[1]]);
  }
  coords.push(sortedDest[sortedDest.length - 1].geometry.coordinates as number[]);
  return coords;
}

/**
 * Parcels whose geometry the polyline intersects but that aren't on the
 * path. The polyline-clipped set has to be acquired alongside the path
 * proper. Bbox prefilter knocks the per-rollout cost of this from ~80% of
 * the runtime down to under 10%.
 */
function polylineClippedParcels(
  path: string[],
  parcelsById: Map<string, ParcelFeature>,
  parcelBboxes: Map<string, [number, number, number, number]>,
  centroids: Map<string, LngLat>,
  sortedDest: DestinationFeature[]
): string[] {
  const coords = alignmentCoords(path, centroids, sortedDest);
  if (coords.length < 2) return [];
  const line = turf.lineString(coords);
  const [lw, ls, le, ln] = turf.bbox(line);
  // Pad by ~one parcel-radius (~0.01° ≈ 1 km at mid-lat) so we don't miss
  // parcels whose interior the line clips but whose bbox just barely fails.
  const pad = 0.01;
  const pw = lw - pad;
  const ps = ls - pad;
  const pe = le + pad;
  const pn = ln + pad;
  const pathSet = new Set(path);
  const extra: string[] = [];
  for (const [pid, feat] of parcelsById) {
    if (pathSet.has(pid)) continue;
    if (feat.properties.status === 'abandoned') continue;
    const bb = parcelBboxes.get(pid);
    if (!bb) continue;
    if (bb[2] < pw || bb[0] > pe || bb[3] < ps || bb[1] > pn) continue;
    if (turf.booleanIntersects(line, feat)) extra.push(pid);
  }
  return extra;
}

// -------- Parcel sim state --------

type ParcelLifecycle =
  | 'not_engaged'
  | 'engaged'
  | 'acquired'
  | 'easement'
  | 'expropriating'
  | 'expropriated'
  | 'abandoned';

interface ParcelSimState {
  status: ParcelLifecycle;
  engagedAt: number | null;
  resolvedAt: number | null;
}

// -------- One rollout --------

function simulateOne(
  parcelsById: Map<string, ParcelFeature>,
  parcelBboxes: Map<string, [number, number, number, number]>,
  centroids: Map<string, LngLat>,
  sortedDest: DestinationFeature[],
  baseGraph: Graph,
  basePred: Map<string, Set<string>>,
  destHosts: string[],
  settings: ProjectSettings,
  rng: () => number,
  scenarioId: string
): PolicyRolloutScenario {
  // Clone the base graph + predecessor map so each rollout mutates its own
  // copy without touching the shared baseline.
  const graph: Graph = new Map();
  const predecessors: Map<string, Set<string>> = new Map();
  for (const [u, edges] of baseGraph) graph.set(u, new Map(edges));
  for (const [v, preds] of basePred) predecessors.set(v, new Set(preds));

  // Honour user-set parcel statuses BEFORE computing the initial path.
  const preAcquired = new Set<string>();
  const preBlocked = new Set<string>();
  for (const [pid, feat] of parcelsById) {
    if (feat.properties.status === 'acquired') preAcquired.add(pid);
    else if (feat.properties.status === 'abandoned') {
      preBlocked.add(pid);
      removeNode(graph, predecessors, pid);
    }
  }

  const initialPath = pathThroughDestinations(
    graph,
    centroids,
    destHosts,
    settings.minRadiusOfCurvatureM
  );
  if (!initialPath) {
    return {
      scenarioId,
      acquired: [],
      easement: [],
      expropriated: [],
      abandoned: [],
      events: [],
      finalAlignment: null,
      totalCost: 0,
      totalTimeSteps: 0,
    };
  }

  const simState = new Map<string, ParcelSimState>();
  for (const pid of parcelsById.keys()) {
    simState.set(pid, { status: 'not_engaged', engagedAt: null, resolvedAt: null });
  }

  const events: ScenarioEvent[] = [];
  const eventsPq = new MinHeap<{
    day: number;
    seq: number;
    type: 'response' | 'expropriate_complete';
    pid: string;
  }>((a, b) => (a.day === b.day ? a.seq - b.seq : a.day - b.day));
  let seq = 0;

  const totals = { engage: 0, negotiation: 0, land: 0 };
  let currentPath = [...initialPath];
  let currentPathSet = new Set(currentPath);
  let currentRescue = new Set<string>();
  const abandoned = new Set<string>(preBlocked);
  // Index into pendingQueue rather than shift() so dequeue is O(1).
  let pendingQueue: string[] = [];
  let pendingHead = 0;
  const avgResponse = (settings.responseMinDays + settings.responseMaxDays) / 2;
  const maxConcurrent = Math.max(1, Math.floor(settings.maxConcurrentEngagements));
  let runningAcq = 0;

  const costAt = (day: number) =>
    runningAcq + day * settings.projectCarryCostPerDay;

  const emitEvent = (
    action: ScenarioEvent['action'],
    pid: string,
    day: number,
    path: string[]
  ) => {
    events.push({
      parcelId: pid,
      action,
      day,
      pathAfter: [...path],
      costToDate: costAt(day),
    });
  };

  // Synthetic day-0 events for user-set statuses.
  for (const pid of preAcquired) {
    const s = simState.get(pid)!;
    s.status = 'acquired';
    s.resolvedAt = 0;
    emitEvent('acquire', pid, 0, initialPath);
  }
  for (const pid of preBlocked) {
    const s = simState.get(pid)!;
    s.status = 'abandoned';
    s.resolvedAt = 0;
    emitEvent('abandon', pid, 0, initialPath);
  }

  const engage = (pid: string, day: number, pathForEvent: string[]): void => {
    const s = simState.get(pid)!;
    if (s.status !== 'not_engaged') return;
    s.status = 'engaged';
    s.engagedAt = day;
    totals.engage += settings.engagementCost;
    runningAcq += settings.engagementCost;
    const delay =
      settings.responseMinDays + rng() * (settings.responseMaxDays - settings.responseMinDays);
    eventsPq.push({ day: day + delay, seq: seq++, type: 'response', pid });
    emitEvent('engage', pid, day, pathForEvent);
  };

  const activeEngagements = (): number => {
    let n = 0;
    for (const s of simState.values()) {
      if (s.status === 'engaged' || s.status === 'expropriating') n++;
    }
    return n;
  };

  const rebuildQueue = (path: string[]) => {
    currentRescue = new Set(
      polylineClippedParcels(path, parcelsById, parcelBboxes, centroids, sortedDest)
    );
    const seen = new Set<string>();
    const candidates: string[] = [];
    for (const pid of [...path, ...currentRescue]) {
      if (seen.has(pid)) continue;
      seen.add(pid);
      if (simState.get(pid)?.status === 'not_engaged') candidates.push(pid);
    }
    shuffleInPlace(candidates, rng);
    pendingQueue = candidates;
    pendingHead = 0;
  };

  const topUp = (day: number) => {
    while (activeEngagements() < maxConcurrent && pendingHead < pendingQueue.length) {
      const pid = pendingQueue[pendingHead++];
      if (simState.get(pid)?.status !== 'not_engaged') continue;
      if (!currentPathSet.has(pid) && !currentRescue.has(pid)) continue;
      engage(pid, day, currentPath);
    }
  };

  rebuildQueue(currentPath);
  topUp(0);

  let projectDone = 0;
  let rerouteCount = 0;

  while (eventsPq.size > 0) {
    const { day, type, pid } = eventsPq.pop()!;
    const state = simState.get(pid)!;
    const feat = parcelsById.get(pid)!;

    if (type === 'response') {
      const negotiatingDays = Math.max(0, day - (state.engagedAt ?? 0));
      totals.negotiation += negotiatingDays * settings.negotiationCostPerDay;
      runningAcq += negotiatingDays * settings.negotiationCostPerDay;

      const prob = feat.properties.acquisitionProbability;
      const landRemovedFull =
        prob * feat.properties.landCost + (1 - prob) * feat.properties.expropriationCost;

      if (rng() < prob) {
        // Owner accepts the purchase outright.
        state.status = 'acquired';
        state.resolvedAt = day;
        totals.land += feat.properties.landCost;
        runningAcq += feat.properties.landCost;
        zeroLand(graph, predecessors, pid, landRemovedFull);
        emitEvent('offer', pid, day, currentPath);
        emitEvent('acquire', pid, day, currentPath);
        projectDone = Math.max(projectDone, day);
        topUp(day);
        continue;
      }

      // Purchase refused — try easement. Many owners accept perpetual
      // strip-easement rights at a discount even after declining a sale.
      if (rng() < settings.easementOfferProbability) {
        const easementCost = feat.properties.landCost * settings.easementCostFraction;
        state.status = 'easement';
        state.resolvedAt = day;
        totals.land += easementCost;
        runningAcq += easementCost;
        zeroLand(graph, predecessors, pid, landRemovedFull);
        emitEvent('refuse', pid, day, currentPath);
        emitEvent('easement', pid, day, currentPath);
        projectDone = Math.max(projectDone, day);
        topUp(day);
        continue;
      }

      // Both purchase and easement refused — choose expropriation vs reroute.
      emitEvent('refuse', pid, day, currentPath);
      let costExpropriate =
        feat.properties.expropriationCost +
        settings.expropriationDays * settings.projectCarryCostPerDay;
      const expCompleteDay = day + settings.expropriationDays;
      if (expCompleteDay > settings.longStopDays) {
        costExpropriate += settings.longStopPenalty;
      }

      let costReroute = Infinity;
      let altPath: string[] | null = null;
      if (currentPathSet.has(pid) && rerouteCount < MAX_REROUTES) {
        const excluded = new Set<string>([...abandoned, pid]);
        altPath = pathThroughDestinations(
          graph,
          centroids,
          destHosts,
          settings.minRadiusOfCurvatureM,
          excluded
        );
        if (altPath !== null) {
          // The MARGINAL cost of rerouting is only the detour: parcels that
          // are on the alt path but NOT on the current path. Parcels on
          // both paths would have been engaged either way, so charging
          // them against the reroute decision overstates its cost and
          // makes the agent prefer expropriation almost always.
          const newPidsSet = new Set<string>();
          const newPids: string[] = [];
          for (const npid of altPath) {
            if (currentPathSet.has(npid)) continue;
            if (simState.get(npid)?.status === 'not_engaged' && !newPidsSet.has(npid)) {
              newPidsSet.add(npid);
              newPids.push(npid);
            }
          }
          for (const npid of polylineClippedParcels(altPath, parcelsById, parcelBboxes, centroids, sortedDest)) {
            if (currentPathSet.has(npid)) continue;
            if (currentRescue.has(npid)) continue;
            if (simState.get(npid)?.status === 'not_engaged' && !newPidsSet.has(npid)) {
              newPidsSet.add(npid);
              newPids.push(npid);
            }
          }
          costReroute = 0;
          for (const npid of newPids) {
            const nf = parcelsById.get(npid)!;
            const np = nf.properties.acquisitionProbability;
            const expectedLand =
              np * nf.properties.landCost + (1 - np) * nf.properties.expropriationCost;
            costReroute +=
              settings.engagementCost +
              avgResponse * settings.negotiationCostPerDay +
              expectedLand;
          }
          costReroute += avgResponse * settings.projectCarryCostPerDay;
        }
      }

      if (altPath !== null && costReroute < costExpropriate) {
        state.status = 'abandoned';
        state.resolvedAt = day;
        abandoned.add(pid);
        rerouteCount += 1;
        if (graph.has(pid)) removeNode(graph, predecessors, pid);
        emitEvent('abandon', pid, day, altPath);
        currentPath = altPath;
        currentPathSet = new Set(currentPath);
        rebuildQueue(currentPath);
        topUp(day);
      } else {
        state.status = 'expropriating';
        emitEvent('expropriate-start', pid, day, currentPath);
        const landRemoved =
          prob * feat.properties.landCost + (1 - prob) * feat.properties.expropriationCost;
        zeroLand(graph, predecessors, pid, landRemoved);
        const completeAt = day + settings.expropriationDays;
        eventsPq.push({ day: completeAt, seq: seq++, type: 'expropriate_complete', pid });
      }
    } else if (type === 'expropriate_complete') {
      state.status = 'expropriated';
      state.resolvedAt = day;
      totals.land += feat.properties.expropriationCost;
      runningAcq += feat.properties.expropriationCost;
      emitEvent('expropriate', pid, day, currentPath);
      projectDone = Math.max(projectDone, day);
      topUp(day);
    }
  }

  // Construction cost on the final path.
  let totalLenM = 0;
  let prev: LngLat | null = null;
  for (const pid of currentPath) {
    const c = centroids.get(pid)!;
    if (prev !== null) totalLenM += haversineM(prev, c);
    prev = c;
  }
  let avgUnit = 0;
  if (currentPath.length > 0) {
    for (const pid of currentPath) {
      avgUnit += parcelsById.get(pid)!.properties.unitConstructionCost;
    }
    avgUnit /= currentPath.length;
  }
  const constructionCost = avgUnit * totalLenM;
  const carryingCost = settings.projectCarryCostPerDay * projectDone;
  const longStopPenalty =
    projectDone > settings.longStopDays ? settings.longStopPenalty : 0;

  const totalCost =
    totals.engage + totals.negotiation + totals.land + constructionCost + carryingCost + longStopPenalty;

  events.sort((a, b) => a.day - b.day);

  const acquired: string[] = [];
  const easement: string[] = [];
  const expropriated: string[] = [];
  for (const [pid, s] of simState) {
    if (s.status === 'acquired') acquired.push(pid);
    else if (s.status === 'easement') easement.push(pid);
    else if (s.status === 'expropriated') expropriated.push(pid);
  }
  const abandonedList = [...abandoned].sort();

  const finalAlignment: LineString | null = {
    type: 'LineString',
    coordinates: alignmentCoords(currentPath, centroids, sortedDest),
  };

  return {
    scenarioId,
    acquired,
    easement,
    expropriated,
    abandoned: abandonedList,
    events,
    finalAlignment,
    totalCost,
    totalTimeSteps: Math.floor(projectDone),
  };
}

// -------- Top-level entry point --------

export interface RolloutProgress {
  done: number;
  total: number;
}

export function runRollouts(
  parcelsFC: ParcelCollection,
  destinations: DestinationFeature[],
  settings: ProjectSettings,
  numRollouts: number,
  seed: number | null = null,
  onProgress?: (p: RolloutProgress) => void
): PolicyResult {
  const baseSeed = seed ?? Math.floor(Math.random() * 1e9);
  const rng = mulberry32(baseSeed);

  const parcelsById = new Map<string, ParcelFeature>(
    parcelsFC.features.map((f) => [f.properties.id, f])
  );
  const centroids = new Map<string, LngLat>();
  const parcelBboxes = new Map<string, [number, number, number, number]>();
  for (const f of parcelsFC.features) {
    centroids.set(f.properties.id, centroidOf(f));
    parcelBboxes.set(
      f.properties.id,
      turf.bbox(f) as [number, number, number, number]
    );
  }
  const adj = buildAdjacency(parcelsFC);

  const sortedDest = [...destinations].sort(
    (a, b) => a.properties.order - b.properties.order
  );
  const destHosts: string[] = [];
  for (const d of sortedDest) {
    const h = findHostParcel(d.geometry.coordinates as LngLat, parcelsById, centroids);
    if (!h) {
      return {
        policyId: `pol-${baseSeed.toString(16).slice(0, 8)}`,
        firstActions: [],
        costDistribution: [],
        timeDistribution: [],
        scenarios: [],
      };
    }
    destHosts.push(h);
  }

  const { graph: baseGraph, predecessors: basePred } = buildGraph(parcelsById, adj, centroids);

  const scenarios: PolicyRolloutScenario[] = [];
  const costs: number[] = [];
  const times: number[] = [];
  const acquiredCounter = new Map<string, number>();

  for (let i = 0; i < numRollouts; i++) {
    const sc = simulateOne(
      parcelsById,
      parcelBboxes,
      centroids,
      sortedDest,
      baseGraph,
      basePred,
      destHosts,
      settings,
      rng,
      `sc-${i.toString().padStart(4, '0')}`
    );
    scenarios.push(sc);
    costs.push(sc.totalCost);
    times.push(sc.totalTimeSteps);
    for (const pid of sc.acquired) {
      acquiredCounter.set(pid, (acquiredCounter.get(pid) ?? 0) + 1);
    }
    for (const pid of sc.easement) {
      acquiredCounter.set(pid, (acquiredCounter.get(pid) ?? 0) + 1);
    }
    for (const pid of sc.expropriated) {
      acquiredCounter.set(pid, (acquiredCounter.get(pid) ?? 0) + 1);
    }
    if (onProgress) onProgress({ done: i + 1, total: numRollouts });
  }

  const top = [...acquiredCounter.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
  const firstActions = top.map(([parcelId, count]) => ({
    parcelId,
    action: 'acquire' as const,
    score: count / Math.max(1, numRollouts),
  }));

  return {
    policyId: `pol-${baseSeed.toString(16).slice(0, 8)}`,
    firstActions,
    costDistribution: costs,
    timeDistribution: times,
    scenarios,
  };
}
