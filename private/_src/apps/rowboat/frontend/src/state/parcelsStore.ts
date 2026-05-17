import { create } from 'zustand';
import type { ParcelCollection, ParcelFeature, ParcelProperties, ParcelStatus } from '@/types';

interface ParcelsState {
  parcels: ParcelCollection;
  selectedParcelId: string | null;
  setParcels: (fc: ParcelCollection) => void;
  selectParcel: (id: string | null) => void;
  updateParcel: (id: string, patch: Partial<ParcelProperties>) => void;
  setStatus: (id: string, status: ParcelStatus) => void;
  getParcel: (id: string) => ParcelFeature | undefined;
}

const emptyCollection: ParcelCollection = { type: 'FeatureCollection', features: [] };

export const useParcelsStore = create<ParcelsState>((set, get) => ({
  parcels: emptyCollection,
  selectedParcelId: null,
  setParcels: (fc) => set({ parcels: fc }),
  selectParcel: (id) => set({ selectedParcelId: id }),
  updateParcel: (id, patch) =>
    set((s) => ({
      parcels: {
        ...s.parcels,
        features: s.parcels.features.map((f) =>
          f.properties.id === id ? { ...f, properties: { ...f.properties, ...patch } } : f
        ),
      },
    })),
  setStatus: (id, status) =>
    set((s) => ({
      parcels: {
        ...s.parcels,
        features: s.parcels.features.map((f) =>
          f.properties.id === id ? { ...f, properties: { ...f.properties, status } } : f
        ),
      },
    })),
  getParcel: (id) => get().parcels.features.find((f) => f.properties.id === id),
}));
