import { z } from "zod";
import "zod-openapi";

export class PickupOrderValidation {
  static UpdateStatusSchema = z
    .object({
      status: z
        .enum([
          "PENDING",
          "ACCEPTED",
          "PICKED_UP",
          "IN_PROGRESS",
          "COMPLETED",
          "CANCELLED",
        ])
        .meta({
          description: "New status for the pickup request",
          example: "PICKED_UP",
        }),
    })
    .meta({
      id: "UpdateStatus",
      description: "Payload for updating pickup request status",
      example: {
        status: "PICKED_UP",
      },
    });
}

export type UpdateStatusDto = z.infer<
  typeof PickupOrderValidation.UpdateStatusSchema
>;
