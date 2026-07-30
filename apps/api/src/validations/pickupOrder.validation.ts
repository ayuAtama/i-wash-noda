import { z } from "zod";
import "zod-openapi";

export class PickupOrderValidation {
  static UpdateStatusSchema = z
    .object({
      status: z.enum(["in_transit", "on_delivery", "done"]).meta({
        description: "New status for the pickup request",
        example: "in_transit",
      }),
    })
    .meta({
      id: "UpdateStatus",
      description: "Payload for updating pickup request status",
      example: {
        status: "done",
      },
    });

  static PickupIdParamsSchema = z
    .object({
      id: z.uuid().meta({
        description: "Pickup Request ID (UUID)",
        example: "123e4567-e89b-12d3-a456-426614174000",
      }),
    })
    .meta({
      id: "PickupIdParams",
      description: "Payload for updating or accepting a pickup request",
      example: {
        id: "123e4567-e89b-12d3-a456-426614174000",
      },
    });

  static OutletIdSchema = z
    .uuid()
    .meta({
      description: "Outlet ID (UUID)",
      example: "123e4567-e89b-12d3-a456-426614174000",
    })
    .meta({
      id: "OutletId",
    });

  static UserIdSchema = z
    .uuid()
    .meta({
      description: "User ID (UUID)",
      example: "123e4567-e89b-12d3-a456-426614174000",
    })
    .meta({
      id: "UserId",
    });
}

export type UpdateStatusDto = z.infer<
  typeof PickupOrderValidation.UpdateStatusSchema
>;
export type PickupIdParamsDto = z.infer<
  typeof PickupOrderValidation.PickupIdParamsSchema
>;
export type OutletIdDto = z.infer<typeof PickupOrderValidation.OutletIdSchema>;
export type UserIdDto = z.infer<typeof PickupOrderValidation.UserIdSchema>;
