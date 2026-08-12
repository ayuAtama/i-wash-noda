import rateLimit from "express-rate-limit";
import ms, { StringValue } from "ms";

/**
 * Membuat middleware rate limiter untuk membatasi jumlah request dari satu IP.
 * Fungsi ini membantu mencegah spam atau serangan brute-force pada endpoint tertentu.
 * * @param maxRequests - Batas maksimal request yang diizinkan dalam rentang waktu tertentu.
 * @param windowMs - Durasi waktu (contoh: "1m" untuk 1 menit, "1h" untuk 1 jam). Default adalah "1m".
 * @returns Konfigurasi middleware express-rate-limit.
 * * @example
 * // Membatasi maksimal 5 request per 2 menit
 * export const loginLimiter = RateLimiter.create(5, "2m");
 */
export class RateLimiter {
  static create(maxRequests: number, windowMs: StringValue = "1m") {
    return rateLimit({
      windowMs: ms(windowMs), // default 1 minute for rate limit
      max: maxRequests, // Limit how much IP can request per windowMs
      standardHeaders: true, // send RateLimit-* headers
      legacyHeaders: false, // Disable the `X-RateLimit-*` headers
      message: { error: "Too many requests, please try again later." },
    });
  }
}
