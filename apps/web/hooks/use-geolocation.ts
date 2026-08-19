"use client";

import { useCallback, useState } from "react";

export interface GeoPosition {
  lat: number;
  lng: number;
}

async function ipGeolocateClient(): Promise<GeoPosition | null> {
  try {
    const res = await fetch("https://ipwho.is/");
    const data = await res.json();
    if (!data?.success || typeof data.latitude !== "number") return null;
    return { lat: data.latitude, lng: data.longitude };
  } catch {
    return null;
  }
}

export function useGeolocation() {
  const [position, setPosition] = useState<GeoPosition | null>(null);
  const [approximate, setApproximate] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const locate = useCallback(async () => {
    if (typeof window === "undefined") return;

    const runIpFallback = async () => {
      const result = await ipGeolocateClient();
      if (result) {
        setPosition(result);
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

  const locateByIp = useCallback(async () => {
    if (typeof window === "undefined") return;
    setLoading(true);
    setError(null);
    try {
      const result = await ipGeolocateClient();
      if (result) {
        setPosition(result);
        setApproximate(true);
      } else {
        setError("Gagal mengambil lokasi dari IP.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  return { position, approximate, error, loading, locate, locateByIp };
}
