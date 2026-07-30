// action.ts

"use server";

import axios from "axios";

/* ===========================
   RAJAONGKIR (TETAP)
=========================== */

const api = axios.create({
  baseURL: "https://rajaongkir.komerce.id/api/v1",
  headers: {
    key: process.env.RAJAONGKIR_API_KEY!,
  },
});

export async function getProvinces() {
  const res = await api.get("/destination/province");
  return res.data.data;
}

export async function getCities(provinceId: string) {
  if (!provinceId) return [];
  const res = await api.get(`/destination/city/${provinceId}`);
  return res.data.data;
}

export async function getDistricts(cityId: string) {
  if (!cityId) return [];
  const res = await api.get(`/destination/district/${cityId}`);
  return res.data.data;
}

export async function getSubDistricts(districtId: string) {
  if (!districtId) return [];
  const res = await api.get(`/destination/sub-district/${districtId}`);
  return res.data.data;
}

/* ===========================
   TYPES
=========================== */

type LocationItem = { id: number; name: string; zip_code?: string } | null;

type LocationPayload = {
  province: LocationItem;
  city: LocationItem;
  district: LocationItem;
  subdistrict: LocationItem;
  street?: string;
  houseNumber?: string;
};

/* ===========================
   OPENCAGE (DENGAN JALAN)
=========================== */

export async function getLatLngFromLocation(location: LocationPayload) {
  const address = [
    location.street && location.houseNumber
      ? `${location.street} No. ${location.houseNumber}`
      : location.street,
    location.subdistrict?.name,
    location.district?.name,
    location.city?.name,
    location.subdistrict?.zip_code, // 🔥 ZIP CODE MASUK
    location.province?.name,
    "Indonesia",
  ]
    .filter(Boolean)
    .join(", ");

  const res = await axios.get("https://api.opencagedata.com/geocode/v1/json", {
    params: {
      q: address,
      key: process.env.OPENCAGE_API_KEY,
      countrycode: "id",
      limit: 10,
      language: "id",
      no_annotations: 1,
    },
  });

  if (!res.data.results.length) {
    return {
      address,
      lat: null,
      lng: null,
      confidence: 0,
    };
  }

  const r = res.data.results[0];

  return {
    address,
    lat: r.geometry.lat,
    lng: r.geometry.lng,
    copy: r.geometry.lat + ", " + r.geometry.lng,
    confidence: r.confidence,
    formatted: r.formatted,
    result: res.data,
  };
}
