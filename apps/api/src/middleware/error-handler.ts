//src/middleware/error-handler.ts
import type { Request, Response, NextFunction } from "express";
import { Prisma } from "../generated/prisma/client";
import { HttpError } from "@/utils/httpError";
import { mapPrismaError } from "@/utils/prismaError";

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error("ERROR:", err);

  // 1. Handle custom HttpError
  if (err instanceof HttpError) {
    return res.status(err.status).json({
      message: err.message,
    });
  }

  // 2. Prisma known errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    const mapped = mapPrismaError(err);
    return res.status(mapped.status).json({
      message: mapped.message,
      fields: mapped.fields ?? undefined,
    });
  }

  // 3. Body parse errors
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({
      message: "Invalid JSON payload",
    });
  }

  // 4. Unexpected server errors
  return res.status(500).json({
    message: "Internal Server Error",
    note: "Developers likes a femboy xD",
  });
}
