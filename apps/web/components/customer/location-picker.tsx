"use client";

import { useCallback, useRef } from "react";
import { GoogleMap, LoadScript } from "@react-google-maps/api";
import { MapPin } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export interface LatLng {
  lat: number;
  lng: number;
}

export const DEFAULT_CENTER = { lat: -6.2008568, lng: 106.8444966 };

const JAKARTA_CENTER = { lat: -6.2, lng: 106.816666 };

const MAP_OPTIONS: google.maps.MapOptions = {
  disableDefaultUI: true,
  zoomControl: true,
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: false,
};

const DEFAULT_ZOOM = 15;

export function LocationPicker({
  value,
  onChange,
  height = 320,
}: {
  value: LatLng | null;
  onChange: (position: LatLng) => void;
  height?: number;
}) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const mapRef = useRef<google.maps.Map | null>(null);

  const handleLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  const handleIdle = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    const center = map.getCenter();
    if (center) {
      onChange({ lat: center.lat(), lng: center.lng() });
    }
  }, [onChange]);

  if (!apiKey) {
    return (
      <div
        className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed bg-muted/40 text-center text-sm text-muted-foreground"
        style={{ height }}
      >
        <MapPin className="h-6 w-6" />
        <p>
          Peta tidak tersedia. Gunakan tombol &quot;Gunakan lokasi saat ini&quot;
          atau masukkan koordinat secara manual.
        </p>
      </div>
    );
  }

  return (
    <LoadScript
      googleMapsApiKey={apiKey}
      loadingElement={
        <Skeleton className="w-full rounded-lg" style={{ height }} />
      }
    >
      <div className="relative" style={{ width: "100%", height }}>
        <GoogleMap
          mapContainerStyle={{ width: "100%", height: "100%" }}
          center={value ?? JAKARTA_CENTER}
          zoom={value ? DEFAULT_ZOOM : 11}
          options={MAP_OPTIONS}
          onLoad={handleLoad}
          onIdle={handleIdle}
        />

        <div className="pointer-events-none absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-full">
          <div className="relative">
            <div className="flex h-10 w-10 items-center justify-center text-red-800">
              <MapPin className="h-15 w-15" />
            </div>
          </div>
        </div>
      </div>
    </LoadScript>
  );
}
