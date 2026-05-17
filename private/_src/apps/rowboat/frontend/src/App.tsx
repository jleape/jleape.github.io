import { useEffect } from 'react';
import { BoldLayout } from '@/components/Layouts/BoldLayout';
import { useParcelsStore } from '@/state/parcelsStore';
import { useDestinationsStore } from '@/state/destinationsStore';
import { useAutoAlignment } from '@/state/useAutoAlignment';
import { generateCorridorParcels, defaultDestinations } from '@/data/sampleCorridor';

export default function App() {
  const setParcels = useParcelsStore((s) => s.setParcels);
  const setDestinations = useDestinationsStore((s) => s.setDestinations);

  useEffect(() => {
    setParcels(generateCorridorParcels());
    const pts = defaultDestinations();
    setDestinations(
      pts.map((coord, i) => ({
        type: 'Feature' as const,
        geometry: { type: 'Point' as const, coordinates: coord },
        properties: { id: `seed-${i}`, order: i, label: i === 0 ? 'Start' : 'End' },
      }))
    );
  }, [setParcels, setDestinations]);

  useAutoAlignment();

  return <BoldLayout />;
}
