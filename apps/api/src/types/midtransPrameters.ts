import { z } from "zod";

export class MidtransParameter {
  static item_details = z.object({
    id: z.string(),
    price: z.number(),
    quantity: z.number(),
    name: z.string(),
  });
  static schema = z.object({
    transaction_details: z.object({
      order_id: z.string(),
      gross_amount: z.number(),
    }),
    expiry: z.object({
      start_time: z.iso.datetime(),
      unit: z.enum(["days", "hours", "minutes"]),
      duration: z.int(),
    }),
    item_details: z.array(MidtransParameter.item_details).optional(),
    customer_details: z
      .object({
        first_name: z.string().optional(),
        last_name: z.string().optional(),
        email: z.email().optional(),
        phone: z
          .string()
          .regex(/^(?:\+62|62|0)8[1-9][0-9]{6,11}$/, "Invalid phone number")
          .optional(),
        shipping_address: z
          .object({
            first_name: z.string().optional(),
            last_name: z.string().optional(),
            email: z.email().optional(),
            address: z.string().optional(),
            city: z.string().optional(),
          })
          .optional(),
      })
      .optional(),
    custom_field1: z.string().optional(),
  });

  static orderId = z.uuid();

  static isSignatureValid = z.object({
    order_id: z.string(),
    status_code: z.string(),
    gross_amount: z.string(),
    signature_key: z.string(),
  });
}

export type MidtransParameterType = z.infer<typeof MidtransParameter.schema>;
export type MidtransUUIDType = z.infer<typeof MidtransParameter.orderId>;
export type MidtransSignatureCheckType = z.infer<
  typeof MidtransParameter.isSignatureValid
>;
