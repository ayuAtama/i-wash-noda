// src/validations/adminOrder.validation.ts
import { z } from "zod";

export const ItemOrderSchema = z.object({
  id: z.string(),
  quantity: z.number().min(1, "Quantity must be at least 1"),
});

export const AdminOrderSchema = z.object({
  total_kilos: z.number().min(1, "Total kilos must be at least 1"),
  items: z.array(ItemOrderSchema).min(1, "At least one item must be inputted"),
});

export type AdminOrderInput = z.infer<typeof AdminOrderSchema>;
