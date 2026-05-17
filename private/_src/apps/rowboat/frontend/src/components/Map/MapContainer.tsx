import { useEffect, useRef } from 'react';
import L from 'leaflet';
import * as turf from '@turf/turf';
import {
  MapContainer as LeafletMap,
  TileLayer,
  ZoomControl,
  useMap,
} from 'react-leaflet';
import { ParcelLayer } from './ParcelLayer';
import { AlignmentLayer } from './AlignmentLayer';
import { AlignmentStripLayer } from './AlignmentStripLayer';
import { BoatLayer } from './BoatLayer';
import { FishingLayer } from './FishingLayer';
import { DestinationLayer } from './DestinationLayer';
import { MapClickHandler } from './MapClickHandler';
import { corridorCenter } from '@/data/sampleCorridor';
import { useParcelsStore } from '@/state/parcelsStore';

const CARTO_URL = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
const CARTO_ATTR =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>';

function CustomPanes() {
  const map = useMap();
  useEffect(() => {
    if (!map.getPane('parcelsPane')) {
      map.createPane('parcelsPane').style.zIndex = '400';
    }
    // Easement / expropriation strips sit between parcels and the alignment
    // line so the magenta polyline is always legible on top of the chunkier
    // strip overlays.
    if (!map.getPane('stripsPane')) {
      map.createPane('stripsPane').style.zIndex = '425';
    }
    if (!map.getPane('alignmentPane')) {
      map.createPane('alignmentPane').style.zIndex = '450';
    }
    if (!map.getPane('destinationsPane')) {
      map.createPane('destinationsPane').style.zIndex = '500';
    }
  }, [map]);
  return null;
}

/**
 * When the parcels collection changes — initial load OR opening a project —
 * pan / zoom the map to fit them with a small padding. Skips the initial
 * "before parcels are loaded" render, and avoids re-fitting on every minor
 * status update by keying on a parcel-count + first-id signature.
 */
function FitMapToParcels() {
  const map = useMap();
  const parcels = useParcelsStore((s) => s.parcels);
  const lastSigRef = useRef<string>('');
  useEffect(() => {
    if (!parcels.features.length) return;
    const sig =
      `${parcels.features.length}|${parcels.features[0]?.properties.id ?? ''}` +
      `|${parcels.features[parcels.features.length - 1]?.properties.id ?? ''}`;
    if (sig === lastSigRef.current) return;
    lastSigRef.current = sig;
    const [w, s, e, n] = turf.bbox(parcels);
    if (!isFinite(w) || !isFinite(s) || !isFinite(e) || !isFinite(n)) return;
    map.fitBounds([
      [s, w],
      [n, e],
    ], { padding: [40, 40], animate: false });
  }, [parcels, map]);
  return null;
}

function ScaleBar() {
  const map = useMap();
  useEffect(() => {
    const ctrl = L.control.scale({
      imperial: false,
      metric: true,
      position: 'bottomright',
      maxWidth: 140,
    });
    ctrl.addTo(map);
    return () => {
      ctrl.remove();
    };
  }, [map]);
  return null;
}

export function MapView() {
  const [lng, lat] = corridorCenter();
  return (
    <LeafletMap
      center={[lat, lng]}
      zoom={11}
      className="h-full w-full"
      zoomControl={false}
    >
      <CustomPanes />
      <FitMapToParcels />
      <TileLayer url={CARTO_URL} attribution={CARTO_ATTR} subdomains="abcd" maxZoom={20} />
      <ParcelLayer />
      <AlignmentStripLayer />
      <AlignmentLayer />
      <FishingLayer />
      <BoatLayer />
      <DestinationLayer />
      <MapClickHandler />
      <ZoomControl position="topright" />
      <ScaleBar />
    </LeafletMap>
  );
}
