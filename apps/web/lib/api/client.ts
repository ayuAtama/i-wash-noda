import axios, { AxiosError, type AxiosInstance } from "axios";

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

export interface ApiEnvelope<T = unknown> {
  success: boolean;
  message: string;
  data: T;
}

export class ApiError extends Error {
  status: number;
  success: boolean;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.success = false;
  }
}

interface RefreshResponse {
  success: boolean;
  accessToken?: string;
  message?: string;
}

let refreshPromise: Promise<boolean> | null = null;

async function refreshAccessToken(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = client
      .get<RefreshResponse>("/api/refresh")
      .then(() => true)
      .catch(() => false)
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

export function normalizeError(error: unknown): ApiError {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{
      message?: string | string[];
      error?: string;
    }>;
    const status = axiosError.response?.status ?? 0;
    const raw = axiosError.response?.data;
    let message = axiosError.message;

    if (raw) {
      if (typeof raw.message === "string") message = raw.message;
      else if (Array.isArray(raw.message)) message = raw.message.join(", ");
      else if (typeof raw.error === "string") message = raw.error;
    }

    if (axiosError.code === "ERR_NETWORK") {
      message = "Tidak dapat terhubung ke server. Periksa koneksi Anda.";
    }

    return new ApiError(status, message);
  }

  if (error instanceof Error) return new ApiError(0, error.message);
  return new ApiError(0, "Terjadi kesalahan yang tidak diketahui");
}

export const client: AxiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

client.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as (typeof error.config & {
      _retry?: boolean;
    }) | undefined;

    const isAuthRefresh =
      original?.url?.includes("/api/refresh") ||
      original?.url?.includes("/api/login") ||
      original?.url?.includes("/api/logout");

    if (
      error.response?.status === 401 &&
      original &&
      !original._retry &&
      !isAuthRefresh
    ) {
      original._retry = true;
      const refreshed = await refreshAccessToken();
      if (refreshed) {
        return client(original);
      }
    }

    return Promise.reject(error);
  },
);
