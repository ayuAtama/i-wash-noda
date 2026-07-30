"use client";

import { GoogleMap, LoadScript, Marker } from "@react-google-maps/api";
import { useState } from "react";

const containerStyle = {
  width: "100%",
  height: "400px",
};

const center = {
  lat: -6.2, // Jakarta
  lng: 106.816666,
};

export default function MapPinpoint() {
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(
    null,
  );

  const handleMapClick = (event: google.maps.MapMouseEvent) => {
    if (!event.latLng) return;

    const lat = event.latLng.lat();
    const lng = event.latLng.lng();

    setPosition({ lat, lng });
    console.log("Koordinat:", lat, lng);
  };

  return (
    <LoadScript googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}>
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center}
        zoom={12}
        onClick={handleMapClick}
      >
        {position && <Marker position={position} />}
      </GoogleMap>

      {position && (
        <div>
          <p>Latitude: {position.lat}</p>
          <p>Longitude: {position.lng}</p>
        </div>
      )}
    </LoadScript>
  );
}
