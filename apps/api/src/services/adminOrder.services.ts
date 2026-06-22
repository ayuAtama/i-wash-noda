// src/services/adminOrder.services.ts
import { prisma } from "@/config/prisma";
import { HttpError } from "@/utils/httpError";
import {
  AdminOrderInputDTO,
  ManualOrderInputDTO,
  ManualOrderPayloadValidationDTO,
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

  // async getAllOrder(outletId: string) {
  //   try {
  //     const ordersList = await prisma.order.findMany({
  //       where: { outlet_id: outletId },
  //     });
  //     if (!ordersList) throw new HttpError(404, "Orders not found");
  //     return ordersList;
  //   } catch (error) {
  //     throw error;
  //   }
  // }

  // async getOrderById(orderId: string) {
  //   try {
  //     const order = await prisma.order.findUnique({
  //       where: { id: orderId },
  //     });
  //     if (!order) throw new HttpError(404, "Order not found");
  //     return order;
  //   } catch (error) {
  //     throw error;
  //   }
  // }

  // async createOrder(
  //   payload: AdminOrderInputDTO,
  //   outletId: string,
  //   orderId: string,
  // ) {
  //   try {
  //     // destructure the data
  //     const { total_kilos, items } = payload;

  //     // manage the items first
  //     // collect the item id into array
  //     const itemId = items.map((item) => item.id);

  //     // check if the items exist
  //     const existingItems = await prisma.item.findMany({
  //       where: {
  //         id: { in: itemId },
  //       },
  //     });
  //     // handle if the inputted all items not exist
  //     if (existingItems.length === 0)
  //       throw new HttpError(404, "Items not found");

  //     // collect the existing items id from database
  //     const existingItemIds = existingItems.map((item) => item.id);

  //     // valid items (O(n))
  //     //const validItems = items.filter((item) =>
  //     //  existingItemIds.includes(item.id)
  //     //);

  //     // valid items
  //     const existingItemIdsSet = new Set(existingItemIds);
  //     // filter into item id exist in db and quantity > 0
  //     const validItems = items.filter(
  //       (item) => existingItemIdsSet.has(item.id) && item.quantity > 0,
  //     );

  //     // reject if all items are filtered out
  //     if (validItems.length === 0) {
  //       throw new HttpError(400, "No valid items to process");
  //     }

  //     // transaction start
  //     const result = await prisma.$transaction(async (tx) => {
  //       // calculate the laundry price
  //       const { price_per_kg } =
  //         (await tx.outlet.findUnique({
  //           where: { id: outletId },
  //           select: { price_per_kg: true },
  //         })) ?? {};
  //       if (!price_per_kg) throw new HttpError(404, "Outlet not found");
  //       const laundryPrice = Math.ceil(Math.ceil(total_kilos) * price_per_kg);

  //       //calculate the total price
  //       const order = await tx.order.findFirst({
  //         where: { id: orderId },
  //         select: {
  //           pickup_fee: true,
  //           delivery_fee: true,
  //         },
  //       });
  //       if (!order) throw new HttpError(404, "Order not found");
  //       const totalAmount =
  //         order.pickup_fee + order.delivery_fee + laundryPrice;

  //       // update the order details and status
  //       const orderUpdated = await tx.order.update({
  //         where: { id: orderId },
  //         data: {
  //           total_kilo: total_kilos,
  //           laundry_price: laundryPrice,
  //           total_amount: totalAmount,
  //           status: "arrived_at_outlet",
  //         },
  //       });

  //       // create the order items
  //       const orderItems = await tx.orderItem.createMany({
  //         data: validItems.map((item) => ({
  //           order_id: orderId,
  //           item_id: item.id,
  //           quantity_initial: item.quantity,
  //         })),
  //       });

  //       return {
  //         order: orderUpdated,
  //         orderItems,
  //       };
  //     });

  //     return result;
  //   } catch (err) {
  //     throw err;
  //   }
  // }

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
            status: "arrived_at_outlet",
            paid,
            source,
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
        const allItem = await tx.item.findMany({
          where: {
            name: {
              in: newItems.map((item) => item.name),
            },
          },
          select: { name: true },
        });
        const filteredNewItems = newItems.filter(
          (item) => !allItem.some((i) => i.name === item.name),
        );

        if (filteredNewItems.length === 0) {
          throw new HttpError(409, "Please behave, and don't be a hacka");
        }

        // create the new items
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
            id: id?.id,
            quantity: item.quantity,
          };
        });

        // create the order items for new items
        const newOrderItems = await tx.orderItem.createMany({
          data: newItemsNormalized.map((item) => ({
            order_id: order.id,
            item_id: item.id!,
            quantity_initial: item.quantity,
          })),
        });

        // create the order items for existing items
        const existingOrderItems = await tx.orderItem.createMany({
          data: existingItems.map((item) => ({
            order_id: order.id,
            item_id: item.id!,
            quantity_initial: item.quantity,
          })),
        });

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
          new_items: newItemIDs,
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

  async getAllOrderOnOutlet(outlet_id: string) {
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
}
