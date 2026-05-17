/**
 * 3 significant figures, no scientific notation. Adds k/M/B unit suffixes so
 * large values stay compact. The result is always a finite string ready to
 * concatenate with a unit (e.g., '$').
 */
export function sigfig(value: number, digits = 3): string {
  if (!isFinite(value)) return '—';
  if (value === 0) return '0';
  const sign = value < 0 ? '-' : '';
  const v = Math.abs(value);
  let unit = '';
  let scaled = v;
  if (v >= 1e9) {
    unit = 'B';
    scaled = v / 1e9;
  } else if (v >= 1e6) {
    unit = 'M';
    scaled = v / 1e6;
  } else if (v >= 1e3) {
    unit = 'k';
    scaled = v / 1e3;
  }
  const intLen = scaled >= 100 ? 3 : scaled >= 10 ? 2 : 1;
  const decimals = Math.max(0, digits - intLen);
  return `${sign}${scaled.toFixed(decimals)}${unit}`;
}

export const money = (v: number): string => `$${sigfig(v)}`;

export const percent = (v: number): string => {
  // v expected in [0, 1] range. 3 sig figs of the percent value.
  const p = v * 100;
  if (!isFinite(p)) return '—';
  if (p === 0) return '0%';
  return `${sigfig(p)}%`;
};

/**
 * Render a day-count in human-friendly years + remainder days. Examples:
 *   0     -> "0 d"
 *   270   -> "270 d"
 *   365   -> "1 y"
 *   1872  -> "5 y 47 d"
 *   3650  -> "10 y"
 */
export const days = (v: number): string => {
  if (!isFinite(v) || v < 0) return '—';
  const d = Math.round(v);
  if (d < 365) return `${d.toLocaleString('en-US')} d`;
  const y = Math.floor(d / 365);
  const r = d % 365;
  if (r === 0) return `${y} y`;
  return `${y} y ${r.toLocaleString('en-US')} d`;
};
export const km = (m: number): string => `${sigfig(m / 1000)} km`;
export const ha = (v: number): string => `${sigfig(v)} ha`;
