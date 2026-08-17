"use server";

import axios from "axios";
import { headers } from "next/headers";

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

type LocationItem = { id: number; name: string; zip_code?: string } | null;

export type LocationPayload = {
  province: LocationItem;
  city: LocationItem;
  district: LocationItem;
  subdistrict: LocationItem;
  street?: string;
  houseNumber?: string;
};

export async function getLatLngFromLocation(location: LocationPayload) {
  const address = [
    location.street && location.houseNumber
      ? `${location.street} No. ${location.houseNumber}`
      : location.street,
    location.subdistrict?.name,
    location.district?.name,
    location.city?.name,
    location.subdistrict?.zip_code,
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
      lat: null as number | null,
      lng: null as number | null,
      confidence: 0,
    };
  }

  const r = res.data.results[0];

  return {
    address,
    lat: r.geometry.lat as number,
    lng: r.geometry.lng as number,
    confidence: r.confidence as number,
    formatted: r.formatted as string,
  };
}

export async function geocodeAddress(address: string) {
  if (!address.trim()) return null;

  const res = await axios.get("https://api.opencagedata.com/geocode/v1/json", {
    params: {
      q: address,
      key: process.env.OPENCAGE_API_KEY,
      countrycode: "id",
      limit: 1,
      language: "id",
      no_annotations: 1,
    },
  });

  const r = res.data?.results?.[0];
  if (!r) return null;

  return {
    lat: r.geometry.lat as number,
    lng: r.geometry.lng as number,
    formatted: r.formatted as string,
  };
}

export async function reverseGeocode(lat: number, lng: number) {
  const res = await axios.get("https://api.opencagedata.com/geocode/v1/json", {
    params: {
      q: `${lat},${lng}`,
      key: process.env.OPENCAGE_API_KEY,
      countrycode: "id",
      limit: 1,
      language: "id",
      no_annotations: 1,
    },
  });

  const r = res.data?.results?.[0];
  if (!r) return null;

  return {
    lat: r.geometry.lat as number,
    lng: r.geometry.lng as number,
    formatted: r.formatted as string,
  };
}

export async function ipGeolocate() {
  try {
    const h = await headers();
    const ip =
      h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      h.get("x-real-ip") ||
      "";

    const url = ip ? `https://ipwho.is/${encodeURIComponent(ip)}` : "https://ipwho.is/";
    const res = await fetch(url, {
      next: { revalidate: 0 },
    });
    const data = await res.json();

    if (!data?.success || typeof data.latitude !== "number") return null;

    return {
      lat: data.latitude as number,
      lng: data.longitude as number,
      city: data.city as string,
      country: data.country as string,
    };
  } catch {
    return null;
  }
}
