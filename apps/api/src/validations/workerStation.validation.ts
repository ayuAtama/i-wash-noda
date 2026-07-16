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

export const ReInputItemBodySchema = z.object({
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

export class WorkerStationValidation {
  static reInputItemSchema = ReInputItemSchema;
  static reInputItemBodySchema = ReInputItemBodySchema;
  static reInputItemParamsSchema = ReInputItemParamsSchema;
  static reInputServiceStrategySchema = ReInputServiceStrategySchema;
}

export type ReInputItemBodyPayloadDTO = z.infer<typeof ReInputItemBodySchema>;
export type ReInputItemParamsPayloadDTO = z.infer<
  typeof ReInputItemParamsSchema
>;
export type ReInputServiceStrategyPayloadDTO = z.infer<
  typeof ReInputServiceStrategySchema
>;
export type ReInputServiceMethodPayloadDTO = z.infer<
  typeof ReInputServiceMethodSchema
>;
