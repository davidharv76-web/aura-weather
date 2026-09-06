import { useEffect } from "react";
import { CircleMarker, MapContainer, TileLayer, Tooltip, useMap } from "react-leaflet";

import type { SurfSpot } from "@/lib/marine";

export function SurfSpotMap({
  spots,
  selected,
  onSelect,
}: {
  spots: SurfSpot[];
  selected: SurfSpot;
  onSelect: (spot: SurfSpot) => void;
}) {
  return (
    <MapContainer
      center={[15, 5]}
      zoom={2}
      minZoom={2}
      maxZoom={10}
      scrollWheelZoom
      className="h-full w-full"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FocusSpot spot={selected} />
      {spots.map((spot) => {
        const active = spot.id === selected.id;
        return (
          <CircleMarker
            key={spot.id}
            center={[spot.latitude, spot.longitude]}
            radius={active ? 11 : 7}
            pathOptions={{
              color: active ? "#ffd36b" : "#ff8c78",
              fillColor: active ? "#ffd36b" : "#ff8c78",
              fillOpacity: active ? 0.9 : 0.62,
              weight: 2,
            }}
            eventHandlers={{ click: () => onSelect(spot) }}
          >
            <Tooltip className="dawncast-map-tooltip" direction="top">
              <strong>{spot.name}</strong>
              <br />
              {spot.region}
            </Tooltip>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}

function FocusSpot({ spot }: { spot: SurfSpot }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([spot.latitude, spot.longitude], Math.max(5, map.getZoom()), { duration: 1.2 });
  }, [map, spot]);
  return null;
}
