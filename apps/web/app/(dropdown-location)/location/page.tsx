"use client";

import { useEffect, useState } from "react";
import {
  getProvinces,
  getCities,
  getDistricts,
  getSubDistricts,
  getLatLngFromLocation,
} from "./actions";

import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";

type Item = { id: number; name: string };

export default function LocationStepByStep() {
  /* ===========================
     LOCATION DROPDOWN STATE
  =========================== */
  const [provinces, setProvinces] = useState<Item[]>([]);
  const [cities, setCities] = useState<Item[]>([]);
  const [districts, setDistricts] = useState<Item[]>([]);
  const [subdistricts, setSubDistricts] = useState<Item[]>([]);

  const [provinceId, setProvinceId] = useState<number | null>(null);
  const [cityId, setCityId] = useState<number | null>(null);
  const [districtId, setDistrictId] = useState<number | null>(null);
  const [subdistrictId, setSubdistrictId] = useState<number | null>(null);

  const [street, setStreet] = useState("");
  const [houseNumber, setHouseNumber] = useState("");

  const [loading, setLoading] = useState(false);

  /* ===========================
     GEOCODING RESULT (🔥 INI)
  =========================== */
  const [geoResult, setGeoResult] = useState<any>(null);

  /* ===========================
     MAP STATE
  =========================== */
  const [mapCenter, setMapCenter] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(
    null,
  );

  /* ===========================
     GOOGLE MAPS LOADER
  =========================== */
  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
  });

  /* ===========================
     LOAD DROPDOWNS
  =========================== */
  useEffect(() => {
    getProvinces().then(setProvinces);
  }, []);

  useEffect(() => {
    if (!provinceId) return;
    setCities([]);
    setCityId(null);
    setDistricts([]);
    setDistrictId(null);
    setSubDistricts([]);
    setSubdistrictId(null);
    getCities(String(provinceId)).then(setCities);
  }, [provinceId]);

  useEffect(() => {
    if (!cityId) return;
    setDistricts([]);
    setDistrictId(null);
    setSubDistricts([]);
    setSubdistrictId(null);
    getDistricts(String(cityId)).then(setDistricts);
  }, [cityId]);

  useEffect(() => {
    if (!districtId) return;
    setSubDistricts([]);
    setSubdistrictId(null);
    getSubDistricts(String(districtId)).then(setSubDistricts);
  }, [districtId]);

  function findItem(list: Item[], id: number | null) {
    return list.find((i) => i.id === id) ?? null;
  }

  /* ===========================
     SUBMIT → GEOCODE → FRONTEND
  =========================== */
  async function handleSubmit() {
    setLoading(true);

    const payload = {
      province: findItem(provinces, provinceId),
      city: findItem(cities, cityId),
      district: findItem(districts, districtId),
      subdistrict: findItem(subdistricts, subdistrictId),
      street,
      houseNumber,
    };

    const geo = await getLatLngFromLocation(payload);

    // 🔥 SIMPAN HASIL JSON LENGKAP
    setGeoResult(geo);

    if (geo.lat && geo.lng) {
      setMapCenter({ lat: geo.lat, lng: geo.lng });
      setPosition({ lat: geo.lat, lng: geo.lng });
    }

    setLoading(false);
  }

  /* ===========================
     MAP CLICK → PRECISE LOCATION
  =========================== */
  const handleMapClick = (e: google.maps.MapMouseEvent) => {
    if (!e.latLng) return;
    setPosition({
      lat: e.latLng.lat(),
      lng: e.latLng.lng(),
    });
  };

  /* ===========================
     UI
  =========================== */
  return (
    <div style={{ maxWidth: 420 }}>
      <select
        value={provinceId ?? ""}
        onChange={(e) => setProvinceId(Number(e.target.value) || null)}
      >
        <option value="">Provinsi</option>
        {provinces.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>

      <select
        value={cityId ?? ""}
        onChange={(e) => setCityId(Number(e.target.value) || null)}
        disabled={!cities.length}
      >
        <option value="">Kota</option>
        {cities.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>

      <select
        value={districtId ?? ""}
        onChange={(e) => setDistrictId(Number(e.target.value) || null)}
        disabled={!districts.length}
      >
        <option value="">Kecamatan</option>
        {districts.map((d) => (
          <option key={d.id} value={d.id}>
            {d.name}
          </option>
        ))}
      </select>

      <select
        value={subdistrictId ?? ""}
        onChange={(e) => setSubdistrictId(Number(e.target.value) || null)}
        disabled={!subdistricts.length}
      >
        <option value="">Kelurahan / Desa</option>
        {subdistricts.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </select>

      <input
        placeholder="Nama Jalan"
        value={street}
        onChange={(e) => setStreet(e.target.value)}
      />
      <input
        placeholder="No Rumah"
        value={houseNumber}
        onChange={(e) => setHouseNumber(e.target.value)}
      />

      <button onClick={handleSubmit} disabled={!subdistrictId || loading}>
        {loading ? "Loading..." : "Submit"}
      </button>

      {/* ===========================
         DEBUG JSON (🔥 HASIL OPENCAGE)
      =========================== */}
      {geoResult && (
        <pre
          style={{
            marginTop: 16,
            background: "#f5f5f5",
            padding: 12,
            color: "black",
            maxHeight: 300,
            overflow: "auto",
            fontSize: 12,
          }}
        >
          {JSON.stringify(geoResult, null, 2)}
        </pre>
      )}

      {/* ===========================
         MAP
      =========================== */}
      {mapCenter && isLoaded && (
        <GoogleMap
          mapContainerStyle={{ width: "100%", height: "400px" }}
          center={mapCenter}
          zoom={16}
          onClick={handleMapClick}
        >
          {position && <Marker position={position} />}
        </GoogleMap>
      )}

      {position && (
        <>
          <p>Latitude: {position.lat}</p>
          <p>Longitude: {position.lng}</p>
        </>
      )}
    </div>
  );
}
