import { CircleMarker, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import { useDestinationsStore } from '@/state/destinationsStore';
import { useUiStore } from '@/state/uiStore';

export function DestinationLayer() {
  const destinations = useDestinationsStore((s) => s.destinations);
  const removeDestination = useDestinationsStore((s) => s.removeDestination);
  const show = useUiStore((s) => s.showDestinations);
  const drawing = useUiStore((s) => s.drawingDestinations);
  if (!show) return null;

  return (
    <>
      {destinations.map((d) => {
        const [lng, lat] = d.geometry.coordinates;
        const isStart = d.properties.order === 0;
        const isEnd = d.properties.order === destinations.length - 1;
        const color = isStart ? '#1f77b4' : isEnd ? '#d62728' : '#000';
        return (
          <CircleMarker
            key={d.properties.id}
            center={[lat, lng]}
            radius={7}
            pane="destinationsPane"
            // bubblingMouseEvents=false stops Leaflet from also firing the
            // map's click/dblclick events; L.DomEvent.stop inside the handler
            // additionally cancels the DOM event, which is what the map's
            // doubleClickZoom binds to.
            pathOptions={{
              color: '#fff',
              weight: 2,
              fillColor: color,
              fillOpacity: 1,
              bubblingMouseEvents: false,
            }}
            eventHandlers={{
              dblclick: (e) => {
                if (!drawing) return;
                if (e.originalEvent) L.DomEvent.stop(e.originalEvent);
                removeDestination(d.properties.id);
              },
              click: (e) => {
                // Eat the click so MapClickHandler doesn't drop a new
                // destination on top of this marker while drawing.
                if (drawing && e.originalEvent) L.DomEvent.stop(e.originalEvent);
              },
            }}
          >
            <Tooltip direction="top">
              {d.properties.label ??
                (isStart ? 'Start' : isEnd ? 'End' : `Stop ${d.properties.order}`)}
              {drawing && ' — dbl-click to delete'}
            </Tooltip>
          </CircleMarker>
        );
      })}
    </>
  );
}
