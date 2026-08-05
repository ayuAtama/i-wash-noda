// src/services/adminOrder.services.ts
import { prisma as defaultPrisma, prisma, PrismaWrapper } from "@/config/prisma";
import { OrderStatus } from "@/generated/prisma/enums";
import { HttpError } from "@/utils/httpError";
import {
  ActionOfPaymentProofValidationDTO,
  AdminOrderInputDTO,
  CheckWalkInCustomerValidationDTO,
  CustomerComplaintPayloadDTO,
  DeletePayloadDTO,
  IDParamSchemaDTO,
  ManualOrderInputDTO,
  ManualOrderPayloadValidationDTO,
  OutletIdParamsSchemaDTO,
  outletIDSchemaDTO,
  OutletIDValidationDTO,
  UpdateOrderItemInputDTO,
  UpdateOrderItemPayloadValidationDTO,
  UpdatePayloadDTO,
  UpdateWalkInCustomerValidationDTO,
  WalkInCustomerPayloadDTO,
} from "@/validations/adminOrder.validation";
import {
  KeywordWalkInCustomerSchmaDTO,
  WalkInCustomerValidationDTO,
} from "@/validations/adminOrder.validation";

export class AdminOrderService {
  constructor(private readonly prisma: PrismaWrapper = defaultPrisma) {}

  async createNewWalkInCustomer(data: WalkInCustomerPayloadDTO) {
    try {
      // destructing the data
      const { name, phone, admin_id, outlet_id } = data;

      // create the user
      const customer = await this.prisma.walkInCustomer.create({
        data: {
          name,
          phone,
          created_by: admin_id,
          outlet_id: outlet_id,
        },
      });
      // const customer = await this.prisma.walkInCustomer.create({
      //   data,
      // });
      if (!customer) {
        throw new HttpError(
          400,
          "Walkin Customer not created, please try again",
        );
      }

      return {
        success: true,
        message: "New Walk-In customer created",
        data: customer,
      };
    } catch (error) {
      throw error;
    }
  }

  async checkWalkInCustomer(payload: CheckWalkInCustomerValidationDTO) {
    try {
      // destructing the data
      const { keyword, outlet_id } = payload;

      // check if the keyword valid
      if (!keyword.trim()) throw new HttpError(400, "Invalid keyword");

      // check if the keyword valid
      const customer = await this.prisma.walkInCustomer.findMany({
        where: {
          outlet_id,
          OR: [
            {
              name: {
                contains: keyword,
                mode: "insensitive",
              },
            },
            {
              phone: {
                contains: keyword,
              },
            },
          ],
        },
        orderBy: {
          created_at: "desc",
        },
      });

      if (customer.length === 0) {
        return {
          success: false,
          message: "Customer not found",
          data: customer,
        };
      }
      return {
        success: true,
        message: "Customer found",
        data: customer,
      };
    } catch (error) {
      throw error;
    }
  }

  async updateWalkInCustomer(data: UpdatePayloadDTO) {
    try {
      // strip the id
      const { id, outlet_id, ...rest } = data;
      // update the data of the Walkin Customer
      const update = await this.prisma.walkInCustomer.update({
        where: {
          id,
          outlet_id,
        },
        data: rest,
      });

      return {
        success: true,
        message: "Walkin Customer updated",
        data: update,
      };
    } catch (err) {
      throw err;
    }
  }

  async deleteWalkinCustomer(payload: DeletePayloadDTO) {
    try {
      // destructing the data
      const { id, outlet_id } = payload;

      // delete the account of the Walkin Customer
      const query = await this.prisma.walkInCustomer.findUnique({
        where: {
          id,
          outlet_id,
        },
      });

      if (!query) throw new HttpError(404, "Walkin Customer not found");

      const deleted = await this.prisma.walkInCustomer.delete({
        where: {
          id: query.id,
        },
      });

      // send the error
      if (!deleted) {
        throw new HttpError(404, "Walkin Customer not found");
      }

      return {
        success: true,
        message: "Walkin Customer deleted",
        data: deleted,
      };
    } catch (error) {
      throw error;
    }
  }

  async manualCreateOrderWalkIn(data: ManualOrderPayloadValidationDTO) {
    try {
      // destructure the data
      const {
        outlet_id,
        total_kilo,
        id: walkin_customer_id,
        paid,
        source,
        items,
      } = data;

      // make prisma transaction
      const result = await this.prisma.$transaction(async (tx) => {
        // get the data price of the laundry from the outlet
        const { price_per_kg } = await tx.outlet.findFirstOrThrow({
          where: { id: outlet_id },
          select: { price_per_kg: true },
        });

        // calculate the laundry price (ceil to price will be interger and roundin up)
        const laundryPrice = Math.ceil(total_kilo * price_per_kg);

        // create the order
        const order = await tx.order.create({
          data: {
            outlet_id,
            walkin_customer_id,
            pickup_fee: 0,
            delivery_fee: 0,
            total_kilo,
            laundry_price: laundryPrice,
            total_amount: laundryPrice,
            status: "washing_in_progress", // because the order is created manually
            paid,
            source,
          },
          select: {
            id: true,
            walkInCustomer: {
              select: {
                name: true,
              },
            },
            pickup_fee: true,
            delivery_fee: true,
            total_kilo: true,
            laundry_price: true,
            total_amount: true,
            status: true,
            paid: true,
            created_at: true,
          },
        });

        // manage the order items
        // sperate the existing first
        const existingItems = items.filter(
          (item): item is { id: string; quantity: number } =>
            "id" in item && "quantity" in item,
        );

        // the new items
        const newItems = items.filter(
          (item): item is { name: string; quantity: number } =>
            "name" in item && "quantity" in item,
        );

        // filter in case the new item already in the existing items
        const existingItemDb = await tx.item.findMany({
          where: {
            name: {
              in: newItems.map((item) => item.name),
            },
          },
          select: { name: true, id: true },
        });

        // normalized if the item with name already exist
        const itemNameNormalized = newItems
          .filter((item) =>
            // filter the item that already exist
            existingItemDb.some((i) => i.name === item.name),
          )
          .map((item) => {
            // find the id from query prisma
            const id = existingItemDb.find((i) => i.name === item.name)!.id;
            // return the result
            return {
              id,
              quantity: item.quantity,
            };
          });

        // if none truly create new one
        const filteredNewItems = newItems.filter(
          (item) => !existingItemDb.some((i) => i.name === item.name),
        );

        // if (filteredNewItems.length === 0) {
        //   throw new HttpError(409, "Please behave, and don't be a hacka");
        // }

        // create the new items truly new from name only not id
        const newItemIDs = await Promise.all(
          filteredNewItems.map((item) =>
            tx.item.create({
              data: {
                name: item.name,
              },
            }),
          ),
        );

        // normalize the new items
        const newItemsNormalized = filteredNewItems.map((item) => {
          const id = newItemIDs.find((id) => id.name === item.name);
          return {
            id: id!.id,
            quantity: item.quantity,
          };
        });

        // combine all the items with only name
        const allItemsWithName = [...itemNameNormalized, ...newItemsNormalized];

        // create the order items for item with only name

        // const newOrderItems = await tx.orderItem.createMany({
        //   data: newItemsNormalized.map((item) => ({
        //     order_id: order.id,
        //     item_id: item.id!,
        //     quantity_initial: item.quantity,
        //   })),
        // });
        await Promise.all(
          allItemsWithName.map((item) =>
            tx.orderItem.upsert({
              where: {
                order_id_item_id: {
                  order_id: order.id,
                  item_id: item.id,
                },
              },
              update: {
                quantity_initial: {
                  increment: item.quantity,
                },
              },
              create: {
                order_id: order.id,
                item_id: item.id,
                quantity_initial: item.quantity,
              },
            }),
          ),
        );

        // create the order items for existing items (with id)
        // const existingOrderItems = await tx.orderItem.createMany({
        //   data: existingItems.map((item) => ({
        //     order_id: order.id,
        //     item_id: item.id!,
        //     quantity_initial: item.quantity,
        //   })),
        // });

        await Promise.all(
          existingItems.map((item) =>
            tx.orderItem.upsert({
              where: {
                order_id_item_id: {
                  order_id: order.id,
                  item_id: item.id,
                },
              },
              update: {
                quantity_initial: {
                  increment: item.quantity,
                },
              },
              create: {
                order_id: order.id,
                item_id: item.id,
                quantity_initial: item.quantity,
              },
            }),
          ),
        );

        // fetch the ordet_item
        const finalOrderItems = await tx.orderItem.findMany({
          where: { order_id: order.id },
          select: {
            quantity_initial: true,
            item: {
              select: {
                name: true,
              },
            },
          },
        });

        return {
          order,
          finalOrderItems,
        };
      });
      return {
        success: true,
        message: "New Walk-In customer order created",
        data: result,
      };
    } catch (error) {
      throw error;
    }
  }

  async getAllOrderOnOutlet(
    outlet_id: OutletIdParamsSchemaDTO["outlet_id"],
    page: number = 1,
    limit: number = 10,
  ) {
    try {
      const { skip, take } = { skip: (page - 1) * limit, take: limit };
      const where = {
        outlet_id: outlet_id,
        status: "arrived_at_outlet" as const,
      };

      const [orders, total] = await Promise.all([
        prisma.order.findMany({
          where,
          select: {
            id: true,
            customer_id: true,
            walkin_customer_id: true,
            pickupAddress: {
              select: {
                address: true,
              },

            },
            pickupDriver: {
              select: {
                name: true,
              },
            },
            deliveryDriver: {
              select: {
                name: true,
              },
            },
            pickup_fee: true,
            delivery_fee: true,
            total_kilo: true,
            laundry_price: true,
            total_amount: true,
            paid: true,
            created_at: true,
          },
          orderBy: { created_at: "desc" },
          skip,
          take,
        }),
        prisma.order.count({ where }),
      ]);

      return {
        data: orders,
        meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
      };
    } catch (error) {
      throw error;
    }
  }

  async markDelivered(orderId: string, outletId: string, adminId: string) {
    try {
      const order = await prisma.order.findUnique({
        where: { id: orderId, outlet_id: outletId },
        select: { id: true, status: true, source: true, paid: true },
      });

      if (!order) throw new HttpError(404, "Order not found in this outlet");
      if (order.source !== "walk_in") {
        throw new HttpError(
          400,
          "Only walk-in orders can be marked as delivered by admin",
        );
      }
      if (!order.paid) {
        throw new HttpError(
          400,
          "Order must be paid before marking as delivered",
        );
      }
      if (order.status === "delivered" || order.status === "finished") {
        throw new HttpError(400, "Order is already delivered or finished");
      }

      const updated = await prisma.order.update({
        where: { id: orderId },
        data: {
          status: "delivered",
          delivered_at: new Date(),
        },
        select: { id: true, status: true, delivered_at: true },
      });

      return updated;

    } catch (error) {
      throw error;
    }
  }

  async updateItemOfOrder(data: UpdateOrderItemPayloadValidationDTO) {
    try {
      // destructure the data
      const {
        outlet_id,
        orderId: order_id,
        items,
        totalWeights: total_kilo,
      } = data;

      // not allowed the order that doesn't match with the order_outlet's outlet_admin
      const order = await this.prisma.order.findUnique({
        where: {
          id: order_id,
          outlet_id: outlet_id,
        },
        select: {
          id: true,
          status: true,
          pickup_fee: true,
          delivery_fee: true,
          customer: {
            select: {
              name: true,
            },
          },
        },
      });

      if (!order) {
        throw new HttpError(
          404,
          "Please don't manage order that belong to your outlet",
        );
      }

      // guard: only allow submission once
      if (order.status !== "arrived_at_outlet") {
        throw new HttpError(400, "Order already submitted, cannot modify");
      }

      // make a transaction for safety
      const result = await this.prisma.$transaction(async (tx) => {
        // manage the order items (separate for existing and new items)

        // sperate the existing first
        const existingItems = items.filter(
          (item): item is { id: string; quantity: number } =>
            "id" in item && "quantity" in item,
        );

        // the new items
        const newItems = items.filter(
          (item): item is { name: string; quantity: number } =>
            "name" in item && "quantity" in item,
        );

        // check if the new item really the new one
        const existingDbItems = await tx.item.findMany({
          where: {
            name: {
              in: newItems.map((item) => item.name),
            },
          },
          select: { id: true, name: true },
        });

        // convert existing name into existingItems
        const existingItemsFromName = newItems
          .filter((item) =>
            existingDbItems.some((dbItem) => dbItem.name === item.name),
          )
          .map((item) => {
            const dbItem = existingDbItems.find(
              (dbItem) => dbItem.name === item.name,
            )!;

            return {
              id: dbItem.id,
              quantity: item.quantity,
            };
          });

        // only create truly new items
        const filteredNewItems = newItems.filter((item) => {
          return !existingDbItems.some((dbItem) => dbItem.name === item.name);
        });

        // throw error if the new item is not the new one
        // if (existingDbItems.length !== 0) {
        //   throw new HttpError(
        //     400,
        //     `Item with name ${existingDbItems.map((item) => item.name)} already exist`,
        //   );
        // }

        // create the new items in table item
        const newItemsIDs = await Promise.all(
          filteredNewItems.map((item) =>
            tx.item.create({
              data: {
                name: item.name,
              },
            }),
          ),
        );

        // normalize the new items
        const newItemsNormalized = filteredNewItems.map((item) => {
          const id = newItemsIDs.find((id) => id.name === item.name);
          return {
            id: id!.id,
            quantity: item.quantity,
          };
        });

        // combine all the new items with no id
        const allNoIDOrderItems = [
          ...existingItemsFromName,
          ...newItemsNormalized,
        ];

        // create the new items in table order_item
        // await tx.orderItem.createMany({
        //   data: allOrderItems.map((item) => {
        //     return {
        //       order_id: order_id,
        //       item_id: item.id!,
        //       quantity_initial: item.quantity,
        //     };
        //   }),
        // });

        await Promise.all(
          allNoIDOrderItems.map((item) =>
            tx.orderItem.upsert({
              where: {
                order_id_item_id: {
                  order_id,
                  item_id: item.id,
                },
              },
              update: {
                quantity_initial: {
                  increment: item.quantity,
                },
              },
              create: {
                order_id,
                item_id: item.id,
                quantity_initial: item.quantity,
              },
            }),
          ),
        );

        // create the existing items in table order_item

        // await tx.orderItem.createMany({
        //   data: existingItems.map((item) => {
        //     return {
        //       order_id: order_id,
        //       item_id: item.id,
        //       quantity_initial: item.quantity,
        //     };
        //   }),
        // });
        await Promise.all(
          existingItems.map((item) =>
            tx.orderItem.upsert({
              where: {
                order_id_item_id: {
                  order_id,
                  item_id: item.id,
                },
              },
              update: {
                quantity_initial: {
                  increment: item.quantity,
                },
              },
              create: {
                order_id,
                item_id: item.id,
                quantity_initial: item.quantity,
              },
            }),
          ),
        );

        // fetch the order_item
        const finalOrderItems = await tx.orderItem.findMany({
          where: { order_id: order_id },
          select: {
            quantity_initial: true,
            item: {
              select: {
                name: true,
              },
            },
          },
        });

        // build order update data
        const orderUpdateData: {
          status: OrderStatus;
          total_kilo?: number;
          laundry_price?: number;
          total_amount?: number;
        } = {
          status: "washing_in_progress",
        };

        // if total_kilo provided, recalculate prices
        if (total_kilo !== undefined) {
          const { price_per_kg } = await tx.outlet.findFirstOrThrow({
            where: { id: outlet_id },
            select: { price_per_kg: true },
          });
          const laundryPrice = Math.ceil(total_kilo * price_per_kg);
          const totalAmount =
            laundryPrice + order.pickup_fee + order.delivery_fee;
          orderUpdateData.total_kilo = total_kilo;
          orderUpdateData.laundry_price = laundryPrice;
          orderUpdateData.total_amount = totalAmount;
        }

        // update the order's status to the next step
        const updateOrderStatus = await tx.order.update({
          where: {
            id: order_id,
          },
          data: orderUpdateData,
          select: {
            status: true,
            total_kilo: true,
            laundry_price: true,
            total_amount: true,
          },
        });

        // return the result
        const { customer, ...rest } = order;
        return {
          order: {
            ...rest,
            customer_name: customer?.name,
            status: updateOrderStatus.status,
            total_kilo: updateOrderStatus.total_kilo,
            laundry_price: updateOrderStatus.laundry_price,
            total_amount: updateOrderStatus.total_amount,
          },
          finalOrderItems: finalOrderItems.map((item) => {
            return {
              name: item.item.name,
              quantity: item.quantity_initial,
            };
          }),
        };
      });

      return {
        success: true,
        message: "Order item updated",
        data: result,
      };
    } catch (error) {
      throw error;
    }
  }

  async checkCustomerPaymentProof(data: outletIDSchemaDTO) {
    const { outlet_id: outletId } = data;

    const listPaymentProof = await this.prisma.paymentProof.findMany({
      where: {
        order: {
          outlet_id: outletId,
        },
        is_deleted: false,
      },
      select: {
        id: true,
        image_url: true,
        created_at: true,
        updated_at: true,
        is_deleted: true,
        status: true,
        order: {
          select: {
            id: true,
            customer: {
              select: {
                name: true,
                image: true,
              },
            },
            total_amount: true,
          },
        },
      },
      orderBy: {
        created_at: "desc",
      },
    });

    const normalizedData = listPaymentProof.map((item) => {
      const customer_name = item.order.customer?.name
        ? item.order.customer.name
        : null;
      const customer_image = item.order.customer?.image
        ? item.order.customer.image
        : null;

      return {
        id: item.id,
        orderId: item.order.id,
        customerName: customer_name,
        customerImage: customer_image,
        approved: item.status,
        isDeleted: item.is_deleted,
        imageProofUrl: item.image_url,
        totalAmount: item.order.total_amount,
        updatedAt: item.updated_at,
        createdAt: item.created_at,
      };
    });

    return {
      success: true,
      message: "Payment proof fetched successfully",
      data: normalizedData,
    };
  }

  async actionOfPaymentProof(data: ActionOfPaymentProofValidationDTO) {
    const { outlet_id: outletId, id: paymentProofID, action } = data;

    const isPaymentProofExist = await this.prisma.paymentProof.findFirst({
      where: {
        id: paymentProofID,
        order: {
          outlet_id: outletId,
        },
      },
      select: {
        id: true,
        order_id: true,
        status: true,
      },
    });

    if (!isPaymentProofExist)
      throw new HttpError(404, "Payment proof not found");

    if (isPaymentProofExist.status !== "pending")
      throw new HttpError(409, "Payment proof already reviewed");

    // reject
    if (action === "rejected") {
      const reject = await this.prisma.paymentProof.update({
        where: {
          id: paymentProofID,
          order: {
            outlet_id: outletId,
          },
        },
        data: {
          status: "rejected",
          is_deleted: true,
        },
        select: {
          id: true,
          image_url: true,
          created_at: true,
          updated_at: true,
        },
      });
      return {
        success: true,
        message: "Payment proof rejected successfully",
        data: reject,
      };
    }

    // approve
    const transactionResult = await this.prisma.$transaction(async (tx) => {
      const approve = await tx.paymentProof.update({
        where: { id: paymentProofID },
        data: { status: "approved" },
        select: { order_id: true, status: true },
      });

      let currentOrder = await tx.order.update({
        where: {
          id: approve.order_id,
          outlet_id: outletId,
        },
        data: {
          paid: true,
        },
        select: {
          id: true,
          status: true,
          paid: true,
          deliveryRequests: {
            select: {
              id: true,
            },
          },
        },
      });

      //happened if change from database (easter egg)
      if (currentOrder.deliveryRequests.length > 0) {
        throw new HttpError(409, "Hehe, the dev like a yuris");
      }

      const deliveryRequest = await tx.deliveryRequest.create({
        data: {
          order_id: currentOrder.id,
          accepted: false,
        },
      });

      if (currentOrder.status === "waiting_for_payment") {
        currentOrder = await tx.order.update({
          where: {
            id: currentOrder.id,
          },
          data: { status: "waiting_for_driver_deliver" },
          select: {
            id: true,
            status: true,
            paid: true,
            deliveryRequests: {
              select: {
                id: true,
              },
            },
          },
        });
      }

      return {
        order: currentOrder,
        paymentProof: approve,
        deliveryRequest: deliveryRequest,
      };
    });

    return {
      success: true,
      message: "Payment proof approved successfully",
      data: transactionResult,
    };
  }

  async getAllPendingComplaints(data: OutletIDValidationDTO) {
    try {
      const outlet_id = data;

      const complaintLists = await this.prisma.complaint.findMany({
        where: {
          order: {
            outlet_id: outlet_id,
          },
          status: "pending",
        },
        include: {
          user: {
            select: {
              name: true,
            },
          },
        },
      });

      if (!complaintLists) throw new HttpError(404, "Complaint not found");

      const normalized = complaintLists.map((complaint) => {
        return {
          id: complaint.id,
          orderId: complaint.order_id,
          customerName: complaint.user.name,
          message: complaint.message,
          imageUrl: complaint.image_url,
          status: complaint.status,
          createdAt: complaint.created_at,
        };
      });

      return {
        success: true,
        message: "Complaints fetched successfully",
        data: normalized,
      };
    } catch (error) {
      throw error;
    }
  }

  async actionOfCustomerComplaint(data: CustomerComplaintPayloadDTO) {
    try {
      const {
        complaintId,
        status,
        adminResponse: admin_response,
        adminId,
      } = data;

      const guard = await this.prisma.complaint.findUnique({
        where: { id: complaintId },
        select: { id: true, status: true },
      });
      if (!guard) throw new HttpError(404, "Complaint not found");
      if (guard.status === "resolved")
        throw new HttpError(409, "Complaint already resolved");
      if (guard.status !== "pending")
        throw new HttpError(409, "Complaint already responded");

      const { update, orderUpdate } = await this.prisma.$transaction(
        async (tx) => {
          const update = await tx.complaint.update({
            where: { id: guard.id },
            data: {
              admin_response: admin_response,
              admin_id: adminId,
              status: status,
              resolved_at: status === "resolved" ? new Date() : null,
            },
            select: {
              id: true,
              order_id: true,
              user: {
                select: {
                  name: true,
                },
              },
              order: {
                select: {
                  pickupAddress: {
                    select: {
                      address: true,
                      lat: true,
                      lng: true,
                    },
                  },
                },
              },
              message: true,
              image_url: true,
              admin_response: true,
              status: true,
              resolved_at: true,
              updated_at: true,
              created_at: true,
            },
          });

          const orderUpdate = await tx.order.update({
            where: { id: update.order_id },
            data: { status: "finished", confirmed_at: new Date() },
            select: { id: true, status: true },
          });

          return { update, orderUpdate };
        },
      );

      const normalized = {
        id: update.id,
        userName: update.user.name,
        orderStatus: orderUpdate.status,
        orderAddress: update.order.pickupAddress?.address,
        orderCoordinates: `${update.order.pickupAddress?.lat},${update.order.pickupAddress?.lng}`,
        message: update.message,
        imageUrl: update.image_url,
        adminResponse: update.admin_response,
        status: update.status,
        resolvedAt: update.resolved_at,
        updatedAt: update.updated_at,
        createdAt: update.created_at,
      };

      return {
        success: true,
        message: "Complaint updated successfully",
        data: normalized,
      };
    } catch (error) {
      throw error;
    }
  };
}
