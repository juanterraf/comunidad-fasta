"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix de íconos por bundler — los assets default no resuelven con webpack.
// Usamos un divIcon propio, más predecible y consistente con el estilo del sitio.
const pinIcon = L.divIcon({
  className: "cf-pin",
  html: `<div style="
    width:22px;height:22px;border-radius:999px;
    background:#c4502c;border:3px solid #fff;
    box-shadow:0 2px 8px rgba(0,0,0,0.25);
  "></div>`,
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

type LatLng = { lat: number; lng: number };

type Props = {
  value: LatLng | null;
  onChange: (v: LatLng) => void;
  /** Centro inicial si no hay valor todavía. Default: San Miguel de Tucumán */
  defaultCenter?: LatLng;
};

function ClickHandler({ onChange }: { onChange: (v: LatLng) => void }) {
  useMapEvents({
    click(e) {
      onChange({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

export default function MapPicker({
  value,
  onChange,
  defaultCenter = { lat: -26.8241, lng: -65.2226 },
}: Props) {
  const [center, setCenter] = useState<LatLng>(value ?? defaultCenter);

  useEffect(() => {
    if (value) setCenter(value);
  }, [value]);

  return (
    <div className="rounded-[var(--radius-lg)] overflow-hidden border border-[var(--color-border-strong)] h-[300px] relative">
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={value ? 15 : 12}
        scrollWheelZoom={false}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ClickHandler onChange={onChange} />
        {value ? <Marker position={[value.lat, value.lng]} icon={pinIcon} /> : null}
      </MapContainer>
      <p className="absolute top-2 left-2 bg-[var(--color-bg)]/95 text-xs px-2.5 py-1.5 rounded-full border border-[var(--color-border)] pointer-events-none">
        {value ? "Clickeá de nuevo para corregir" : "Hacé click para fijar la ubicación"}
      </p>
    </div>
  );
}
