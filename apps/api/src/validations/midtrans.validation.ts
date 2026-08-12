import { Prisma } from "@/generated/prisma/client";
import { z } from "zod";
import "zod-openapi";

export class MidtransValidation {
  static MidtransNotificationSchema = z.object({
    signature_key: z.string(),
    order_id: z.string(),
    transaction_id: z.string(),
    gross_amount: z.string(),
    payment_type: z.string(),
    currency: z.string(),
    transaction_status: z.string(),
    status_code: z.string(),
    fraud_status: z.string(),
    transaction_time: z.string(),
    settlement_time: z.string().optional(),
    va_numbers: z
      .array(
        z.object({
          bank: z.string().optional(),
        }),
      )
      .optional(),
    bank: z.string().optional(),
    issuer: z.string().optional(),
    acquirer: z.string().optional(),
    custom_field1: z.string().optional(),
  });
}

export type ParsedMidtransNotification = z.infer<
  typeof MidtransValidation.MidtransNotificationSchema
>;
export type RawMidtransNotification = ParsedMidtransNotification &
  Prisma.JsonObject;
//export type RawMidtransNotification = Prisma.InputJsonObject;
