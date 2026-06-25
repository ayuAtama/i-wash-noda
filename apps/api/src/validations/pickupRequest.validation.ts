import { z } from "zod";
import "zod-openapi";

export class PickupRequestValidation {
  static CreatePickupRequestSchema = z
    .object({
      addressId: z.uuid().meta({
        description: "UUID of the address",
        example: "123e4567-e89b-12d3-a456-426614174000",
      }),
      outletId: z.uuid().meta({
        description: "UUID of the outlet",
        example: "123e4567-e89b-12d3-a456-426614174001",
      }),
    })
    .meta({
      id: "CreatePickupRequest",
      description: "Payload for creating a pickup request",
      example: {
        addressId: "123e4567-e89b-12d3-a456-426614174000",
        outletId: "123e4567-e89b-12d3-a456-426614174001",
      },
    });

  static PickupRequestIdParamsSchema = z
    .object({
      id: z.uuid().meta({
        description: "UUID of the pickup request",
        example: "123e4567-e89b-12d3-a456-426614174000",
      }),
    })
    .meta({
      id: "PickupRequestIdParams",
      description: "Params for pickup request id",
      example: {
        id: "123e4567-e89b-12d3-a456-426614174000",
      },
    });
}

export type CreatePickupRequestDto = z.infer<
  typeof PickupRequestValidation.CreatePickupRequestSchema
>;
export type PickupRequestIdParamsDto = z.infer<
  typeof PickupRequestValidation.PickupRequestIdParamsSchema
>;
