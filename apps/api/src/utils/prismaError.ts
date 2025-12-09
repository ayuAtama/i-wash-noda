//src/utils/prismaError.ts
import { Prisma } from "@/generated/prisma/client";
import { HttpError } from "@/utils/httpError";

// Extract field name from Prisma message (fallback)
function extractField(
  err: Prisma.PrismaClientKnownRequestError
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
export function mapPrismaError(
  err: Prisma.PrismaClientKnownRequestError
): HttpError {
  switch (err.code) {
    // Unique constraint failed
    case "P2002":
      return new HttpError(
        409,
        "Duplicate field",
        extractField(err) ?? ["unknown"]
      );

    // Record not found
    case "P2025":
      return new HttpError(404, "Record not found");

    // Foreign key failed
    case "P2003":
      return new HttpError(
        409,
        "Foreign key constraint failed",
        extractField(err) ?? ["unknown"]
      );

    // Query interpretation error
    case "P2005":
      return new HttpError(
        400,
        "Invalid value for field",
        extractField(err) ?? ["unknown"]
      );

    // Required field is missing
    case "P2011":
      return new HttpError(
        400,
        "Required field missing",
        extractField(err) ?? ["unknown"]
      );

    // Null constraint failed
    case "P2019":
      return new HttpError(
        400,
        "Input violates null constraint",
        extractField(err) ?? ["unknown"]
      );

    // Value too long for column type
    case "P2000":
      return new HttpError(
        400,
        "Value is too long for field",
        extractField(err) ?? ["unknown"]
      );

    // Invalid value type
    case "P2006":
      return new HttpError(
        400,
        "Invalid value type",
        extractField(err) ?? ["unknown"]
      );

    // Record already exists (unique + upsert mismatch)
    case "P2010":
      return new HttpError(
        409,
        "Record already exists",
        extractField(err) ?? ["unknown"]
      );

    // Broken relation
    case "P2014":
      return new HttpError(409, "Failed to detach related record");

    // Operation timed out
    case "P2018":
      return new HttpError(503, "Database timeout");

    // Constraint name invalid
    case "P2021":
      return new HttpError(500, "Table or view does not exist");

    // Column does not exist
    case "P2022":
      return new HttpError(500, "Column does not exist");

    // Connection failure
    case "P2024":
      return new HttpError(503, "Database connection issue");

    // case "P2028":
    //   return new HttpError(
    //     400,
    //     "Invalid email address, please use your real email address."
    //   );

    default:
      return new HttpError(500, `Unmapped Prisma error: ${err.code}`);
  }
}
