// src/config/midtrans.ts
import "dotenv/config";
import { createHash } from "crypto";
import { HttpError } from "@/utils/httpError";

const SERVER_KEY = process.env.MIDTRANS_SERVER_KEY ?? "";
const CLIENT_KEY = process.env.MIDTRANS_CLIENT_KEY ?? "";
const IS_PRODUCTION = process.env.MIDTRANS_IS_PRODUCTION === "true";

const SNAP_BASE_URL = IS_PRODUCTION
  ? "https://app.midtrans.com"
  : "https://app.sandbox.midtrans.com";

export const midtransConfig = {
  serverKey: SERVER_KEY,
  clientKey: CLIENT_KEY,
  isProduction: IS_PRODUCTION,
  snapBaseUrl: SNAP_BASE_URL,
  get snapCreateUrl() {
    return `${SNAP_BASE_URL}/snap/v1/transactions`;
  },
};

function getBasicAuth(): string {
  if (!SERVER_KEY) {
    throw new HttpError(500, "Midtrans server key is not configured");
  }
  return `Basic ${Buffer.from(`${SERVER_KEY}:`).toString("base64")}`;
}

export interface SnapItemDetails {
  id: string;
  price: number;
  quantity: number;
  name: string;
}

export interface SnapRequestPayload {
  order_id: string;
  gross_amount: number;
  customer_details?: {
    first_name?: string | null;
    email?: string | null;
  };
  item_details?: SnapItemDetails[];
  expiry?: {
    start_time: string;
    unit: "minutes" | "hours" | "days";
    duration: number;
  };
  custom_field1?: string;
}

export interface SnapResponse {
  token: string;
  redirect_url: string;
}

export interface MidtransStatusResponse {
  transaction_status?: string;
  fraud_status?: string;
  status_code?: string;
  transaction_id?: string;
  payment_type?: string;
  transaction_time?: string;
  settlement_time?: string;
  gross_amount?: string;
  status_message?: string;
}

function apiBaseUrl(): string {
  return SNAP_BASE_URL.replace("app.", "api.");
}

export async function getTransactionStatus(
  orderId: string,
): Promise<MidtransStatusResponse> {
  const response = await fetch(`${apiBaseUrl()}/v2/${orderId}/status`, {
    headers: {
      Accept: "application/json",
      Authorization: getBasicAuth(),
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new HttpError(
      502,
      (data as { status_message?: string })?.status_message ??
        "Failed to fetch Midtrans transaction status",
    );
  }

  return data as MidtransStatusResponse;
}

function formatMidtransStartTime(value: string): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  const d = new Date(value);
  const shifted = new Date(d.getTime() + 7 * 60 * 60 * 1000);
  return `${shifted.getUTCFullYear()}-${pad(shifted.getUTCMonth() + 1)}-${pad(
    shifted.getUTCDate(),
  )} ${pad(shifted.getUTCHours())}:${pad(shifted.getUTCMinutes())}:${pad(
    shifted.getUTCSeconds(),
  )} +0700`;
}

export async function createSnapTransaction(
  payload: SnapRequestPayload,
): Promise<SnapResponse> {
  const body = {
    transaction_details: {
      order_id: payload.order_id,
      gross_amount: payload.gross_amount,
    },
    item_details: payload.item_details,
    customer_details: payload.customer_details,
    expiry: payload.expiry
      ? {
          ...payload.expiry,
          start_time: formatMidtransStartTime(payload.expiry.start_time),
        }
      : undefined,
    custom_field1: payload.custom_field1,
  };

  const response = await fetch(midtransConfig.snapCreateUrl, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: getBasicAuth(),
    },
    body: JSON.stringify(body),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new HttpError(
      502,
      (data as { status_message?: string })?.status_message ??
        "Failed to create Midtrans Snap transaction",
    );
  }

  return {
    token: data.token as string,
    redirect_url: data.redirect_url as string,
  };
}

export function verifyNotificationSignature(
  signatureKey: string,
  orderId: string,
  statusCode: string,
  grossAmount: string,
): boolean {
  const payload = `${orderId}${statusCode}${grossAmount}${SERVER_KEY}`;
  const expected = createHash("sha512").update(payload).digest("hex");
  return expected === signatureKey;
}
