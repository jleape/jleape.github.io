import { useMemo } from 'react';

interface HistogramProps {
  values: number[];
  bins?: number;
  width?: number;
  height?: number;
  highlightValue?: number | null;
  /** Optional second reference line (e.g., planned cost or long-stop date). */
  referenceValue?: number | null;
  referenceLabel?: string;
  /**
   * Optional fixed domain [x0, x1] for the bins. When omitted the domain is
   * derived from the values' min/max, rounded to "nice" boundaries so the
   * bin edges stay stable across runs of similar magnitude.
   */
  xRange?: [number, number];
  format?: (v: number) => string;
  title?: string;
}

interface Bin {
  x0: number;
  x1: number;
  count: number;
}

/**
 * Round `v` UP to a "nice" boundary that's a 1/2/5 × 10^k multiple. Used to
 * produce stable histogram domains: similar distributions yield the same
 * niceCeil, so two training runs on the same project share bin edges.
 */
function niceCeil(v: number): number {
  if (!isFinite(v) || v <= 0) return 1;
  const mag = Math.pow(10, Math.floor(Math.log10(v)));
  const norm = v / mag;
  let step: number;
  if (norm <= 1) step = 1;
  else if (norm <= 2) step = 2;
  else if (norm <= 5) step = 5;
  else step = 10;
  return step * mag;
}

function niceFloor(v: number): number {
  if (!isFinite(v) || v <= 0) return 0;
  const mag = Math.pow(10, Math.floor(Math.log10(v)));
  const norm = v / mag;
  let step: number;
  if (norm < 1) step = 0;
  else if (norm < 2) step = 1;
  else if (norm < 5) step = 2;
  else step = 5;
  return step * mag;
}

function makeBins(
  values: number[],
  binCount: number,
  fixed?: [number, number]
): Bin[] {
  if (values.length === 0 && !fixed) return [];
  let lo: number;
  let hi: number;
  if (fixed) {
    [lo, hi] = fixed;
  } else {
    const rawMin = Math.min(...values);
    const rawMax = Math.max(...values);
    if (rawMin === rawMax) {
      return [{ x0: rawMin, x1: rawMax + 1, count: values.length }];
    }
    // Stable bin edges: niceFloor below and niceCeil above the data range.
    lo = rawMin > 0 ? niceFloor(rawMin) : 0;
    hi = niceCeil(rawMax);
  }
  if (hi <= lo) hi = lo + 1;
  const width = (hi - lo) / binCount;
  const bins: Bin[] = Array.from({ length: binCount }, (_, i) => ({
    x0: lo + i * width,
    x1: lo + (i + 1) * width,
    count: 0,
  }));
  for (const v of values) {
    let idx = Math.floor((v - lo) / width);
    if (idx < 0) idx = 0;
    if (idx >= binCount) idx = binCount - 1;
    bins[idx].count++;
  }
  return bins;
}

const defaultFormat = (v: number) =>
  Math.abs(v) >= 1e6
    ? `${(v / 1e6).toFixed(1)}M`
    : Math.abs(v) >= 1e3
      ? `${(v / 1e3).toFixed(1)}k`
      : v.toFixed(0);

export function Histogram({
  values,
  bins = 20,
  width = 280,
  height = 90,
  highlightValue,
  referenceValue,
  referenceLabel,
  xRange,
  format = defaultFormat,
  title,
}: HistogramProps) {
  // Stable domain. If the caller passes an xRange we honour it. Otherwise we
  // widen the data-derived [min, max] to include both the highlightValue (the
  // currently-selected scenario) and the referenceValue (e.g., planned cost),
  // so both reference lines are always in-frame.
  const effectiveRange = useMemo<[number, number] | undefined>(() => {
    if (xRange) return xRange;
    if (values.length === 0) return undefined;
    let lo = Math.min(...values);
    let hi = Math.max(...values);
    for (const ref of [highlightValue, referenceValue]) {
      if (ref != null && isFinite(ref)) {
        if (ref < lo) lo = ref;
        if (ref > hi) hi = ref;
      }
    }
    if (hi <= lo) return undefined;
    lo = lo > 0 ? niceFloor(lo) : 0;
    hi = niceCeil(hi);
    return [lo, hi];
  }, [xRange, values, highlightValue, referenceValue]);

  const data = useMemo(
    () => makeBins(values, bins, effectiveRange),
    [values, bins, effectiveRange]
  );
  if (data.length === 0) {
    return <div className="text-xs text-zinc-400">No data</div>;
  }
  const maxCount = Math.max(...data.map((b) => b.count), 1);
  const xMin = data[0].x0;
  const xMax = data[data.length - 1].x1;
  const paddingX = 4;
  const paddingY = 14;
  const plotW = width - paddingX * 2;
  const plotH = height - paddingY * 2;

  const xToPx = (x: number) => paddingX + ((x - xMin) / (xMax - xMin)) * plotW;
  const clampToPx = (x: number) =>
    Math.max(paddingX, Math.min(width - paddingX, xToPx(x)));

  const mean = values.reduce((a, b) => a + b, 0) / Math.max(1, values.length);

  return (
    <div>
      {title && (
        <div className="mb-1 text-[11px] font-medium uppercase tracking-wider text-foreground">
          {title}
        </div>
      )}
      <svg width={width} height={height} className="block">
        {data.map((b, i) => {
          const x = xToPx(b.x0);
          const w = Math.max(1, xToPx(b.x1) - x - 1);
          const h = (b.count / maxCount) * plotH;
          return (
            <rect
              key={i}
              x={x}
              y={paddingY + plotH - h}
              width={w}
              height={h}
              fill="hsl(var(--primary))"
              fillOpacity={0.85}
            />
          );
        })}
        {values.length > 0 && (
          <line
            x1={xToPx(mean)}
            x2={xToPx(mean)}
            y1={paddingY}
            y2={paddingY + plotH}
            stroke="hsl(var(--foreground))"
            strokeDasharray="3 3"
            strokeWidth={1}
          />
        )}
        {referenceValue != null && isFinite(referenceValue) && (
          <line
            x1={clampToPx(referenceValue)}
            x2={clampToPx(referenceValue)}
            y1={paddingY}
            y2={paddingY + plotH}
            stroke="#fde047"
            strokeWidth={1.5}
            strokeDasharray="4 2"
          >
            <title>
              {referenceLabel ? `${referenceLabel}: ${format(referenceValue)}` : format(referenceValue)}
            </title>
          </line>
        )}
        {highlightValue != null && (
          <line
            x1={clampToPx(highlightValue)}
            x2={clampToPx(highlightValue)}
            y1={paddingY}
            y2={paddingY + plotH}
            stroke="#ef4444"
            strokeWidth={1.5}
          />
        )}
        <text x={paddingX} y={height - 1} fill="hsl(var(--muted-foreground))" style={{ fontSize: 10 }}>
          {format(xMin)}
        </text>
        <text
          x={width - paddingX}
          y={height - 1}
          textAnchor="end"
          fill="hsl(var(--muted-foreground))"
          style={{ fontSize: 10 }}
        >
          {format(xMax)}
        </text>
      </svg>
      <div className="text-[10px] text-muted-foreground">
        n={values.length} · mean={format(mean)}
        {highlightValue != null && ` · current=${format(highlightValue)}`}
        {referenceValue != null && referenceLabel && ` · ${referenceLabel}=${format(referenceValue)}`}
      </div>
    </div>
  );
}
