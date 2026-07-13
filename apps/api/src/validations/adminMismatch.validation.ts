import { z } from "zod";
import "zod-openapi";

const StationFilterEnum = z.enum(["washing", "ironing", "packing"]).meta({
  description: "Station to filter mismatches by",
  example: "washing",
});

export class AdminMismatchValidation {
  static MismatchIdParamsSchema = z
    .object({
      id: z.uuid().meta({
        description: "Mismatch log ID (UUID)",
        example: "123e4567-e89b-12d3-a456-426614174000",
      }),
    })
    .meta({
      id: "MismatchIdParams",
      description: "Params for mismatch approve/reject",
    });

  static MismatchQuerySchema = z
    .object({
      station: StationFilterEnum.optional(),
    })
    .meta({
      id: "MismatchQuery",
      description: "Query for filtering mismatches by station",
    });

  static ApproveMismatchSchema = z
    .object({
      acceptedQuantity: z.number().int().min(0).meta({
        description: "The accepted quantity for this item",
        example: 5,
      }),
    })
    .meta({
      id: "ApproveMismatch",
      description: "Approve a mismatched item with admin-accepted quantity",
    });

  static RejectMismatchSchema = z
    .object({
      note: z.string().min(1).meta({
        description: "Reason for rejection",
        example: "Quantity does not match physical count",
      }),
    })
    .meta({
      id: "RejectMismatch",
      description: "Reject a mismatched item",
    });
}

export type MismatchIdParamsDto = z.infer<
  typeof AdminMismatchValidation.MismatchIdParamsSchema
>;
export type MismatchQueryDto = z.infer<
  typeof AdminMismatchValidation.MismatchQuerySchema
>;
export type ApproveMismatchDto = z.infer<
  typeof AdminMismatchValidation.ApproveMismatchSchema
>;
export type RejectMismatchDto = z.infer<
  typeof AdminMismatchValidation.RejectMismatchSchema
>;
