import type {
  DestinationFeature,
  ParcelCollection,
  PolicyResult,
  ProjectSettings,
} from '@/types';
import type { TrainMessage, TrainRequest } from './worker';

/**
 * Public entrypoint for the demo's client-only "Learn" button. Spawns the
 * Monte Carlo simulator in a Web Worker so the main thread (and the boat
 * animation) stays responsive during the run. Resolves with the same
 * PolicyResult shape the original Python backend returned.
 */
export function trainPolicyInBrowser(
  parcels: ParcelCollection,
  destinations: DestinationFeature[],
  settings: ProjectSettings,
  numRollouts: number,
  seed: number | null = null,
  onProgress?: (done: number, total: number) => void
): Promise<PolicyResult> {
  return new Promise<PolicyResult>((resolve, reject) => {
    const worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });
    worker.onmessage = (e: MessageEvent<TrainMessage>) => {
      const m = e.data;
      if (m.type === 'progress') {
        onProgress?.(m.payload.done, m.payload.total);
      } else if (m.type === 'result') {
        resolve(m.payload);
        worker.terminate();
      } else if (m.type === 'error') {
        reject(new Error(m.payload));
        worker.terminate();
      }
    };
    worker.onerror = (err) => {
      reject(err.error ?? new Error(err.message || 'Worker error'));
      worker.terminate();
    };
    const req: TrainRequest = {
      parcels,
      destinations,
      settings,
      numRollouts,
      seed,
    };
    worker.postMessage(req);
  });
}
