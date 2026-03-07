import { z } from "zod";
import "zod-openapi";

export class PickupRequestValidation {
  static CreatePickupRequestSchema = z
    .object({
      addressId: z.string().uuid().meta({
        description: "UUID of the address",
        example: "123e4567-e89b-12d3-a456-426614174000",
      }),
      outletId: z.string().uuid().meta({
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
}

export type CreatePickupRequestDto = z.infer<
  typeof PickupRequestValidation.CreatePickupRequestSchema
>;
