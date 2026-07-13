import { z } from "zod";
import "zod-openapi";

export const OrderIdParamsSchema = z
  .object({
    orderId: z.uuid().meta({
      description: "Order ID (UUID)",
      example: "123e4567-e89b-12d3-a456-426614174000",
    }),
  })
  .meta({
    id: "OrderIdParams",
    description: "Path parameters for order operations",
  });

export const AcceptOrderSchema = z
  .object({
    items: z
      .array(
        z.object({
          itemId: z.uuid(),
          quantity: z.number().min(1),
        })
      )
      .min(1, "At least one item is required")
      .meta({
        description: "List of inputted item quantities by the worker",
      }),
  })
  .meta({
    id: "AcceptOrder",
    description: "Payload for accepting an order and inputting items",
  });

export const FetchWorkerOrdersSchema = z
  .object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(10),
  })
  .meta({
    id: "FetchWorkerOrders",
    description: "Query parameters for fetching worker orders",
  });

export class WorkerOrderValidation {
  static OrderIdParamsSchema = OrderIdParamsSchema;
  static AcceptOrderSchema = AcceptOrderSchema;
  static FetchWorkerOrdersSchema = FetchWorkerOrdersSchema;
}

export type OrderIdParamsDTO = z.infer<typeof OrderIdParamsSchema>;
export type AcceptOrderInputDTO = z.infer<typeof AcceptOrderSchema>;
export type FetchWorkerOrdersDTO = z.infer<typeof FetchWorkerOrdersSchema>;
