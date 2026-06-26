// src/services/adminOrder.services.ts
import { prisma } from "@/config/prisma";
import { HttpError } from "@/utils/httpError";
import {
  AdminOrderInputDTO,
  IDParamSchemaDTO,
  ManualOrderInputDTO,
  ManualOrderPayloadValidationDTO,
  OutletIdParamsSchemaDTO,
  UpdateOrderItemInputDTO,
  UpdateOrderItemPayloadValidationDTO,
  UpdatePayloadDTO,
  UpdateWalkInCustomerValidationDTO,
} from "@/validations/adminOrder.validation";
import {
  KeywordWalkInCustomerSchmaDTO,
  WalkInCustomerValidationDTO,
} from "@/validations/adminOrder.validation";

export class AdminOrderService {
  async createNewWalkInCustomer(data: WalkInCustomerValidationDTO) {
    try {
      const customer = await prisma.walkInCustomer.create({
        data,
      });
      return {
        success: true,
        message: "New Walk-In customer created",
        data: customer,
      };
    } catch (error) {
      throw error;
    }
  }

  async checkWalkInCustomer(keyword: KeywordWalkInCustomerSchmaDTO["keyword"]) {
    try {
      // check if the keyword valid
      if (!keyword.trim()) throw new HttpError(400, "Invalid keyword");

      // check if the keyword valid
      const customer = await prisma.walkInCustomer.findMany({
        where: {
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
      const { id, ...rest } = data;
      // update the data of the Walkin Customer
      const update = await prisma.walkInCustomer.update({
        where: {
          id,
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

  async deleteWalkinCustomer(id: IDParamSchemaDTO["id"]) {
    try {
      // delete the account of the Walkin Customer
      const query = await prisma.walkInCustomer.findUnique({
        where: {
          id,
        },
      });

      if (!query) throw new HttpError(404, "Walkin Customer not found");

      const deleted = await prisma.walkInCustomer.delete({
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
      const { outlet_id, total_kilo, walkin_customer_id, paid, source, items } =
        data;

      // make prisma transaction
      const result = await prisma.$transaction(async (tx) => {
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

  async getAllOrderOnOutlet(outlet_id: OutletIdParamsSchemaDTO["outlet_id"]) {
    try {
      const orders = await prisma.order.findMany({
        where: {
          outlet_id: outlet_id,
          status: "arrived_at_outlet",
        },
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
      });
      if (orders.length === 0 || !orders) {
        throw new HttpError(404, "There is no order from this outlet yet");
      }
      return orders;
    } catch (error) {
      throw error;
    }
  }

  async updateItemOfOrder(data: UpdateOrderItemPayloadValidationDTO) {
    try {
      // destructure the data
      const { outlet_id, orderId: order_id, items } = data;

      // not allowed the order that doesn't match with the order_outlet's outlet_admin
      const order = await prisma.order.findUnique({
        where: {
          id: order_id,
          outlet_id: outlet_id,
        },
        select: {
          id: true,
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

      // make a transaction for safety
      const result = await prisma.$transaction(async (tx) => {
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

        // update the order's status to the next step
        const updateOrderStatus = await tx.order.update({
          where: {
            id: order_id,
          },
          data: {
            status: "washing_in_progress",
          },
          select: {
            status: true,
          },
        });

        // return the result
        return {
          order: {
            ...order,
            status: updateOrderStatus.status,
          },
          finalOrderItems,
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
}
