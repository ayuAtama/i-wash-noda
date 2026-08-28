"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Circle,
  GoogleMap,
  InfoWindow,
  LoadScript,
  Marker,
} from "@react-google-maps/api";
import { MapPin } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { Outlet } from "@/lib/api/types";
import { formatIDR } from "@/lib/utils";

const PIN_COLORS = [
  "#00796B",
  "#0288D1",
  "#0097A7",
  "#26A69A",
  "#5C6BC0",
];

const DEFAULT_CENTER = { lat: -6.2008568, lng: 106.8444966 };
const INITIAL_ZOOM = 12;

const MAP_OPTIONS: google.maps.MapOptions = {
  disableDefaultUI: true,
  zoomControl: true,
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: false,
  gestureHandling: "greedy",
  scrollwheel: false,
};

function createPinSvg(color: string): google.maps.Icon {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="42" viewBox="0 0 32 42">
    <path d="M16 0C7.16 0 0 7.16 0 16c0 12 16 26 16 26s16-14 16-26C32 7.16 24.84 0 16 0z" fill="${color}"/>
    <circle cx="16" cy="16" r="6" fill="white"/>
  </svg>`;
  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize: { width: 32, height: 42 } as google.maps.Size,
    anchor: { x: 16, y: 42 } as google.maps.Point,
  };
}

export function OutletMap({
  outlets,
  initialCenter,
  userPosition,
}: {
  outlets: Outlet[];
  initialCenter?: { lat: number; lng: number } | null;
  userPosition?: { lat: number; lng: number } | null;
}) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const mapRef = useRef<google.maps.Map | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [pinnedId, setPinnedId] = useState<string | null>(null);

  const circlesRef = useRef<Map<string, google.maps.Circle>>(new Map());
  const animFrameRef = useRef<number>(0);

  const pinIcons = useMemo(
    () => outlets.map((_, i) => createPinSvg(PIN_COLORS[i % PIN_COLORS.length]!)),
    [outlets],
  );

  const outletColorMap = useMemo(
    () => new Map(outlets.map((o, i) => [o.id, PIN_COLORS[i % PIN_COLORS.length]!])),
    [outlets],
  );

  useEffect(() => {
    cancelAnimationFrame(animFrameRef.current);

    if (!hoveredId) {
      circlesRef.current.forEach((circle, id) => {
        const color = outletColorMap.get(id) ?? "#00796B";
        circle.setOptions({
          fillColor: color,
          strokeColor: color,
          fillOpacity: 0.06,
          strokeOpacity: 0.18,
        });
      });
      return;
    }

    const circle = circlesRef.current.get(hoveredId);
    if (!circle) return;

    const color = outletColorMap.get(hoveredId) ?? "#00796B";
    circle.setOptions({ fillColor: color, strokeColor: color });

    const start = performance.now();
    const animate = (now: number) => {
      const elapsed = (now - start) / 1000;
      const opacity = 0.16 + 0.1 * Math.sin(elapsed * Math.PI * 1.5);
      circle.setOptions({ fillOpacity: opacity, strokeOpacity: opacity * 2 });
      animFrameRef.current = requestAnimationFrame(animate);
    };
    animFrameRef.current = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animFrameRef.current);
  }, [hoveredId, outletColorMap]);

  const handleMapLoad = useCallback(
    (map: google.maps.Map) => {
      mapRef.current = map;
      const center = initialCenter ?? userPosition ?? DEFAULT_CENTER;
      map.setCenter(center);
      map.setZoom(INITIAL_ZOOM);
    },
    [initialCenter, userPosition],
  );

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !userPosition) return;
    map.panTo(userPosition);
    map.setZoom(INITIAL_ZOOM);
  }, [userPosition]);

  const handleMarkerClick = useCallback(
    (id: string) => {
      setPinnedId((prev) => (prev === id ? null : id));
      setHoveredId(null);
    },
    [],
  );

  const handleInfoWindowClose = useCallback(() => {
    setPinnedId(null);
    setHoveredId(null);
  }, []);

  const activeId = pinnedId ?? hoveredId;

  if (!apiKey) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed bg-muted/40 p-6 text-center text-sm text-muted-foreground">
        <MapPin className="h-6 w-6" />
        <p>Peta tidak tersedia. Pastikan API key Google Maps sudah dikonfigurasi.</p>
      </div>
    );
  }

  if (outlets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed bg-muted/40 p-8 text-center text-sm text-muted-foreground">
        <MapPin className="h-8 w-8" />
        <p className="font-medium text-foreground">Belum ada outlet</p>
        <p>Belum ada outlet yang tersedia saat ini.</p>
      </div>
    );
  }

  return (
    <LoadScript
      googleMapsApiKey={apiKey}
      loadingElement={<Skeleton className="w-full rounded-lg" style={{ height: 400 }} />}
    >
      <div className="overflow-hidden rounded-xl border border-border">
        <GoogleMap
          mapContainerStyle={{ width: "100%", height: 400 }}
          center={initialCenter ?? userPosition ?? DEFAULT_CENTER}
          zoom={INITIAL_ZOOM}
          options={MAP_OPTIONS}
          onLoad={handleMapLoad}
          onClick={() => handleInfoWindowClose()}
        >
          {outlets.map((outlet, i) => {
            const pos = { lat: Number(outlet.lat), lng: Number(outlet.lng) };
            const isActive = activeId === outlet.id;

            return (
              <div key={outlet.id}>
                <Marker
                  position={pos}
                  icon={pinIcons[i]}
                  onClick={() => handleMarkerClick(outlet.id)}
                  onMouseOver={() => setHoveredId(outlet.id)}
                  onMouseOut={() => setHoveredId(null)}
                />

                <Circle
                  center={pos}
                  radius={outlet.max_distance_km * 1000}
                  onLoad={(c) => circlesRef.current.set(outlet.id, c)}
                  onUnmount={() => circlesRef.current.delete(outlet.id)}
                  options={{
                    fillColor: PIN_COLORS[i % PIN_COLORS.length]!,
                    fillOpacity: 0.06,
                    strokeColor: PIN_COLORS[i % PIN_COLORS.length]!,
                    strokeOpacity: 0.18,
                    strokeWeight: 1,
                    clickable: false,
                  }}
                />

                {isActive ? (
                  <InfoWindow
                    position={pos}
                    onCloseClick={handleInfoWindowClose}
                    options={{ pixelOffset: { width: 0, height: -42 } as google.maps.Size }}
                  >
                    <div className="max-w-[220px] space-y-1 text-sm">
                      <p className="font-semibold text-gray-900">{outlet.name}</p>
                      <p className="text-gray-500 line-clamp-2">{outlet.address}</p>
                      <div className="pt-1 text-xs text-gray-600">
                        <span className="font-medium">{formatIDR(outlet.price_per_kg)}</span>/kg
                        <span className="mx-1">&middot;</span>
                        <span className="font-medium">{formatIDR(outlet.price_per_km)}</span>/km
                      </div>
                    </div>
                  </InfoWindow>
                ) : null}
              </div>
            );
          })}

        </GoogleMap>
      </div>
    </LoadScript>
  );
}
