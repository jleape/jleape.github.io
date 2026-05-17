import { useEffect } from 'react';
import { useParcelsStore } from './parcelsStore';
import { useDestinationsStore } from './destinationsStore';
import { useAlignmentStore } from './alignmentStore';
import { useProjectStore } from './projectStore';
import { computeAutoAlignment } from '@/lib/routing/autoAlignment';

/**
 * Recompute the planned alignment whenever parcels, destinations, or the
 * curvature constraint changes. Cheap enough at ~600 parcels to run
 * synchronously inside an effect.
 */
export function useAutoAlignment(): void {
  const parcels = useParcelsStore((s) => s.parcels);
  const destinations = useDestinationsStore((s) => s.destinations);
  const setAlignment = useAlignmentStore((s) => s.setAlignment);
  const minRadius = useProjectStore((s) => s.settings.minRadiusOfCurvatureM);

  useEffect(() => {
    const {
      alignment,
      parcelPath,
      expectedCost,
      breakdown,
      exitPoints,
      exitControlIndices,
      samplesPerSegment,
    } = computeAutoAlignment(parcels, destinations, minRadius);
    setAlignment({
      alignment,
      parcelPath,
      expectedCost,
      breakdown,
      exitPoints,
      exitControlIndices,
      samplesPerSegment,
    });
  }, [parcels, destinations, minRadius, setAlignment]);
}
