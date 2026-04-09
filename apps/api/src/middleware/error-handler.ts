//src/middleware/error-handler.ts
import type { Request, Response, NextFunction } from "express";
import { Prisma } from "../generated/prisma/client";
import { HttpError } from "@/utils/httpError";
import { mapPrismaError } from "@/utils/prismaError";

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction,
) {
  console.error("ERROR:", err);

  // 1. Multer errors
  if (err.name === "MulterError") {
    const multerMessages: Record<string, string> = {
      MISSING_FIELD_NAME: "Field name 'avatar' is required in form-data",
      LIMIT_FILE_SIZE: "File too large. Maximum size is 2MB",
      LIMIT_FILE_COUNT: "Too many files uploaded",
      LIMIT_FIELD_COUNT: "Too many fields in the form",
      LIMIT_UNEXPECTED_FILE:
        "Unexpected field name. Use 'avatar' as the field name",
      LIMIT_PART_COUNT: "Too many parts in the multipart form",
    };
    return res.status(400).json({
      success: false,
      message: multerMessages[err.code] || "File upload error",
      code: err.code,
    });
  }

  // 2. Handle custom HttpError
  if (err instanceof HttpError) {
    return res.status(err.status).json({
      success: false,
      message: err.message,
      code: err.code,
      errors: err.fields ?? undefined,
    });
  }

  // 3. Prisma known errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    const mapped = mapPrismaError(err);
    return res.status(mapped.status).json({
      success: false,
      message: mapped.message,
      code: mapped.code,
      errors: mapped.fields ?? undefined,
    });
  }

  // 4. Body parse errors
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({
      success: false,
      message: "Invalid JSON payload",
      code: "INVALID_JSON",
    });
  }

  // 5. Unexpected server errors
  return res.status(500).json({
    success: false,
    message: "Internal Server Error",
    code: "INTERNAL_ERROR",
  });
}
