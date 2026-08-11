"use client";

import {
  GoogleMap,
  Marker,
  Circle,
  useJsApiLoader,
  OverlayView,
} from "@react-google-maps/api";
import { useState } from "react";

type Location = {
  id: number;
  name: string;
  lat: number;
  lng: number;
  outlet: string;
  description: string;
};

export default function SouthSumatraCoverageWithInfo() {
  /* ===========================
     DATA LOKASI + DESKRIPSI
  =========================== */
  const locations: Location[] = [
    {
      id: 1,
      name: "Palembang",
      lat: -2.9761,
      lng: 104.7754,
      outlet: "Outlet Palembang Pusat",
      description:
        "Outlet utama. Melayani pickup & delivery seluruh kota Palembang.",
    },
    {
      id: 2,
      name: "Prabumulih",
      lat: -3.4325,
      lng: 104.2475,
      outlet: "Outlet Prabumulih",
      description: "Cabang regional. Fokus area Prabumulih dan sekitarnya.",
    },
    {
      id: 3,
      name: "Muara Enim",
      lat: -3.6514,
      lng: 104.2266,
      outlet: "Outlet Muara Enim",
      description: "Melayani area industri dan pemukiman Muara Enim.",
    },
    {
      id: 4,
      name: "Lahat",
      lat: -3.8004,
      lng: 103.5326,
      outlet: "Outlet Lahat",
      description: "Cabang pegunungan. Estimasi pickup 1x sehari.",
    },
    {
      id: 5,
      name: "Baturaja",
      lat: -4.1289,
      lng: 104.1669,
      outlet: "Outlet Baturaja (OKU)",
      description: "Melayani wilayah OKU & OKU Timur.",
    },
  ];

  /* ===========================
     GOOGLE MAPS LOADER
  =========================== */
  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
  });

  /* ===========================
     STATE MARKER AKTIF
  =========================== */
  const [activeLocation, setActiveLocation] = useState<Location | null>(null);

  /* ===========================
     CENTER MAP (SUMSEL)
  =========================== */
  const center = {
    lat: -3.6,
    lng: 104.2,
  };

  if (!isLoaded) return <p>Loading map…</p>;

  return (
    <div style={{ width: "100%", height: "500px" }}>
      <GoogleMap
        mapContainerStyle={{ width: "100%", height: "100%" }}
        center={center}
        zoom={7}
      >
        {locations.map((loc) => (
          <div key={loc.id}>
            {/* MARKER */}
            <Marker
              position={{ lat: loc.lat, lng: loc.lng }}
              title={loc.outlet}
              onClick={() => setActiveLocation(loc)}
            />

            {/* COVERAGE 5 KM */}
            <Circle
              center={{ lat: loc.lat, lng: loc.lng }}
              radius={5000}
              options={{
                fillColor: "#0b57d0",
                fillOpacity: 0.18,
                strokeColor: "#0b57d0",
                strokeOpacity: 0.7,
                strokeWeight: 1,
              }}
            />
          </div>
        ))}

        {/* INFO WINDOW */}
        {/* {activeLocation && (
          <InfoWindow
            position={{
              lat: activeLocation.lat,
              lng: activeLocation.lng,
            }}
            onCloseClick={() => setActiveLocation(null)}
          >
            <div
              style={{
                background: "#ffffff",
                color: "#1f2937", // dark gray (readable)
                padding: "10px 12px",
                borderRadius: 8,
                maxWidth: 240,
                fontFamily: "system-ui, -apple-system, BlinkMacSystemFont",
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
              }}
            >
              <h4
                style={{
                  margin: "0 0 6px 0",
                  fontSize: 15,
                  fontWeight: 600,
                  color: "#111827",
                }}
              >
                {activeLocation.outlet}
              </h4>

              <p
                style={{
                  margin: 0,
                  fontSize: 13,
                  color: "#374151",
                }}
              >
                <strong>Area:</strong> {activeLocation.name}
              </p>

              <p
                style={{
                  marginTop: 6,
                  fontSize: 13,
                  lineHeight: 1.4,
                  color: "#4b5563",
                }}
              >
                {activeLocation.description}
              </p>
            </div>
          </InfoWindow>
        )} */}
        {activeLocation && (
          <OverlayView
            position={{
              lat: activeLocation.lat,
              lng: activeLocation.lng,
            }}
            mapPaneName={OverlayView.FLOAT_PANE}
          >
            <div
              style={{
                background: "#ffffff",
                color: "black",
                padding: "10px 12px",
                borderRadius: 10,
                boxShadow: "0 6px 20px rgba(0,0,0,.2)",
                width: "max-content",
                minWidth: 180,
                maxWidth: 240,

                transform: "translate(-50%, -110%)",
                whiteSpace: "normal",
              }}
            >
              <div
                style={{
                  fontWeight: 600,
                  fontSize: 14,
                  marginBottom: 4,
                }}
              >
                {activeLocation.outlet}
              </div>

              <div style={{ fontSize: 12 }}>
                <strong>Area:</strong> {activeLocation.name}
              </div>

              <div style={{ fontSize: 12, marginTop: 6 }}>
                {activeLocation.description}
              </div>

              <button
                onClick={() => setActiveLocation(null)}
                style={{
                  marginTop: 8,
                  fontSize: 11,
                  border: "none",
                  background: "#0b57d0",
                  color: "#fff",
                  padding: "4px 8px",
                  borderRadius: 6,
                  cursor: "pointer",
                }}
              >
                Tutup
              </button>
            </div>
          </OverlayView>
        )}
      </GoogleMap>
    </div>
  );
}
