"use client";

import { useCallback, useState } from "react";
import { ipGeolocate } from "@/lib/location/actions";

export interface GeoPosition {
  lat: number;
  lng: number;
}

export function useGeolocation() {
  const [position, setPosition] = useState<GeoPosition | null>(null);
  const [approximate, setApproximate] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const locate = useCallback(async () => {
    if (typeof window === "undefined") return;

    const runIpFallback = async () => {
      const result = await ipGeolocate();
      if (result) {
        setPosition({ lat: result.lat, lng: result.lng });
        setApproximate(true);
        setError(null);
      } else {
        setError("Gagal mengambil lokasi. Coba geser pin di peta.");
      }
    };

    if (!("geolocation" in navigator)) {
      setLoading(true);
      await runIpFallback();
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setApproximate(false);
        setLoading(false);
      },
      () => {
        void runIpFallback().finally(() => setLoading(false));
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 },
    );
  }, []);

  return { position, approximate, error, loading, locate };
}
