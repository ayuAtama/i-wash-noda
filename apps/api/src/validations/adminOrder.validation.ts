// src/validations/adminOrder.validation.ts
import { z } from "zod";
import "zod-openapi";

export const CreateWalkInCustomerSchema = z
  .object({
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
  })
  .meta({
    id: "CreateWalkInCustomer",
    description: "Payload for creating a walk-in customer",
    example: {
      name: "John Doe",
      phone: "+6281234567890",
    },
  });

export const keywordWalkInCustomerSchema = z
  .object({
    keyword: z.string().min(1, "Keyword is required").meta({
      description: "Keyword to search for walk-in customers",
      example: "John or 081222222222",
    }),
  })
  .meta({
    id: "KeywordWalkInCustomer",
    description: "Query params for searching walk-in customers",
    example: {
      keyword: "John",
    },
  });

export const outletIDSchema = z.object({
  outlet_id: z.uuid().meta({
    description: "Outlet ID (UUID)",
    example: "123e4567-e89b-12d3-a456-426614174000",
  }),
});

export const adminIDSchema = z.object({
  admin_id: z.uuid().meta({
    description: "Admin ID (UUID)",
    example: "123e4567-e89b-12d3-a456-426614174000",
  }),
});

export const UpdateWalkInCustomerSchema = z
  .object({
    name: z.string().min(1, "Name is required").optional().meta({
      description: "Name of the customer",
      example: "John Doe",
    }),
    phone: z
      .string()
      .regex(/^(?:\+62|62|0)8[1-9][0-9]{6,11}$/, "Invalid phone number")
      .optional()
      .meta({
        description: "Phone number of the customer",
        example: "+6281234567890 or 081234567890",
      }),
  })
  .meta({
    id: "UpdateWalkInCustomer",
    description:
      "Payload for updating a walk-in customer (at least one field required)",
    example: {
      name: "John Updated",
    },
  })
  .refine((data) => !!data.name || !!data.phone, {
    message:
      "Either name or phone is required and what the you update without a data?",
    // path: ["name"], // or ["phone"], or omit to make it a form-level error
  });

export const IDParamSchema = z
  .object({
    id: z.uuid().meta({
      description: "Walk-in Customer ID (UUID)",
      example: "123e4567-e89b-12d3-a456-426614174000",
    }),
  })
  .meta({
    id: "WalkInCustomerIdParam",
    description: "Path params for walk-in customer ID",
    example: {
      id: "123e4567-e89b-12d3-a456-426614174000",
    },
  });

export class UpdateWalkInCustomerValidation {
  static UpdateWalkInCustomerSchema = UpdateWalkInCustomerSchema;
  static IDParamSchema = IDParamSchema;
}
export type UpdateWalkInCustomerValidationDTO = z.infer<
  typeof UpdateWalkInCustomerValidation.UpdateWalkInCustomerSchema
>;
export type IDParamSchemaDTO = z.infer<
  typeof UpdateWalkInCustomerValidation.IDParamSchema
>;
export type UpdatePayloadDTO = UpdateWalkInCustomerValidationDTO &
  IDParamSchemaDTO &
  outletIDSchemaDTO;

export type DeletePayloadDTO = IDParamSchemaDTO & outletIDSchemaDTO;

export class WalkInCustomerValidation {
  static CreateWalkInCustomerSchema = CreateWalkInCustomerSchema;
  static keywordWalkInCustomerSchema = keywordWalkInCustomerSchema;
}
export type WalkInCustomerValidationDTO = z.infer<
  typeof WalkInCustomerValidation.CreateWalkInCustomerSchema
>;

export type adminIDSchemaDTO = z.infer<typeof adminIDSchema>;
export type outletIDSchemaDTO = z.infer<typeof outletIDSchema>;

export type WalkInCustomerPayloadDTO = WalkInCustomerValidationDTO &
  outletIDSchemaDTO &
  adminIDSchemaDTO;

export type CheckWalkInCustomerValidationDTO = KeywordWalkInCustomerSchmaDTO &
  outletIDSchemaDTO;

export type KeywordWalkInCustomerSchmaDTO = z.infer<
  typeof WalkInCustomerValidation.keywordWalkInCustomerSchema
>;

export const ItemOrderSchema = z
  .object({
    id: z.uuid().optional().meta({
      description:
        "Item ID (UUID), it's opional because it will be auto generated if not exist",
      example: "123e4567-e89b-12d3-a456-426614174000",
    }),
    name: z.string().optional().meta({
      description:
        "Item name, it's opional because it will be auto generated if not exist",
      example: "Jaket Hoodie",
    }),
    quantity: z.number().min(1, "Quantity must be at least 1").meta({
      description: "Item quantity",
      example: 2,
    }),
  })
  .meta({
    id: "ItemOrder",
    description: "Item order line (provide either id or name, not both)",
    example: {
      id: "123e4567-e89b-12d3-a456-426614174000",
      quantity: 2,
    },
  })
  .refine(({ id, name }) => (id ? 1 : 0) + (name ? 1 : 0) === 1, {
    error: "Please only provide exactly one of id or name for the items",
  });

/////////////////////////////////////////////////////
//                AdminOrderSchema                 //
////////////////////////////////////////////////////
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

///////////////////////////////////////////////
// Manual order by admin (walk-in customer) //
//////////////////////////////////////////////

import { OrderSource, OrderStatus } from "@/generated/prisma/enums";

export class ManualOrderValidation {
  static CreateManualOrderSchema = z
    .object({
      pickup_fee: z
        .literal(0, { error: "Are you a hacker or some sort?" })
        .meta({
          description:
            "Pickup fee for the order 0 because the customer is a walk-in customer",
        }),
      delivery_fee: z.literal(0, "Are you a hacker or some sort?").meta({
        description:
          "Delivery fee for the order 0 because the customer is a walk-in customer",
      }),
      laundry_price: z.literal(0, "Are you a hacker or some sort?").meta({
        description:
          "Laundry price for the order 0 because we don't do calculate in client side",
      }),
      total_amount: z.literal(0, "Are you a hacker or some sort?").meta({
        description:
          "Total amount for the order 0 because we don't do calculate in client side",
      }),
      total_kilo: z.number().min(1, "Total kilos must be at least 1 Kg").meta({
        description: "Total kilos of laundry",
        example: 5,
      }),
      status: z
        .literal(
          OrderStatus.arrived_at_outlet,
          "Are you a hacker or some sort?",
        )
        .meta({
          description: "Order status",
          example: "arrived_at_outlet",
        }),
      paid: z.boolean().meta({
        description:
          "Indicates if the order is paid or not, because the customer is a walk-in customer",
        example: true,
      }),
      source: z.literal(OrderSource.walk_in).meta({
        description: "Order source",
        example: "walkin donut",
      }),
      items: z
        .array(ItemOrderSchema)
        .min(1, "At least one item must be inputted")
        .meta({
          description: "Array of items with quantities",
          example: [
            { id: "123e4567-e89b-12d3-a456-426614174000", quantity: 2 },
            { id: "123e4567-e89b-12d3-a456-426614174001", quantity: 3 },
            { name: "Jaket Hoodie", quantity: 1 },
          ],
        }),
    })
    .meta({
      id: "CreateManualOrder",
      description: "Payload for creating a manual order",
      example: {
        outlet_id: "123e4567-e89b-12d3-a456-426614174000",
        total_kilo: 5,
        status: "arrived_at_outlet",
        paid: true,
        source: "walk_in",
        items: [
          { id: "123e4567-e89b-12d3-a456-426614174000", quantity: 2 },
          { id: "123e4567-e89b-12d3-a456-426614174001", quantity: 3 },
          { name: "Jaket Hoodie", quantity: 1 },
        ],
        pickup_fee: 0,
        total_amount: 0,
        delivery_fee: 0,
        laundry_price: 0,
      },
    });

  static OutletIdParamsSchema = z
    .object({
      outlet_id: z.uuid().meta({
        description: "Outlet ID (UUID)",
        example: "123e4567-e89b-12d3-a456-426614174000",
      }),
    })
    .meta({
      id: "OutletIdParams",
      description: "Payload for verifying an outlet",
      example: {
        outlet_id: "123e4567-e89b-12d3-a456-426614174000",
      },
    });

  static WalkInCustomerIdParamsSchema = z
    .object({
      id: z.uuid().meta({
        description: "Walk-in customer ID (UUID)",
        example: "123e4567-e89b-12d3-a456-426614174000",
      }),
    })
    .meta({
      id: "WalkInCustomerIdParams",
      description: "Payload for verifying an outlet",
      example: {
        id: "123e4567-e89b-12d3-a456-426614174000",
      },
    });
}

export type ManualOrderInputDTO = z.infer<
  typeof ManualOrderValidation.CreateManualOrderSchema
>;

export type OutletIdParamsSchemaDTO = z.infer<
  typeof ManualOrderValidation.OutletIdParamsSchema
>;
export type WalkInCustomerIdParamsSchemaDTO = z.infer<
  typeof ManualOrderValidation.WalkInCustomerIdParamsSchema
>;
export type ManualOrderPayloadValidationDTO = ManualOrderInputDTO &
  OutletIdParamsSchemaDTO &
  WalkInCustomerIdParamsSchemaDTO;

////////////////////////////////////////////////////
// Update Order Item for Order Arrived at Outlet //
//////////////////////////////////////////////////

export class UpdateOrderItemValidation {
  static UpdateOrderItemSchema = z
    .object({
      totalWeights: z.number().min(1, "Total kilos must be at least 1").meta({
        description:
          "Total kilos of laundry (recalculates laundry_price and total_amount)",
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
            { name: "Jaket Hoodie", quantity: 1 },
          ],
        }),
    })
    .meta({
      id: "UpdateOrderItem",
      description: "Payload for updating an order item",
      example: {
        totalWeights: 5,
        items: [
          { id: "123e4567-e89b-12d3-a456-426614174000", quantity: 2 },
          { id: "123e4567-e89b-12d3-a456-426614174001", quantity: 3 },
          { name: "Jaket Hoodie", quantity: 1 },
        ],
      },
    });

  static OrderIdParamsSchema = z
    .object({
      orderId: z.uuid().meta({
        description: "Order ID (UUID)",
        example: "123e4567-e89b-12d3-a456-426614174000",
      }),
    })
    .meta({
      id: "AdminOrderIdParams",
      description: "Payload for verifying an outlet",
      example: {
        orderId: "123e4567-e89b-12d3-a456-426614174000",
      },
    });
}

export type UpdateOrderItemInputDTO = z.infer<
  typeof UpdateOrderItemValidation.UpdateOrderItemSchema
>;
export type UpdateOrderItemPayloadValidationDTO = UpdateOrderItemInputDTO &
  OrderIdParamsSchemaDTO &
  OutletIdParamsSchemaDTO;

export type OrderIdParamsSchemaDTO = z.infer<
  typeof UpdateOrderItemValidation.OrderIdParamsSchema
>;

///////////////////////////////////////////////
// ACC/REJ Payment Order by outlet_admin     //
//////////////////////////////////////////////

import { PaymentProofStatus } from "@/generated/prisma/enums";

export class PaymentOrderValidation {
  static ActionOfPaymentProofSchema = z
    .object({
      outlet_id: z.uuid().meta({
        description: "Outlet ID (UUID)",
        example: "123e4567-e89b-12d3-a456-426614174000",
      }),
      id: z.uuid().meta({
        description: "Payment proof ID (UUID)",
        example: "123e4567-e89b-12d3-a456-426614174000",
      }),
      action: z.enum(PaymentProofStatus).meta({
        description: "Payment proof status",
        example: "approved",
      }),
    })
    .meta({
      id: "ActionOfPaymentProof",
      description: "Payload for verifying an outlet",
      example: {
        outlet_id: "123e4567-e89b-12d3-a456-426614174000",
        id: "123e4567-e89b-12d3-a456-426614174000",
        action: "approved",
      },
    });

  static PaymentActionParamsSchema = z
    .object({
      id: z.uuid().meta({
        description: "Payment proof ID (UUID)",
        example: "123e4567-e89b-12d3-a456-426614174000",
      }),
      action: z.enum(PaymentProofStatus).meta({
        description: "Payment proof status",
        example: "approved",
      }),
    })
    .meta({
      id: "PaymentActionParams",
      description: "Payload for verifying an outlet",
      example: {
        id: "123e4567-e89b-12d3-a456-426614174000",
        action: "approved",
      },
    });
}

export type ActionOfPaymentProofValidationDTO = z.infer<
  typeof PaymentOrderValidation.ActionOfPaymentProofSchema
>;
export type PaymentParamsDTO = z.infer<
  typeof PaymentOrderValidation.PaymentActionParamsSchema
>;

///////////////////////////////////////////////
// ACC/REJ Complaint Order for outlet_admin  //
//////////////////////////////////////////////

export class ComplaintOrderValidation {
  static OutletIDSchema = z.uuid().meta({
    description: "Outlet ID (UUID)",
    example: "123e4567-e89b-12d3-a456-426614174000",
  });

  static ComplaintBodySchema = z
    .object({
      adminResponse: z.string().min(1, "Admin response is required").meta({
        description: "Admin response to the complaint",
        example: "Your order has been delivered",
      }),
    })
    .meta({
      id: "ComplaintBody",
      description: "Payload for responding to a customer complaint",
      example: {
        adminResponse:
          "We apologize for the inconvenience. Your order has been processed.",
      },
    });

  static ComplaintParamsSchema = z
    .object({
      complaintId: z.uuid().meta({
        description: "Complaint ID (UUID)",
        example: "123e4567-e89b-12d3-a456-426614174000",
      }),
      status: z.enum(["resolved", "rejected"]).meta({
        description: "Complaint status",
        example: "resolved",
      }),
    })
    .meta({
      id: "ComplaintParams",
      description: "Path params for complaint action",
      example: {
        complaintId: "123e4567-e89b-12d3-a456-426614174000",
        status: "resolved",
      },
    });

  static AdminIDSchema = z.object({
    adminId: z.uuid().meta({
      description: "Admin ID (UUID)",
      example: "123e4567-e89b-12d3-a456-426614174000",
    }),
  });
}

export type ComplaintBodyValidationDTO = z.infer<
  typeof ComplaintOrderValidation.ComplaintBodySchema
>;
export type ComplaintParamsValidationDTO = z.infer<
  typeof ComplaintOrderValidation.ComplaintParamsSchema
>;
export type AdminIDValidationDTO = z.infer<
  typeof ComplaintOrderValidation.AdminIDSchema
>;
export type OutletIDValidationDTO = z.infer<
  typeof ComplaintOrderValidation.OutletIDSchema
>;

export type CustomerComplaintPayloadDTO = ComplaintBodyValidationDTO &
  ComplaintParamsValidationDTO &
  AdminIDValidationDTO;
