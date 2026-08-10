import { z } from "zod";
import "zod-openapi";

export class CustomerOrderValidation {
  static UserIdSchema = z
    .uuid()
    .meta({
      description: "User ID (UUID)",
      example: "123e4567-e89b-12d3-a456-426614174000",
    })
    .meta({
      id: "UserId67",
    });

  static OrderIdParamsSchema = z
    .object({
      orderId: z.uuid().meta({
        description: "Order ID (UUID)",
        example: "123e4567-e89b-12d3-a456-426614174000",
      }),
    })
    .meta({
      id: "OrderIdParams67",
      description: "Params needed to update payment proof",
      example: {
        orderId: "123e4567-e89b-12d3-a456-426614174000",
      },
    });

  static PaymentProofSchema = z
    .object({
      urlProof: z.string().meta({
        description: "Payment proof URL",
        example: "https://example.com/proof.jpg",
      }),
    })
    .meta({
      id: "PaymentProof",
      description: "Payload for uploading payment proof",
      example: {
        urlProof: "https://example.com/proof.jpg",
      },
    });

  static UserID = z
    .object({
      userId: z.uuid().meta({
        description: "User ID (UUID)",
        example: "123e4567-e89b-12d3-a456-426614174000",
      }),
    })
    .meta({
      id: "CustomerUserIdParam",
      description: "User ID path param",
      example: {
        userId: "123e4567-e89b-12d3-a456-426614174000",
      },
    });

  static ComplainSchema = z
    .object({
      complaintMessage: z.string().meta({
        description: "Complain",
        example:
          "Why the order is late? I want you to deliver it asap next time.",
      }),
      complaintImage: z.string().meta({
        description: "Complain Image URL",
        example: "https://example.com/complain.jpg",
      }),
    })
    .meta({
      id: "Complain",
      description: "Payload for complain",
      example: {
        complaintMessage:
          "Why the order is late? I want you to deliver it asap next time.",
        complaintImage: "https://example.com/complain.jpg",
      },
    });

  static PaymentMethod = z.object({
    paymentMethod: z.enum(["payment_gateway", "manual"]).meta({
      description: "Payment method",
      example: "midtrans",
    }),
  });

  static setPaymentMethodParams =
    CustomerOrderValidation.OrderIdParamsSchema.merge(
      CustomerOrderValidation.PaymentMethod,
    ).meta({
      id: "SetPaymentMethodParams",
      description: "Combined params for setting payment method",
    });
}

export type UserIdDTO = z.infer<typeof CustomerOrderValidation.UserIdSchema>;
export type OrderIdParamsDTO = z.infer<
  typeof CustomerOrderValidation.OrderIdParamsSchema
>;
export type PaymentProofDTO = z.infer<
  typeof CustomerOrderValidation.PaymentProofSchema
>;
export type UserIDDTO = z.infer<typeof CustomerOrderValidation.UserID>;
export type complainDTO = z.infer<
  typeof CustomerOrderValidation.ComplainSchema
>;
export type PaymentMethodDTO = z.infer<
  typeof CustomerOrderValidation.PaymentMethod
>;
export type SetPaymentMethodParamsDTO = z.infer<
  typeof CustomerOrderValidation.setPaymentMethodParams
>;

export type uploadPaymentDTO = UserIDDTO & OrderIdParamsDTO & PaymentProofDTO;
export type complainPayloadDTO = UserIDDTO & complainDTO & OrderIdParamsDTO;
export type markDoneDTO = UserIDDTO & OrderIdParamsDTO;
export type PayPaymentGatewayDTO = UserIDDTO & OrderIdParamsDTO;
export type CancelPaymentDTO = UserIDDTO & OrderIdParamsDTO;
export type SetPaymentMethodDTO = UserIDDTO &
  OrderIdParamsDTO &
  PaymentMethodDTO;
