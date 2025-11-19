import type { Request, Response, NextFunction } from "express";
import { Prisma } from "../generated/prisma/client";

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error("ERROR:", err);

  // Prisma unique constraint
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      return res.status(409).json({
        message: "Duplicate field",
        fields: err.meta?.target,
      });
    }
  }

  if (err.code === "P2002") {
    return res.status(409).json({
      message: "Duplicate field",
      fields: err.meta?.target,
    });
  }

  if (err.type === "entity.parse.failed") {
    return res.status(400).json({
      message: "Validation failed",
      errors: err.errors,
    });
  }

  // Prisma not found
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2025") {
      return res.status(404).json({
        message: "Record not found",
      });
    }
  }

  // Default
  return res.status(500).json({
    message: "AAWOO!!!!",
  });
}
