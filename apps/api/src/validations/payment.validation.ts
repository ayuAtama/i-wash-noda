import { z } from "zod";
import "zod-openapi";

export class PaymentValidation {
  static OrderIdParamsSchema = z
    .object({
      id: z.uuid().meta({
        description: "Order ID (UUID)",
        example: "123e4567-e89b-12d3-a456-426614174000",
      }),
    })
    .meta({
      id: "PaymentOrderIdParams",
      description: "Params for payment operations",
    });

  static PaymentConfirmSchema = z
    .object({
      note: z.string().optional().meta({
        description: "Admin note for confirmation",
        example: "Payment verified via bank transfer",
      }),
    })
    .meta({
      id: "PaymentConfirm",
      description: "Admin confirms payment proof",
    });

  static PaymentRejectSchema = z
    .object({
      reason: z.string().min(1).meta({
        description: "Reason for rejecting payment proof",
        example: "Proof image is blurry, please resubmit",
      }),
    })
    .meta({
      id: "PaymentReject",
      description: "Admin rejects payment proof",
    });
}

export type OrderIdParamsDto = z.infer<
  typeof PaymentValidation.OrderIdParamsSchema
>;
export type PaymentConfirmDto = z.infer<
  typeof PaymentValidation.PaymentConfirmSchema
>;
export type PaymentRejectDto = z.infer<
  typeof PaymentValidation.PaymentRejectSchema
>;
