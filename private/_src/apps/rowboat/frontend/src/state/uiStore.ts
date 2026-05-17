import { create } from 'zustand';
import type { ChoroplethMode } from '@/types';

type Toggleable =
  | 'showParcels'
  | 'showAlignment'
  | 'showDestinations'
  | 'drawingDestinations'
  | 'highlightFirstActions';

interface UiState {
  choropleth: ChoroplethMode;
  showParcels: boolean;
  showAlignment: boolean;
  showDestinations: boolean;
  drawingDestinations: boolean;
  /** Outline the parcels in result.firstActions on the map. */
  highlightFirstActions: boolean;
  setChoropleth: (m: ChoroplethMode) => void;
  toggle: (k: Toggleable) => void;
}

export const useUiStore = create<UiState>((set) => ({
  choropleth: 'none',
  showParcels: true,
  showAlignment: true,
  showDestinations: true,
  drawingDestinations: false,
  highlightFirstActions: false,
  setChoropleth: (choropleth) => set({ choropleth }),
  toggle: (k) => set((s) => ({ [k]: !s[k] } as Partial<UiState>)),
}));
