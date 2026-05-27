"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import Link from "next/link";
import "leaflet/dist/leaflet.css";

type MapBusiness = {
  id: string;
  slug: string;
  name: string;
  lat: number;
  lng: number;
  neighborhood: string | null;
  categoryName: string | null;
};

const pinIcon = L.divIcon({
  className: "cf-pin",
  html: `<div style="
    width:18px;height:18px;border-radius:999px;
    background:#c4502c;border:3px solid #fff;
    box-shadow:0 2px 6px rgba(0,0,0,0.3);
  "></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

export default function MapBrowser({ items }: { items: MapBusiness[] }) {
  // Calcular centro: el promedio de los puntos, o fallback Tucumán capital
  const defaultCenter: [number, number] = [-26.8241, -65.2226];
  const center: [number, number] = items.length
    ? [
        items.reduce((s, b) => s + b.lat, 0) / items.length,
        items.reduce((s, b) => s + b.lng, 0) / items.length,
      ]
    : defaultCenter;

  return (
    <div className="rounded-[var(--radius-lg)] overflow-hidden border border-[var(--color-border-strong)] h-[70vh] min-h-[420px]">
      <MapContainer
        center={center}
        zoom={items.length > 1 ? 11 : 13}
        scrollWheelZoom
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {items.map((b) => (
          <Marker key={b.id} position={[b.lat, b.lng]} icon={pinIcon}>
            <Popup>
              <div className="font-sans">
                <Link
                  href={`/e/${b.slug}`}
                  className="font-medium text-[var(--color-ink)] hover:underline"
                  style={{ textDecoration: "none" }}
                >
                  {b.name}
                </Link>
                <p className="text-xs text-[var(--color-muted)] mt-1">
                  {b.categoryName ?? ""}
                  {b.categoryName && b.neighborhood ? " · " : ""}
                  {b.neighborhood ?? ""}
                </p>
                <Link
                  href={`/e/${b.slug}`}
                  className="text-xs text-[var(--color-accent)] inline-block mt-2 font-medium"
                >
                  Ver ficha →
                </Link>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
