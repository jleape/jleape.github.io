import { create } from 'zustand';
import type { DestinationFeature } from '@/types';

interface DestinationsState {
  destinations: DestinationFeature[];
  addDestination: (lngLat: [number, number], label?: string) => void;
  removeDestination: (id: string) => void;
  clear: () => void;
  setDestinations: (d: DestinationFeature[]) => void;
}

let counter = 0;
const nextId = () => `dest-${++counter}`;

export const useDestinationsStore = create<DestinationsState>((set, get) => ({
  destinations: [],
  addDestination: (lngLat, label) => {
    const existing = get().destinations;
    const newPoint: DestinationFeature = {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: lngLat },
      properties: { id: nextId(), order: 0, label },
    };
    // 1st & 2nd clicks set start and end. From the 3rd click onward, insert as an
    // intermediate stop just before the current end — otherwise the new click would
    // silently become the new end and the previous end would shift to a mid-path stop.
    let list: DestinationFeature[];
    if (existing.length < 2) {
      list = [...existing, newPoint];
    } else {
      const sorted = [...existing].sort((a, b) => a.properties.order - b.properties.order);
      list = [...sorted.slice(0, -1), newPoint, sorted[sorted.length - 1]];
    }
    set({
      destinations: list.map((d, i) => ({
        ...d,
        properties: { ...d.properties, order: i },
      })),
    });
  },
  removeDestination: (id) =>
    set((s) => ({
      destinations: s.destinations
        .filter((d) => d.properties.id !== id)
        .map((d, i) => ({ ...d, properties: { ...d.properties, order: i } })),
    })),
  clear: () => set({ destinations: [] }),
  setDestinations: (d) => set({ destinations: d }),
}));
