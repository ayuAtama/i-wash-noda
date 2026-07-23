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

  static UserID = z.object({
    userId: z.uuid().meta({
      description: "User ID (UUID)",
      example: "123e4567-e89b-12d3-a456-426614174000",
    }),
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

export type uploadPaymentDTO = UserIDDTO & OrderIdParamsDTO & PaymentProofDTO;
