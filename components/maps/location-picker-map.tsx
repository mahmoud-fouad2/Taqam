"use client";

import * as React from "react";
import "leaflet";
import L from "leaflet";
import { Circle, MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";

type Locale = "ar" | "en";

export type LocationPickerMapProps = {
  locale: Locale;
  lat: number | null;
  lng: number | null;
  radiusMeters: number;
  onChange: (lat: number, lng: number) => void;
};

const DEFAULT_CENTER: [number, number] = [24.7136, 46.6753]; // Riyadh

const markerIcon = L.divIcon({
  className: "taqam-leaflet-marker",
  html: '<div style="width:18px;height:18px;border-radius:9999px;background:#0ea5e9;border:3px solid white;box-shadow:0 6px 16px rgba(0,0,0,.25);"></div>',
  iconSize: [18, 18],
  iconAnchor: [9, 9]
});

function t(locale: Locale, ar: string, en: string) {
  return locale === "ar" ? ar : en;
}

function Recenter({ lat, lng, zoom }: { lat: number; lng: number; zoom: number }) {
  const map = useMap();

  React.useEffect(() => {
    map.setView([lat, lng], zoom, { animate: false });
  }, [map, lat, lng, zoom]);

  return null;
}

function PickerEvents({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    }
  });

  return null;
}

export default function LocationPickerMap({
  locale,
  lat,
  lng,
  radiusMeters,
  onChange
}: LocationPickerMapProps) {
  const hasPos = typeof lat === "number" && typeof lng === "number";

  const center: [number, number] = hasPos ? [lat!, lng!] : DEFAULT_CENTER;
  const zoom = hasPos ? 16 : 6;

  const safeRadius = Number.isFinite(radiusMeters) ? Math.max(0, radiusMeters) : 0;

  return (
    <div className="space-y-2">
      <div className="text-muted-foreground text-start text-xs">
        {t(
          locale,
          "اضغط على الخريطة لتحديد الموقع (أو اسحب النقطة).",
          "Click the map to pick a location (or drag the marker)."
        )}
      </div>

      <div className="h-[280px] w-full overflow-hidden rounded-md border">
        <MapContainer center={center} zoom={zoom} scrollWheelZoom className="h-full w-full">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <PickerEvents onPick={onChange} />
          <Recenter lat={center[0]} lng={center[1]} zoom={zoom} />

          {hasPos ? (
            <>
              <Marker
                position={[lat!, lng!]}
                draggable
                icon={markerIcon}
                eventHandlers={{
                  dragend: (e) => {
                    const target = e.target as L.Marker;
                    const pos = target.getLatLng();
                    onChange(pos.lat, pos.lng);
                  }
                }}
              />
              {safeRadius > 0 ? (
                <Circle
                  center={[lat!, lng!]}
                  radius={safeRadius}
                  pathOptions={{ color: "#0ea5e9", fillColor: "#0ea5e9", fillOpacity: 0.12 }}
                />
              ) : null}
            </>
          ) : null}
        </MapContainer>
      </div>
    </div>
  );
}
