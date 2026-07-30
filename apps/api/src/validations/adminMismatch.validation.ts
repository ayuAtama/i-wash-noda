import { StationName } from "@/generated/prisma/enums";
import { z } from "zod";
import "zod-openapi";

export const OutletIdValidation = z
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

export const StationNameValidation = z
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

export const QueryValidation = z
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

export const ParamsValidation = z.object({
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

export const DetailMismatchDataParams = z
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

export const MismatchSchema = z
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

export const SummarySchema = z
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

export const ManageMismatchSchema = z
  .object({
    finalQuantities: z.array(SummarySchema),
    itemDecisions: z.array(MismatchSchema),
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

export const AdminIdSchema = z.object({
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

export class AdminMismatchValidation {
  static OutletIdValidation = OutletIdValidation;
  static StationNameValidation = StationNameValidation;
  static QueryValidation = QueryValidation;
  static ParamsValidation = ParamsValidation;
  static DetailMismatchDataParams = DetailMismatchDataParams;
  static ManageMismatchSchema = ManageMismatchSchema;
  static OrderIdStationNameParams = DetailMismatchDataParams;
}

export type QueryValidationDTO = z.infer<typeof QueryValidation>;
export type OutletIdValidationDTO = z.infer<typeof OutletIdValidation>;
export type StationNameValidationDTO = z.infer<typeof StationNameValidation>;
export type ParamsValidationDTO = z.infer<typeof ParamsValidation>;
export type DetailMismatchDataParamsDTO = z.infer<
  typeof DetailMismatchDataParams
>;
export type ManageMismatchSchemaDTO = z.infer<typeof ManageMismatchSchema>;
export type OrderIdStationNameParamsDTO = z.infer<
  typeof DetailMismatchDataParams
>;
export type AdminIdSchemaDTO = z.infer<typeof AdminIdSchema>;
export type MismatchSchemaDTO = z.infer<typeof MismatchSchema>;

export type FetchAllMismatchPayload = OutletIdValidationDTO &
  QueryValidationDTO;
export type FetchDetailMismatchPayload = OutletIdValidationDTO &
  DetailMismatchDataParamsDTO;
export type ManageMismatchPayload = ManageMismatchSchemaDTO &
  OrderIdStationNameParamsDTO &
  OutletIdValidationDTO &
  AdminIdSchemaDTO;

export type manageMismatchPayloadDTO = ManageMismatchPayload;
