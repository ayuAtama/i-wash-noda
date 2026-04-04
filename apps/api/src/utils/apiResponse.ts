import type { Response } from "express";

interface ApiResponseOptions<T = unknown> {
  data?: T;
  message?: string;
  statusCode?: number;
}

export function apiSuccess<T = unknown>(
  res: Response,
  options: ApiResponseOptions<T>,
): Response {
  const { data, message = "Success", statusCode = 200 } = options;
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
}

interface ApiErrorOptions {
  message: string;
  statusCode?: number;
  errors?: unknown[];
}

export function apiError(res: Response, options: ApiErrorOptions): Response {
  const { message, statusCode = 500, errors } = options;
  return res.status(statusCode).json({
    success: false,
    message,
    ...(errors && { errors }),
  });
}
