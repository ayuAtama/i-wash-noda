// src/validations/workerStation.validation.ts
import { z } from "zod";
import "zod-openapi";

export const ReInputItemSchema = z
  .object({
    itemId: z.uuid().meta({
      description: "Item ID",
      example: "123e4567-e89b-12d3-a456-426614174000",
    }),
    itemQuantity: z.number().min(1).max(100).meta({
      description: "Item Quantity",
      example: 10,
    }),
  })
  .meta({
    id: "ReInputItem",
    description: "Payload for re-input item",
    example: {
      itemId: "123e4567-e89b-12d3-a456-426614174000",
      itemQuantity: 10,
    },
  });

export const ReInputItemBodySchema = z
  .object({
    items: z
      .array(ReInputItemSchema)
      .min(1, "At least one item must be inputted")
      .meta({
        id: "ReInputItemBody",
        description: "Payload of body for re-input item",
        example: [
          {
            itemId: "123e4567-e89b-12d3-a456-426614174000",
            itemQuantity: 10,
          },
          {
            itemId: "123e4567-e89b-12d3-a456-426614174001",
            itemQuantity: 5,
          },
        ],
      }),
  })
  .meta({
    id: "ReInputItemBodyWrapper",
    description: "Body payload for re-inputting item quantities",
    example: {
      items: [
        {
          itemId: "123e4567-e89b-12d3-a456-426614174000",
          itemQuantity: 10,
        },
      ],
    },
  });

export const ReInputItemParamsSchema = z
  .object({
    orderId: z.uuid().meta({
      description: "Order ID",
      example: "123e4567-e89b-12d3-a456-426614174000",
    }),
  })
  .meta({
    id: "ReInputItemParams",
    description: "Params for re-input item",
    example: {
      orderId: "123e4567-e89b-12d3-a456-426614174000",
    },
  });

export const ReInputServiceStrategySchema = z.object({
  userId: z.uuid().meta({
    description: "User ID from access token",
    example: "123e4567-e89b-12d3-a456-426614174000",
  }),
  outletId: z.uuid().meta({
    description: "Outlet ID",
    example: "123e4567-e89b-12d3-a456-426614174000",
  }),
  workerStation: z.enum(["washing", "ironing", "packing"]).meta({
    description: "Worker Station from middleware",
    example: "washing",
  }),
  orderId: ReInputItemParamsSchema.shape.orderId.meta({
    description: "Order ID from params",
    example: "123e4567-e89b-12d3-a456-426614174000",
  }),
  items: z.array(ReInputItemSchema).meta({
    description: "Items payload on body",
    example: [
      {
        itemId: "123e4567-e89b-12d3-a456-426614174000",
        itemQuantity: 10,
      },
      {
        itemId: "123e4567-e89b-12d3-a456-426614174001",
        itemQuantity: 5,
      },
    ],
  }),
});

export const ReInputServiceMethodSchema = z.object({
  userId: z.uuid().meta({
    description: "User ID from access token",
    example: "123e4567-e89b-12d3-a456-426614174000",
  }),
  outletId: z.uuid().meta({
    description: "Outlet ID",
    example: "123e4567-e89b-12d3-a456-426614174000",
  }),
  orderId: ReInputItemParamsSchema.shape.orderId.meta({
    description: "Order ID from params",
    example: "123e4567-e89b-12d3-a456-426614174000",
  }),
  items: z.array(ReInputItemSchema).meta({
    description: "Items payload on body",
    example: [
      {
        itemId: "123e4567-e89b-12d3-a456-426614174000",
        itemQuantity: 10,
      },
      {
        itemId: "123e4567-e89b-12d3-a456-426614174001",
        itemQuantity: 5,
      },
    ],
  }),
});

export const CheckActiveJobsSchema = z.object({
  outlet_id: z.uuid().meta({
    description: "Outlet ID from middlewere",
    example: "123e4567-e89b-12d3-a456-426614174000",
  }),
  worker_id: z.uuid().meta({
    description: "Worker ID from middlewere (cookies)",
    example: "123e4567-e89b-12d3-a456-426614174000",
  }),
  worker_station: z.enum(["washing", "ironing", "packing"]).meta({
    description: "Worker Station from middlewere",
    example: "washing",
  }),
});

export const CheckAvailableJobsSchema = z.object({
  outlet_id: z.uuid().meta({
    description: "Outlet ID from middlewere",
    example: "123e4567-e89b-12d3-a456-426614174000",
  }),
  worker_station: z.enum(["washing", "ironing", "packing"]).meta({
    description: "Worker Station from middlewere",
    example: "washing",
  }),
});

export const OutletIDSchema = z.object({
  outlet_id: z.uuid().meta({
    description: "Outlet ID (UUID)",
    example: "123e4567-e89b-12d3-a456-426614174000",
  }),
});

export const checkActiveJobsSchema = z.object({
  workerId: z.uuid().meta({
    description: "Worker ID (UUID)",
    example: "123e4567-e89b-12d3-a456-426614174000",
  }),
  outletId: z.uuid().meta({
    description: "Outlet ID (UUID)",
    example: "123e4567-e89b-12d3-a456-426614174000",
  }),
});

export const AssignJobServiceStrategySchema = z.object({
  userId: z.uuid().meta({
    description: "User ID from access token",
    example: "123e4567-e89b-12d3-a456-426614174000",
  }),
  outletId: z.uuid().meta({
    description: "Outlet ID",
    example: "123e4567-e89b-12d3-a456-426614174000",
  }),
  workerStation: z.enum(["washing", "ironing", "packing"]).meta({
    description: "Worker Station from middleware",
    example: "washing",
  }),
  orderId: ReInputItemParamsSchema.shape.orderId.meta({
    description: "Order ID from params",
    example: "123e4567-e89b-12d3-a456-426614174000",
  }),
});

export const AssignJobServiceMethodSchema = z.object({
  userId: z.uuid().meta({
    description: "User ID from access token",
    example: "123e4567-e89b-12d3-a456-426614174000",
  }),
  outletId: z.uuid().meta({
    description: "Outlet ID",
    example: "123e4567-e89b-12d3-a456-426614174000",
  }),
  orderId: ReInputItemParamsSchema.shape.orderId.meta({
    description: "Order ID from params",
    example: "123e4567-e89b-12d3-a456-426614174000",
  }),
});

export const MarkDoneServiceStrategySchema = z.object({
  userId: z.uuid().meta({
    description: "User ID from access token",
    example: "123e4567-e89b-12d3-a456-426614174000",
  }),
  outletId: z.uuid().meta({
    description: "Outlet ID",
    example: "123e4567-e89b-12d3-a456-426614174000",
  }),
  workerStation: z.enum(["washing", "ironing", "packing"]).meta({
    description: "Worker Station from middleware",
    example: "washing",
  }),
  orderId: ReInputItemParamsSchema.shape.orderId.meta({
    description: "Order ID from params",
    example: "123e4567-e89b-12d3-a456-426614174000",
  }),
});

export const MarkDoneServiceMethodSchema = z.object({
  userId: z.uuid().meta({
    description: "User ID from access token",
    example: "123e4567-e89b-12d3-a456-426614174000",
  }),
  outletId: z.uuid().meta({
    description: "Outlet ID",
    example: "123e4567-e89b-12d3-a456-426614174000",
  }),
  orderId: ReInputItemParamsSchema.shape.orderId.meta({
    description: "Order ID from params",
    example: "123e4567-e89b-12d3-a456-426614174000",
  }),
});

export const GetCompleteJobsStrategySchema = z.object({
  outletId: z.uuid().meta({
    description: "Outlet ID from middleware",
    example: "123e4567-e89b-12d3-a456-426614174000",
  }),
  workerId: z.uuid().meta({
    description: "Worker ID from access token",
    example: "123e4567-e89b-12d3-a456-426614174000",
  }),
  workerStation: z.enum(["washing", "ironing", "packing"]).meta({
    description: "Worker Station from middleware",
    example: "washing",
  }),
});

export const GetCompleteJobsMethodSchema = z.object({
  outletId: z.uuid().meta({
    description: "Outlet ID",
    example: "123e4567-e89b-12d3-a456-426614174000",
  }),
  workerId: z.uuid().meta({
    description: "Worker ID from access token",
    example: "123e4567-e89b-12d3-a456-426614174000",
  }),
});

export class WorkerStationValidation {
  static reInputItemSchema = ReInputItemSchema;
  static reInputItemBodySchema = ReInputItemBodySchema;
  static reInputItemParamsSchema = ReInputItemParamsSchema;
  static reInputServiceStrategySchema = ReInputServiceStrategySchema;
  static assignJobServiceStrategySchema = AssignJobServiceStrategySchema;
  static assignJobServiceMethodSchema = AssignJobServiceMethodSchema;
  static markDoneServiceStrategySchema = MarkDoneServiceStrategySchema;
  static markDoneServiceMethodSchema = MarkDoneServiceMethodSchema;
  static assignJobParamsSchema = ReInputItemParamsSchema;
  static markDoneParamsSchema = ReInputItemParamsSchema;
  static getCompleteJobsStrategySchema = GetCompleteJobsStrategySchema;
  static getCompleteJobsMethodSchema = GetCompleteJobsMethodSchema;
}

export type ReInputItemBodyPayloadDTO = z.infer<typeof ReInputItemBodySchema>;
export type ReInputItemParamsPayloadDTO = z.infer<
  typeof ReInputItemParamsSchema
>;
export type ReInputServiceStrategyPayloadDTO = z.infer<
  typeof ReInputServiceStrategySchema
>;
export type ReInputServiceMethodPayloadDTO = z.infer<
  typeof ReInputServiceStrategySchema
>;
export type CheckActiveJobsPayloadDTO = z.infer<typeof CheckActiveJobsSchema>;
export type CheckAvailableJobsPayloadDTO = z.infer<
  typeof CheckAvailableJobsSchema
>;
export type OutletIDPayloadDTO = z.infer<typeof OutletIDSchema>;
export type checkActiveJobsStrategyDTO = z.infer<typeof checkActiveJobsSchema>;
export type AssigJobParamsDTO = z.infer<
  typeof WorkerStationValidation.assignJobParamsSchema
>;
export type AssignJobServiceStrategyDTO = z.infer<
  typeof AssignJobServiceStrategySchema
>;
export type AssignJobServiceMethodDTO = z.infer<
  typeof AssignJobServiceMethodSchema
>;
export type MarkDoneServiceStrategyDTO = z.infer<
  typeof MarkDoneServiceStrategySchema
>;
export type MarkDoneServiceMethodDTO = z.infer<
  typeof MarkDoneServiceMethodSchema
>;
export type MarkDoneParamsPayloadDTO = z.infer<typeof ReInputItemParamsSchema>;
export type GetCompleteJobsStrategyDTO = z.infer<
  typeof GetCompleteJobsStrategySchema
>;
export type GetCompleteJobsMethodDTO = z.infer<
  typeof GetCompleteJobsMethodSchema
>;
