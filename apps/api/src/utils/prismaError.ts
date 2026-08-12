//src/utils/prismaError.ts
import { Prisma } from "@/generated/prisma/client";
import { HttpError } from "@/utils/httpError";

export class PrismaErrorMapper {
  // Extract field name from Prisma message (fallback)
  private static extractField(
    err: Prisma.PrismaClientKnownRequestError,
  ): string[] | undefined {
    // Step 1: Prisma gives the correct field
    if (err.meta?.target) return err.meta.target as string[];

    // Step 2: Try to extract from error message:
    // "Unique constraint failed on the fields: (`email`)"
    const match = err.message.match(/fields?:\s*\((.+)\)/i);
    if (match) {
      return match[1]
        .replace(/[`"]/g, "")
        .split(",")
        .map((s) => s.trim());
    }

    // Step 3: Try another common Prisma format: "`email`"
    const match2 = err.message.match(/`(.+?)`/);
    if (match2) return [match2[1]];

    // Step 4: If everything fails → undefined
    return undefined;
  }

  // Full Prisma error mapper
  static map(err: Prisma.PrismaClientKnownRequestError): HttpError {
    switch (err.code) {
      // Unique constraint failed
      case "P2002":
        return new HttpError(
          409,
          "Duplicate field",
          PrismaErrorMapper.extractField(err) ?? ["unknown"],
          "DUPLICATE_FIELD",
        );

      // Record not found
      case "P2025":
        return new HttpError(
          404,
          "Record not found",
          undefined,
          "RECORD_NOT_FOUND",
        );

      // Foreign key failed
      case "P2003":
        return new HttpError(
          409,
          "Foreign key constraint failed",
          PrismaErrorMapper.extractField(err) ?? ["unknown"],
          "FOREIGN_KEY_ERROR",
        );

      // Query interpretation error
      case "P2005":
        return new HttpError(
          400,
          "Invalid value for field",
          PrismaErrorMapper.extractField(err) ?? ["unknown"],
          "INVALID_FIELD_VALUE",
        );

      // Required field is missing
      case "P2011":
        return new HttpError(
          400,
          "Required field missing",
          PrismaErrorMapper.extractField(err) ?? ["unknown"],
          "REQUIRED_FIELD_MISSING",
        );

      // Null constraint failed
      case "P2019":
        return new HttpError(
          400,
          "Input violates null constraint",
          PrismaErrorMapper.extractField(err) ?? ["unknown"],
          "NULL_CONSTRAINT_ERROR",
        );

      // Value too long for column type
      case "P2000":
        return new HttpError(
          400,
          "Value is too long for field",
          PrismaErrorMapper.extractField(err) ?? ["unknown"],
          "VALUE_TOO_LONG",
        );

      // Invalid value type
      case "P2006":
        return new HttpError(
          400,
          "Invalid value type",
          PrismaErrorMapper.extractField(err) ?? ["unknown"],
          "INVALID_VALUE_TYPE",
        );

      // Record already exists (unique + upsert mismatch)
      case "P2010":
        return new HttpError(
          409,
          "Record already exists",
          PrismaErrorMapper.extractField(err) ?? ["unknown"],
          "RECORD_EXISTS",
        );

      // Broken relation
      case "P2014":
        return new HttpError(
          409,
          "Failed to detach related record",
          undefined,
          "RELATION_ERROR",
        );

      // Operation timed out
      case "P2018":
        return new HttpError(503, "Database timeout", undefined, "DB_TIMEOUT");

      // Constraint name invalid
      case "P2021":
        return new HttpError(
          500,
          "Table or view does not exist",
          undefined,
          "TABLE_NOT_FOUND",
        );

      // Column does not exist
      case "P2022":
        return new HttpError(
          500,
          "Column does not exist",
          undefined,
          "COLUMN_NOT_FOUND",
        );

      // Connection failure
      case "P2024":
        return new HttpError(
          503,
          "Database connection issue",
          undefined,
          "DB_CONNECTION_ERROR",
        );

      // connection unreachable
      case "P1001":
        return new HttpError(
          503,
          "Database unreachable",
          undefined,
          "DB_UNREACHABLE",
        );

      // case "P2028":
      //   return new HttpError(
      //     400,
      //     "Invalid email address, please use your real email address."
      //   );

      default:
        return new HttpError(
          500,
          `Unmapped Prisma error: ${err.code}`,
          undefined,
          "UNMAPPED_PRISMA_ERROR",
        );
    }
  }
}
