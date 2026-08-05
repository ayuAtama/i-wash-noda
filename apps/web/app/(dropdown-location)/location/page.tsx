"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
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
  const [provinceId, setProvinceId] = useState<number | null>(null);
  const [cityId, setCityId] = useState<number | null>(null);
  const [districtId, setDistrictId] = useState<number | null>(null);
  const [subdistrictId, setSubdistrictId] = useState<number | null>(null);

  const [street, setStreet] = useState("");
  const [houseNumber, setHouseNumber] = useState("");

  const [mapCenter, setMapCenter] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(
    null,
  );

  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
  });

  /* ===========================
     CASCADING DROPDOWNS (useQuery)
  =========================== */
  const { data: provinces = [] } = useQuery({
    queryKey: ["provinces"],
    queryFn: getProvinces,
  });

  const { data: cities = [] } = useQuery({
    queryKey: ["cities", provinceId],
    queryFn: () => getCities(String(provinceId)),
    enabled: !!provinceId,
  });

  const { data: districts = [] } = useQuery({
    queryKey: ["districts", cityId],
    queryFn: () => getDistricts(String(cityId)),
    enabled: !!cityId,
  });

  const { data: subdistricts = [] } = useQuery({
    queryKey: ["subdistricts", districtId],
    queryFn: () => getSubDistricts(String(districtId)),
    enabled: !!districtId,
  });

  function findItem(list: Item[], id: number | null) {
    return list.find((i) => i.id === id) ?? null;
  }

  function handleProvinceChange(value: number | null) {
    setProvinceId(value);
    setCityId(null);
    setDistrictId(null);
    setSubdistrictId(null);
  }

  function handleCityChange(value: number | null) {
    setCityId(value);
    setDistrictId(null);
    setSubdistrictId(null);
  }

  function handleDistrictChange(value: number | null) {
    setDistrictId(value);
    setSubdistrictId(null);
  }

  /* ===========================
     GEOCODING (useMutation)
  =========================== */
  const geoMutation = useMutation({
    mutationFn: (payload: Parameters<typeof getLatLngFromLocation>[0]) =>
      getLatLngFromLocation(payload),
    onSuccess: (geo) => {
      if (geo.lat && geo.lng) {
        setMapCenter({ lat: geo.lat, lng: geo.lng });
        setPosition({ lat: geo.lat, lng: geo.lng });
      }
    },
  });

  function handleSubmit() {
    const payload = {
      province: findItem(provinces, provinceId),
      city: findItem(cities, cityId),
      district: findItem(districts, districtId),
      subdistrict: findItem(subdistricts, subdistrictId),
      street,
      houseNumber,
    };

    geoMutation.mutate(payload);
  }

  /* ===========================
     MAP CLICK
  =========================== */
  const handleMapClick = (e: google.maps.MapMouseEvent) => {
    if (!e.latLng) return;
    setPosition({ lat: e.latLng.lat(), lng: e.latLng.lng() });
  };

  /* ===========================
     UI
  =========================== */
  return (
    <div style={{ maxWidth: 420 }}>
      <select
        value={provinceId ?? ""}
        onChange={(e) => handleProvinceChange(Number(e.target.value) || null)}
      >
        <option value="">Provinsi</option>
        {provinces.map((p: Item) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>

      <select
        value={cityId ?? ""}
        onChange={(e) => handleCityChange(Number(e.target.value) || null)}
        disabled={!cities.length}
      >
        <option value="">Kota</option>
        {cities.map((c: Item) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>

      <select
        value={districtId ?? ""}
        onChange={(e) => handleDistrictChange(Number(e.target.value) || null)}
        disabled={!districts.length}
      >
        <option value="">Kecamatan</option>
        {districts.map((d: Item) => (
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
        {subdistricts.map((s: Item) => (
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

      <button
        onClick={handleSubmit}
        disabled={!subdistrictId || geoMutation.isPending}
      >
        {geoMutation.isPending ? "Loading..." : "Submit"}
      </button>

      {geoMutation.data && (
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
          {JSON.stringify(geoMutation.data, null, 2)}
        </pre>
      )}

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
