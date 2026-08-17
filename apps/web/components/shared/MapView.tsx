"use client";

import { GoogleMap, LoadScript, Marker } from "@react-google-maps/api";
import { MapPin } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export function MapView({
  lat,
  lng,
  height = 220,
}: {
  lat: number;
  lng: number;
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
        <p>Peta tidak tersedia.</p>
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
        center={{ lat, lng }}
        zoom={15}
        options={{
          disableDefaultUI: false,
          zoomControl: true,
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
          draggable: false,
        }}
      >
        <Marker position={{ lat, lng }} />
      </GoogleMap>
    </LoadScript>
  );
}
