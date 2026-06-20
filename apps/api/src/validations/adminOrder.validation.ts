// src/validations/adminOrder.validation.ts
import { z } from "zod";
import "zod-openapi";

export const CreateWalkInCustomerSchema = z.object({
  name: z.string().min(1, "Name is required").meta({
    description: "Name of the customer",
    example: "John Doe",
  }),
  phone: z
    .string()
    .regex(/^(?:\+62|62|0)8[1-9][0-9]{6,11}$/, "Invalid phone number")
    .meta({
      description: "Phone number of the customer",
      example: "+6281234567890 or 081234567890",
    }),
});

export const keywordWalkInCustomerSchema = z.object({
  keyword: z.string().min(1, "Keyword is required").meta({
    description: "Keyword to search for walk-in customers",
    example: "John or 081222222222",
  }),
});

export class WalkInCustomerValidation {
  static CreateWalkInCustomerSchema = CreateWalkInCustomerSchema;
  static keywordWalkInCustomerSchema = keywordWalkInCustomerSchema;
}
export type WalkInCustomerValidationDTO = z.infer<
  typeof WalkInCustomerValidation.CreateWalkInCustomerSchema
>;
export type KeywordWalkInCustomerSchmaDTO = z.infer<
  typeof WalkInCustomerValidation.keywordWalkInCustomerSchema
>;

export const ItemOrderSchema = z.object({
  id: z.uuid().meta({
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

export const AdminOrderParamsSchema = z
  .object({
    id: z.uuid().meta({
      description: "Order ID (UUID)",
      example: "123e4567-e89b-12d3-a456-426614174000",
    }),
  })
  .meta({
    id: "AdminOrderParams",
    description: "Payload for updating an order",
    example: {
      id: "123e4567-e89b-12d3-a456-426614174000",
    },
  });

export class AdminOrderValidation {
  static AdminOrderSchema = AdminOrderSchema;
  static AdminOrderParamsSchema = AdminOrderParamsSchema;
}
export type AdminOrderInputDTO = z.infer<typeof AdminOrderSchema>;
export type AdminOrderParamsSchemaDTO = z.infer<typeof AdminOrderParamsSchema>;
