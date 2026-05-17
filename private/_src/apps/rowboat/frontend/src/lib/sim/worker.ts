/// <reference lib="webworker" />
import { runRollouts, type RolloutProgress } from './monteCarlo';
import type {
  DestinationFeature,
  ParcelCollection,
  PolicyResult,
  ProjectSettings,
} from '@/types';

export interface TrainRequest {
  parcels: ParcelCollection;
  destinations: DestinationFeature[];
  settings: ProjectSettings;
  numRollouts: number;
  seed?: number | null;
}

export type TrainMessage =
  | { type: 'progress'; payload: RolloutProgress }
  | { type: 'result'; payload: PolicyResult }
  | { type: 'error'; payload: string };

const ctx = self as unknown as DedicatedWorkerGlobalScope;

ctx.onmessage = (e: MessageEvent<TrainRequest>) => {
  try {
    const { parcels, destinations, settings, numRollouts, seed } = e.data;
    const result = runRollouts(
      parcels,
      destinations,
      settings,
      numRollouts,
      seed ?? null,
      (p) => {
        const msg: TrainMessage = { type: 'progress', payload: p };
        ctx.postMessage(msg);
      }
    );
    const msg: TrainMessage = { type: 'result', payload: result };
    ctx.postMessage(msg);
  } catch (err) {
    const msg: TrainMessage = {
      type: 'error',
      payload: err instanceof Error ? err.stack ?? err.message : String(err),
    };
    ctx.postMessage(msg);
  }
};
