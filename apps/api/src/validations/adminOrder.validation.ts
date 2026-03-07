// src/validations/adminOrder.validation.ts
import { z } from "zod";
import "zod-openapi";

export const ItemOrderSchema = z.object({
  id: z.string().uuid().meta({
    description: "Item ID (UUID)",
    example: "123e4567-e89b-12d3-a456-426614174000",
  }),
  quantity: z.number().min(1, "Quantity must be at least 1").meta({
    description: "Item quantity",
    example: 2,
  }),
});

export const AdminOrderSchema = z
  .object({
    total_kilos: z.number().min(1, "Total kilos must be at least 1").meta({
      description: "Total kilos of laundry",
      example: 5,
    }),
    items: z
      .array(ItemOrderSchema)
      .min(1, "At least one item must be inputted")
      .meta({
        description: "Array of items with quantities",
        example: [
          { id: "123e4567-e89b-12d3-a456-426614174000", quantity: 2 },
          { id: "123e4567-e89b-12d3-a456-426614174001", quantity: 3 },
        ],
      }),
  })
  .meta({
    id: "AdminOrder",
    description: "Payload for creating an order",
    example: {
      total_kilos: 5,
      items: [
        { id: "123e4567-e89b-12d3-a456-426614174000", quantity: 2 },
        { id: "123e4567-e89b-12d3-a456-426614174001", quantity: 3 },
      ],
    },
  });

export class AdminOrderValidation {
  static AdminOrderSchema = AdminOrderSchema;
}

export type AdminOrderInput = z.infer<typeof AdminOrderSchema>;
