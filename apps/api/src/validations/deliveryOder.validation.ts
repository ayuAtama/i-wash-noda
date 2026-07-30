import { z } from "zod";
import "zod-openapi";

export class DeliveryOrderValidation {
  static DeliveryIdParamsSchema = z
    .object({
      deliveryId: z.uuid().meta({
        description: "Delivery Request ID (UUID)",
        example: "123e4567-e89b-12d3-a456-426614174000",
      }),
    })
    .meta({
      id: "DeliveryIdParams",
      description: "Payload for updating or accepting a delivery request",
      example: {
        deliveryId: "123e4567-e89b-12d3-a456-426614174000",
      },
    });

  static UserIdSchema = z
    .uuid()
    .meta({
      description: "User ID (UUID)",
      example: "123e4567-e89b-12d3-a456-426614174000",
    })
    .meta({
      id: "UserId671",
      example: "123e4567-e89b-12d3-a456-426614174000",
    });

  static OutletIdSchema = z.uuid().meta({
    description: "Outlet ID (UUID)",
    example: "123e4567-e89b-12d3-a456-426614174000",
  });
}

export type DeliveryIdParamsDTO = z.infer<
  typeof DeliveryOrderValidation.DeliveryIdParamsSchema
>;
export type UserIdDTO = z.infer<typeof DeliveryOrderValidation.UserIdSchema>;
export type OutletIdDTO = z.infer<
  typeof DeliveryOrderValidation.OutletIdSchema
>;
