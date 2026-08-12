import { StationName } from "@/generated/prisma/enums";
import { z } from "zod";
import "zod-openapi";

export class AdminMismatchValidation {
  static OutletIdValidation = z
    .object({
      outletId: z.uuid().meta({
        description: "Outlet ID (UUID)",
        example: "123e4567-e89b-12d3-a456-426614174000",
      }),
    })
    .meta({
      id: "MismatchOutletId",
      description: "Outlet ID for mismatch context",
      example: {
        outletId: "123e4567-e89b-12d3-a456-426614174000",
      },
    });

  static StationNameValidation = z
    .object({
      stationName: z.enum(StationName).meta({
        description: "Station Name",
        example: "washing",
      }),
    })
    .meta({
      id: "MismatchStationName",
      description: "Station name for mismatch context",
      example: {
        stationName: "washing",
      },
    });

  static QueryValidation = z
    .object({
      stationName: z.enum(StationName).optional().meta({
        description: "Filter by station name",
        example: "washing",
      }),
    })
    .meta({
      id: "MismatchQuery",
      description: "Query params for filtering mismatches",
      example: {
        stationName: "washing",
      },
    });

  static ParamsValidation = z.object({
    id: z
      .uuid()
      .meta({
        description: "Order ID (UUID)",
        example: "123e4567-e89b-12d3-a456-426614174000",
      })
      .meta({
        id: "OrderId",
        description: "Payload for checking order id",
        example: {
          id: "123e4567-e89b-12d3-a456-426614174000",
        },
      }),
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

  static MismatchSchema = z
    .object({
      itemId: z
        .uuid()
        .meta({
          description: "Item ID (UUID)",
          example: "123e4567-e89b-12d3-a456-426614174000",
        })
        .meta({
          description: "Payload for checking item id",
          example: {
            itemId: "123e4567-e89b-12d3-a456-426614174000",
          },
        }),
      status: z
        .enum(["approved", "rejected"])
        .meta({
          description: "Status of the item",
          example: "approved",
        })
        .meta({
          description: "Payload for checking item status",
          example: {
            status: "approved",
          },
        }),
      adminNote: z
        .string()
        .optional()
        .meta({
          description: "Admin note for the item",
          example: "Item is approved",
        })
        .meta({
          description: "Payload for checking admin note",
          example: {
            adminNote: "Item is approved",
          },
        }),
    })
    .meta({
      description: "Payload for checking mismatch data",
      example: {
        itemId: "123e4567-e89b-12d3-a456-426614174000",
        status: "approved",
        adminNote: "Item is approved",
      },
    });

  static SummarySchema = z
    .object({
      itemId: z
        .uuid()
        .meta({
          description: "Item ID (UUID)",
          example: "123e4567-e89b-12d3-a456-426614174000",
        })
        .meta({
          description: "Payload for checking item id",
          example: {
            itemId: "123e4567-e89b-12d3-a456-426614174000",
          },
        }),
      latestQuantity: z.number().min(1).max(100).meta({
        description: "Latest quantity of the item",
        example: 10,
      }),
    })
    .meta({
      description: "Payload for checking summary data",
      example: {
        itemId: "123e4567-e89b-12d3-a456-426614174000",
        latestQuantity: 10,
      },
    });

  static ManageMismatchSchema = z
    .object({
      finalQuantities: z.array(AdminMismatchValidation.SummarySchema),
      itemDecisions: z.array(AdminMismatchValidation.MismatchSchema),
    })
    .meta({
      description: "Payload for manage mismatch data (body)",
      example: {
        finalQuantities: [
          {
            itemId: "123e4567-e89b-12d3-a456-426614174000",
            latestQuantity: 10,
          },
        ],
        itemDecisions: [
          {
            itemId: "123e4567-e89b-12d3-a456-426614174000",
            status: "approved",
            adminNote: "Item is approved",
          },
        ],
      },
    });

  static AdminIdSchema = z.object({
    adminId: z
      .uuid()
      .meta({
        description: "Admin ID (UUID)",
        example: "123e4567-e89b-12d3-a456-426614174000",
      })
      .meta({
        description: "Payload for checking admin id",
        example: {
          adminId: "123e4567-e89b-12d3-a456-426614174000",
        },
      }),
  });

  static OrderIdStationNameParams =
    AdminMismatchValidation.DetailMismatchDataParams;
}

export type QueryValidationDTO = z.infer<
  typeof AdminMismatchValidation.QueryValidation
>;
export type OutletIdValidationDTO = z.infer<
  typeof AdminMismatchValidation.OutletIdValidation
>;
export type StationNameValidationDTO = z.infer<
  typeof AdminMismatchValidation.StationNameValidation
>;
export type ParamsValidationDTO = z.infer<
  typeof AdminMismatchValidation.ParamsValidation
>;
export type DetailMismatchDataParamsDTO = z.infer<
  typeof AdminMismatchValidation.DetailMismatchDataParams
>;
export type ManageMismatchSchemaDTO = z.infer<
  typeof AdminMismatchValidation.ManageMismatchSchema
>;
export type OrderIdStationNameParamsDTO = z.infer<
  typeof AdminMismatchValidation.DetailMismatchDataParams
>;
export type AdminIdSchemaDTO = z.infer<
  typeof AdminMismatchValidation.AdminIdSchema
>;
export type MismatchSchemaDTO = z.infer<
  typeof AdminMismatchValidation.MismatchSchema
>;

export type FetchAllMismatchPayload = OutletIdValidationDTO &
  QueryValidationDTO;
export type FetchDetailMismatchPayload = OutletIdValidationDTO &
  DetailMismatchDataParamsDTO;
export type ManageMismatchPayload = ManageMismatchSchemaDTO &
  OrderIdStationNameParamsDTO &
  OutletIdValidationDTO &
  AdminIdSchemaDTO;

export type manageMismatchPayloadDTO = ManageMismatchPayload;
