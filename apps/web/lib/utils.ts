import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatIDR(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "-";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "-";
  return new Intl.NumberFormat("id-ID").format(value);
}

export function formatDate(
  value: string | Date | null | undefined,
  withTime = true,
): string {
  if (!value) return "-";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  }).format(date);
}

export function formatDistance(km: number | null | undefined): string {
  if (km === null || km === undefined || Number.isNaN(km)) return "-";
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

export function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function parseCoordinates(
  value: string | null | undefined,
): { lat: number; lng: number } | null {
  if (!value) return null;
  const parts = value.split(",");
  if (parts.length < 2) return null;
  const lat = Number(parts[0]);
  const lng = Number(parts[1]);
  if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
  return { lat, lng };
}

export function validateIndonesianPhone(phone: string): boolean {
  return /^(?:\+62|62|0)8[1-9][0-9]{6,11}$/.test(phone.replace(/[\s-]/g, ""));
}

// ---------------- ID label maps (enums from Prisma) ----------------

export const ROLE_LABEL: Record<string, string> = {
  super_admin: "Super Admin",
  outlet_admin: "Admin Outlet",
  worker: "Pekerja",
  driver: "Driver",
  customer: "Pelanggan",
};

export const STATION_LABEL: Record<string, string> = {
  washing: "Cuci",
  ironing: "Setrika",
  packing: "Packing",
};

export const DAY_LABEL: Record<string, string> = {
  mon: "Senin",
  tue: "Selasa",
  wed: "Rabu",
  thu: "Kamis",
  fri: "Jumat",
  sat: "Sabtu",
  sun: "Minggu",
};

export const ORDER_STATUS_LABEL: Record<string, string> = {
  waiting_for_driver_pickup: "Menunggu driver dijemput",
  out_for_pickup: "Driver dalam perjalanan jemput",
  in_transit_to_outlet: "Dalam perjalanan ke outlet",
  arrived_at_outlet: "Tiba di outlet",
  washing_in_progress: "Sedang dicuci",
  ironing_in_progress: "Sedang disetrika",
  packing_in_progress: "Sedang di-packing",
  waiting_for_payment: "Menunggu pembayaran",
  waiting_for_driver_deliver: "Menunggu driver antar",
  out_for_delivery: "Driver dalam perjalanan antar",
  delivered: "Telah diantar",
  complaint_received: "Komplain diterima",
  cancelled: "Dibatalkan",
  finished: "Selesai",
};

export const ORDER_STATUS_ORDER: string[] = [
  "waiting_for_driver_pickup",
  "out_for_pickup",
  "in_transit_to_outlet",
  "arrived_at_outlet",
  "washing_in_progress",
  "ironing_in_progress",
  "packing_in_progress",
  "waiting_for_payment",
  "waiting_for_driver_deliver",
  "out_for_delivery",
  "delivered",
  "finished",
];

export const PAYMENT_STATUS_LABEL: Record<string, string> = {
  pending: "Menunggu",
  approved: "Disetujui",
  rejected: "Ditolak",
};

export const COMPLAINT_STATUS_LABEL: Record<string, string> = {
  pending: "Menunggu",
  resolved: "Selesai",
  rejected: "Ditolak",
};

export const MISMATCH_STATUS_LABEL: Record<string, string> = {
  pending: "Menunggu",
  approved: "Disetujui",
  rejected: "Ditolak",
};

export const ORDER_SOURCE_LABEL: Record<string, string> = {
  customer_app: "Aplikasi",
  walk_in: "Walk-in",
};

export function labelFrom(
  map: Record<string, string>,
  value: string | null | undefined,
  fallback = "-",
): string {
  if (!value) return fallback;
  return map[value] ?? value;
}

export function toTitleCase(value: string | null | undefined): string {
  if (!value) return "-";
  return value
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
