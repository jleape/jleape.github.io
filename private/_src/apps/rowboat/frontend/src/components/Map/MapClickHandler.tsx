import { useMapEvents } from 'react-leaflet';
import { useUiStore } from '@/state/uiStore';
import { useDestinationsStore } from '@/state/destinationsStore';

export function MapClickHandler() {
  const drawing = useUiStore((s) => s.drawingDestinations);
  const addDestination = useDestinationsStore((s) => s.addDestination);

  useMapEvents({
    click: (e) => {
      if (!drawing) return;
      addDestination([e.latlng.lng, e.latlng.lat]);
    },
  });
  return null;
}
