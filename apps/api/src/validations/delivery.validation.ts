import { z } from "zod";
import "zod-openapi";

export class DeliveryValidation {
  static DeliveryIdParamsSchema = z
    .object({
      id: z.uuid().meta({
        description: "Delivery Request ID (UUID)",
        example: "123e4567-e89b-12d3-a456-426614174000",
      }),
    })
    .meta({
      id: "DeliveryIdParams",
      description: "Params for delivery request operations",
    });
}

export type DeliveryIdParamsDto = z.infer<
  typeof DeliveryValidation.DeliveryIdParamsSchema
>;
