import { useEffect, useState } from 'react';
import { usePolicyStore } from '@/state/policyStore';

/**
 * Progress strip at the BOTTOM of the viewport. Combines an animated bar with
 * elapsed/estimated time so the user has a concrete sense of how long the
 * learning run will take. The bar advances determinately toward the estimate;
 * past the estimate it caps at 95 % until the request actually returns.
 */
export function ProgressStrip() {
  const isLearning = usePolicyStore((s) => s.isLearning);
  const startedAt = usePolicyStore((s) => s.learningStartedAt);
  const estimateSeconds = usePolicyStore((s) => s.learningEstimateSeconds);

  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!isLearning) return;
    const id = setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(id);
  }, [isLearning]);

  if (!isLearning) return null;
  const elapsed = startedAt ? (now - startedAt) / 1000 : 0;
  const est = estimateSeconds ?? 30;
  // Determinate progress, capped at 95% until the response arrives.
  const progress = Math.min(0.95, elapsed / est);
  const widthPct = `${(progress * 100).toFixed(1)}%`;
  const remainingSec = Math.max(0, est - elapsed);

  return (
    <div className="relative h-8 w-full border-t border-primary/40 bg-card">
      <div
        className="absolute inset-y-0 left-0 transition-[width] duration-200 ease-linear"
        style={{
          width: widthPct,
          background: 'hsl(var(--primary))',
          boxShadow: '0 0 14px hsl(var(--primary))',
          opacity: 0.85,
        }}
      />
      <div
        className="relative z-[1] flex h-full items-center justify-center gap-4 font-mono text-[11px] uppercase tracking-[0.18em]"
        style={{ color: 'hsl(var(--primary-foreground))' }}
      >
        <span
          className="row-progress-dot inline-block h-2 w-2 rounded-full"
          style={{ background: 'hsl(var(--primary))', boxShadow: '0 0 8px hsl(var(--primary))' }}
        />
        <span>Learning policy</span>
        <span className="opacity-80">{elapsed.toFixed(0)} / ~{est}s</span>
        <span className="opacity-60">{remainingSec > 0 ? `${remainingSec.toFixed(0)} s remaining` : 'finishing…'}</span>
      </div>
    </div>
  );
}
