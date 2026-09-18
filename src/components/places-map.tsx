"use client";

import { useEffect, useRef } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { cssVar } from "@/lib/theme";
import type { Place } from "@/lib/types";

function pinIcon(fill: string, border: string) {
  const ink = cssVar("--ink") || "#2b1a14";
  return L.divIcon({
    className: "place-pin",
    html: `<span style="display:block;width:22px;height:22px;border-radius:999px;background:${fill};border:3px solid ${border};box-shadow:0 8px 18px ${ink}40"></span>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });
}

function ClickCapture({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(event) {
      onPick(event.latlng.lat, event.latlng.lng);
    },
  });
  return null;
}

function MapController({
  places,
  focus,
  draft,
}: {
  places: Place[];
  focus: Place | null;
  draft: { lat: number; lng: number } | null;
}) {
  const map = useMap();
  const fitted = useRef(false);

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition((pos) => {
      if (fitted.current || focus) return;
      map.setView([pos.coords.latitude, pos.coords.longitude], 13);
    });
  }, [map, focus]);

  useEffect(() => {
    if (focus) {
      map.flyTo([focus.lat, focus.lng], 16, { duration: 0.7 });
      return;
    }
    if (draft) {
      map.flyTo([draft.lat, draft.lng], 16, { duration: 0.45 });
      return;
    }
    if (!fitted.current && places.length > 0) {
      const bounds = L.latLngBounds(places.map((place) => [place.lat, place.lng]));
      map.fitBounds(bounds.pad(0.35));
      fitted.current = true;
    }
  }, [draft, focus, map, places]);

  return null;
}

export function mapsDirectionsUrl(lat: number, lng: number) {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}

export function PlacesMap({
  places,
  focus,
  draft,
  onPick,
  onSelect,
}: {
  places: Place[];
  focus: Place | null;
  draft: { lat: number; lng: number } | null;
  onPick: (lat: number, lng: number) => void;
  onSelect: (place: Place) => void;
}) {
  return (
    <MapContainer
      center={[40.4168, -3.7038]}
      zoom={12}
      className="w-full"
      scrollWheelZoom={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapController places={places} focus={focus} draft={draft} />
      <ClickCapture onPick={onPick} />
      {draft ? (
        <Marker
          position={[draft.lat, draft.lng]}
          icon={pinIcon(cssVar("--gold") || "#c4a574", cssVar("--paper") || "#f3ebe1")}
        />
      ) : null}
      {places.map((place) => (
        <Marker
          key={place.id}
          position={[place.lat, place.lng]}
          icon={pinIcon(cssVar("--rose") || "#b44a4a", cssVar("--paper") || "#f3ebe1")}
          eventHandlers={{ click: () => onSelect(place) }}
        >
          <Popup>
            <strong>{place.name}</strong>
            {place.note ? <div>{place.note}</div> : null}
            <div style={{ marginTop: 8 }}>
              <a href={mapsDirectionsUrl(place.lat, place.lng)} target="_blank" rel="noreferrer">
                Llévame allí
              </a>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
