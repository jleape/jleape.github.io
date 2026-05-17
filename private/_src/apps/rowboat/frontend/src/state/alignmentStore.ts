import { create } from 'zustand';
import type { AlignmentFeature } from '@/types';
import type { CostBreakdown } from '@/lib/routing/autoAlignment';

const EMPTY_BREAKDOWN: CostBreakdown = {
  construction: 0,
  landOnPath: 0,
  landClipped: 0,
  pathLengthMeters: 0,
  pathParcelCount: 0,
  clippedParcelCount: 0,
};

interface AlignmentState {
  alignment: AlignmentFeature | null;
  parcelPath: string[];
  expectedCost: number;
  breakdown: CostBreakdown;
  /** Per-parcel exit points on the smoothed polyline; see AutoAlignmentResult.exitPoints. */
  exitPoints: number[][];
  /** Smoothed-control-point index for each exit; lets layers map a parcel
   *  index to its position on the smoothed line even when intermediate
   *  destinations have been spliced in between boundary midpoints. */
  exitControlIndices: number[];
  samplesPerSegment: number;
  setAlignment: (data: {
    alignment: AlignmentFeature | null;
    parcelPath: string[];
    expectedCost: number;
    breakdown: CostBreakdown;
    exitPoints: number[][];
    exitControlIndices: number[];
    samplesPerSegment: number;
  }) => void;
}

export const useAlignmentStore = create<AlignmentState>((set) => ({
  alignment: null,
  parcelPath: [],
  expectedCost: 0,
  breakdown: EMPTY_BREAKDOWN,
  exitPoints: [],
  exitControlIndices: [],
  samplesPerSegment: 8,
  setAlignment: ({
    alignment,
    parcelPath,
    expectedCost,
    breakdown,
    exitPoints,
    exitControlIndices,
    samplesPerSegment,
  }) =>
    set({
      alignment,
      parcelPath,
      expectedCost,
      breakdown,
      exitPoints,
      exitControlIndices,
      samplesPerSegment,
    }),
}));
