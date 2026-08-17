"use client";

import { GoogleMap, LoadScript, Marker } from "@react-google-maps/api";
import { MapPin } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export interface LatLng {
  lat: number;
  lng: number;
}

export const DEFAULT_CENTER = { lat: -6.2008568, lng: 106.8444966 };

const JAKARTA_CENTER = { lat: -6.2, lng: 106.816666 };

const MAP_OPTIONS: google.maps.MapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: false,
};

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
      <GoogleMap
        mapContainerStyle={{ width: "100%", height }}
        center={value ?? JAKARTA_CENTER}
        zoom={value ? 15 : 11}
        options={MAP_OPTIONS}
        onClick={(event) => {
          const latLng = event.latLng;
          if (latLng) onChange({ lat: latLng.lat(), lng: latLng.lng() });
        }}
      >
        {value ? (
          <Marker
            position={value}
            draggable
            onDragEnd={(event) => {
              const latLng = event.latLng;
              if (latLng) onChange({ lat: latLng.lat(), lng: latLng.lng() });
            }}
          />
        ) : null}
      </GoogleMap>
    </LoadScript>
  );
}
