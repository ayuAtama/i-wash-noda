// src/validations/workerStation.validation.ts
import { z } from "zod";
import "zod-openapi";

export class WorkerStationValidation {
  static reInputItemSchema = z
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

  static reInputItemBodySchema = z
    .object({
      items: z
        .array(WorkerStationValidation.reInputItemSchema)
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

  static reInputItemParamsSchema = z
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

  static reInputServiceStrategySchema = z.object({
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
    orderId: WorkerStationValidation.reInputItemParamsSchema.shape.orderId.meta(
      {
        description: "Order ID from params",
        example: "123e4567-e89b-12d3-a456-426614174000",
      },
    ),
    items: z.array(WorkerStationValidation.reInputItemSchema).meta({
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

  static reInputServiceMethodSchema = z.object({
    userId: z.uuid().meta({
      description: "User ID from access token",
      example: "123e4567-e89b-12d3-a456-426614174000",
    }),
    outletId: z.uuid().meta({
      description: "Outlet ID",
      example: "123e4567-e89b-12d3-a456-426614174000",
    }),
    orderId: WorkerStationValidation.reInputItemParamsSchema.shape.orderId.meta(
      {
        description: "Order ID from params",
        example: "123e4567-e89b-12d3-a456-426614174000",
      },
    ),
    items: z.array(WorkerStationValidation.reInputItemSchema).meta({
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

  static checkActiveJobsSchema = z.object({
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

  static checkAvailableJobsSchema = z.object({
    outlet_id: z.uuid().meta({
      description: "Outlet ID from middlewere",
      example: "123e4567-e89b-12d3-a456-426614174000",
    }),
    worker_station: z.enum(["washing", "ironing", "packing"]).meta({
      description: "Worker Station from middlewere",
      example: "washing",
    }),
  });

  static outletIDSchema = z.object({
    outlet_id: z.uuid().meta({
      description: "Outlet ID (UUID)",
      example: "123e4567-e89b-12d3-a456-426614174000",
    }),
  });

  static checkActiveJobsParamsSchema = z.object({
    workerId: z.uuid().meta({
      description: "Worker ID (UUID)",
      example: "123e4567-e89b-12d3-a456-426614174000",
    }),
    outletId: z.uuid().meta({
      description: "Outlet ID (UUID)",
      example: "123e4567-e89b-12d3-a456-426614174000",
    }),
  });

  static assignJobServiceStrategySchema = z.object({
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
    orderId: WorkerStationValidation.reInputItemParamsSchema.shape.orderId.meta(
      {
        description: "Order ID from params",
        example: "123e4567-e89b-12d3-a456-426614174000",
      },
    ),
  });

  static assignJobServiceMethodSchema = z.object({
    userId: z.uuid().meta({
      description: "User ID from access token",
      example: "123e4567-e89b-12d3-a456-426614174000",
    }),
    outletId: z.uuid().meta({
      description: "Outlet ID",
      example: "123e4567-e89b-12d3-a456-426614174000",
    }),
    orderId: WorkerStationValidation.reInputItemParamsSchema.shape.orderId.meta(
      {
        description: "Order ID from params",
        example: "123e4567-e89b-12d3-a456-426614174000",
      },
    ),
  });

  static markDoneServiceStrategySchema = z.object({
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
    orderId: WorkerStationValidation.reInputItemParamsSchema.shape.orderId.meta(
      {
        description: "Order ID from params",
        example: "123e4567-e89b-12d3-a456-426614174000",
      },
    ),
  });

  static markDoneServiceMethodSchema = z.object({
    userId: z.uuid().meta({
      description: "User ID from access token",
      example: "123e4567-e89b-12d3-a456-426614174000",
    }),
    outletId: z.uuid().meta({
      description: "Outlet ID",
      example: "123e4567-e89b-12d3-a456-426614174000",
    }),
    orderId: WorkerStationValidation.reInputItemParamsSchema.shape.orderId.meta(
      {
        description: "Order ID from params",
        example: "123e4567-e89b-12d3-a456-426614174000",
      },
    ),
  });

  static getCompleteJobsStrategySchema = z.object({
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

  static getCompleteJobsMethodSchema = z.object({
    outletId: z.uuid().meta({
      description: "Outlet ID",
      example: "123e4567-e89b-12d3-a456-426614174000",
    }),
    workerId: z.uuid().meta({
      description: "Worker ID from access token",
      example: "123e4567-e89b-12d3-a456-426614174000",
    }),
  });

  static assignJobParamsSchema =
    WorkerStationValidation.reInputItemParamsSchema;
  static markDoneParamsSchema = WorkerStationValidation.reInputItemParamsSchema;
}

export type ReInputItemBodyPayloadDTO = z.infer<
  typeof WorkerStationValidation.reInputItemBodySchema
>;
export type ReInputItemParamsPayloadDTO = z.infer<
  typeof WorkerStationValidation.reInputItemParamsSchema
>;
export type ReInputServiceStrategyPayloadDTO = z.infer<
  typeof WorkerStationValidation.reInputServiceStrategySchema
>;
export type ReInputServiceMethodPayloadDTO = z.infer<
  typeof WorkerStationValidation.reInputServiceStrategySchema
>;
export type CheckActiveJobsPayloadDTO = z.infer<
  typeof WorkerStationValidation.checkActiveJobsSchema
>;
export type CheckAvailableJobsPayloadDTO = z.infer<
  typeof WorkerStationValidation.checkAvailableJobsSchema
>;
export type OutletIDPayloadDTO = z.infer<
  typeof WorkerStationValidation.outletIDSchema
>;
export type checkActiveJobsStrategyDTO = z.infer<
  typeof WorkerStationValidation.checkActiveJobsParamsSchema
>;
export type AssigJobParamsDTO = z.infer<
  typeof WorkerStationValidation.assignJobParamsSchema
>;
export type AssignJobServiceStrategyDTO = z.infer<
  typeof WorkerStationValidation.assignJobServiceStrategySchema
>;
export type AssignJobServiceMethodDTO = z.infer<
  typeof WorkerStationValidation.assignJobServiceMethodSchema
>;
export type MarkDoneServiceStrategyDTO = z.infer<
  typeof WorkerStationValidation.markDoneServiceStrategySchema
>;
export type MarkDoneServiceMethodDTO = z.infer<
  typeof WorkerStationValidation.markDoneServiceMethodSchema
>;
export type MarkDoneParamsPayloadDTO = z.infer<
  typeof WorkerStationValidation.reInputItemParamsSchema
>;
export type GetCompleteJobsStrategyDTO = z.infer<
  typeof WorkerStationValidation.getCompleteJobsStrategySchema
>;
export type GetCompleteJobsMethodDTO = z.infer<
  typeof WorkerStationValidation.getCompleteJobsMethodSchema
>;
