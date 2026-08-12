//src/middleware/error-handler.ts
import type { Request, Response, NextFunction } from "express";
import { Prisma } from "../generated/prisma/client";
import { HttpError } from "@/utils/httpError";
import { PrismaErrorMapper } from "@/utils/prismaError";

export class ErrorHandler {
  static handler(err: any, req: Request, res: Response, next: NextFunction) {
    console.error("ERROR:", err);

    // 1. Multer errors
    if (err.name === "MulterError") {
      const multerMessages: Record<string, { message: string; code: string }> =
        {
          MISSING_FIELD_NAME: {
            message: "No file uploaded",
            code: "AVATAR_MISSING_FILE",
          },
          LIMIT_FILE_SIZE: {
            message: "File too large. Maximum size is 2MB",
            code: "AVATAR_FILE_TOO_LARGE",
          },
          LIMIT_FILE_COUNT: {
            message: "Too many files uploaded",
            code: "AVATAR_TOO_MANY_FILES",
          },
          LIMIT_FIELD_COUNT: {
            message: "Too many fields in the form",
            code: "AVATAR_TOO_MANY_FIELDS",
          },
          LIMIT_UNEXPECTED_FILE: {
            message: "Unexpected field name",
            code: "AVATAR_UNEXPECTED_FIELD",
          },
          LIMIT_PART_COUNT: {
            message: "Too many parts in the multipart form",
            code: "AVATAR_TOO_MANY_PARTS",
          },
        };
      const error = multerMessages[err.code] || {
        message: "File upload error",
        code: "AVATAR_UPLOAD_ERROR",
      };
      return res.status(400).json({
        success: false,
        message: error.message,
        code: error.code,
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
      const mapped = PrismaErrorMapper.map(err);
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
}
