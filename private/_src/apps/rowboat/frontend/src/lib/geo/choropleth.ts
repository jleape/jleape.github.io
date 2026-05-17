import type { ParcelFeature, ChoroplethMode } from '@/types';

/**
 * 7-stop cyan→lime→yellow ramp, low→high. Picked to read well against the
 * dark Bold basemap and to share its primary cyan with the histogram bars.
 */
const PALETTE = [
  '#155e75', // dark cyan
  '#0891b2', // cyan-600
  '#06b6d4', // cyan-500
  '#22d3ee', // cyan-400 (matches --primary in Bold)
  '#67e8f9', // light cyan
  '#a3e635', // lime
  '#fde047', // yellow
];

function getMetric(f: ParcelFeature, mode: ChoroplethMode): number | null {
  const p = f.properties;
  switch (mode) {
    case 'constructionCost':
      return p.unitConstructionCost;
    case 'landUnitPrice':
      return p.areaHectares > 0 ? p.landCost / p.areaHectares : null;
    case 'acquisitionProbability':
      return p.acquisitionProbability;
    default:
      return null;
  }
}

const STATUS_COLOURS: Record<ParcelFeature['properties']['status'], string> = {
  planned: '#475569',     // slate — neutral default
  negotiating: '#fbbf24', // amber
  acquired: '#16a34a',    // green — full ownership
  easement: '#16a34a',    // green — strip-of-use; border distinguishes (see ParcelLayer)
  abandoned: '#dc2626',   // red — Blocked
};

export function computeColorScale(features: ParcelFeature[], mode: ChoroplethMode) {
  if (mode === 'none' || features.length === 0) {
    return { color: (_f: ParcelFeature) => '#7f7f7f', min: 0, max: 0 };
  }
  if (mode === 'status') {
    return {
      color: (f: ParcelFeature) => STATUS_COLOURS[f.properties.status],
      min: 0,
      max: 0,
    };
  }
  let min = Infinity;
  let max = -Infinity;
  for (const f of features) {
    const v = getMetric(f, mode);
    if (v == null) continue;
    if (v < min) min = v;
    if (v > max) max = v;
  }
  if (!isFinite(min) || !isFinite(max) || max === min) {
    return { color: (_f: ParcelFeature) => PALETTE[3], min, max };
  }
  const color = (f: ParcelFeature) => {
    const v = getMetric(f, mode);
    if (v == null) return '#7f7f7f';
    const t = (v - min) / (max - min);
    const idx = Math.min(PALETTE.length - 1, Math.max(0, Math.floor(t * (PALETTE.length - 1))));
    return PALETTE[idx];
  };
  return { color, min, max };
}

export function statusStyle(status: ParcelFeature['properties']['status']) {
  switch (status) {
    case 'acquired':
      return { weight: 2, color: '#1e7a3a', dashArray: undefined };
    case 'negotiating':
      return { weight: 2, color: '#c47c00', dashArray: '6 4' };
    case 'abandoned':
      return { weight: 1, color: '#aa2222', dashArray: '2 4' };
    default:
      return { weight: 0.6, color: '#444', dashArray: undefined };
  }
}
