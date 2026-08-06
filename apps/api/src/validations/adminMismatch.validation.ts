import { z } from "zod";
import { StationName } from "@/generated/prisma/enums";
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

  static QueryValidation = z
    .object({
      stationName: z.enum(StationName).optional().meta({
        description: "Filter by station name",
        example: "washing",
      }),
    })
    .meta({
      id: "MismatchFilterQuery",
      description: "Query params for filtering mismatches",
      example: {
        stationName: "washing",
      },
    });

  static DetailMismatchDataParams = z
    .object({
      orderId: z.uuid().meta({
        description: "Order ID (UUID)",
        example: "123e4567-e89b-12d3-a456-426614174000",
      }),
      stationName: z.enum(StationName).meta({
        description: "Station Name",
        example: "washing",
      }),
    })
    .meta({
      id: "DetailMismatchDataParams",
      description: "Path params for fetching detail mismatch data",
      example: {
        orderId: "123e4567-e89b-12d3-a456-426614174000",
        stationName: "washing",
      },
    });

  static OrderIdStationNameParams =
    AdminMismatchValidation.DetailMismatchDataParams;

  static ManageMismatchSchema = z
    .object({
      finalQuantities: z.array(
        z.object({
          itemId: z.uuid().meta({
            description: "Item ID (UUID)",
            example: "123e4567-e89b-12d3-a456-426614174000",
          }),
          latestQuantity: z.number().min(1).max(100).meta({
            description: "Latest quantity of the item",
            example: 10,
          }),
        }),
      ),
      itemDecisions: z.array(
        z.object({
          itemId: z.uuid().meta({
            description: "Item ID (UUID)",
            example: "123e4567-e89b-12d3-a456-426614174000",
          }),
          status: z.enum(["approved", "rejected"]).meta({
            description: "Status of the item",
            example: "approved",
          }),
          adminNote: z.string().optional().meta({
            description: "Admin note for the item",
            example: "Item is approved",
          }),
        }),
      ),
    })
    .meta({
      id: "ManageMismatch",
      description: "Payload for manage mismatch data (body)",
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
