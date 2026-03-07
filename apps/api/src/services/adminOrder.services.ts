// src/services/adminOrder.services.ts
import { prisma } from "@/config/prisma";
import { Prisma } from "@/generated/prisma/client";
import { HttpError } from "@/utils/httpError";
import { AdminOrderInput } from "@/validations/adminOrder.validation";

export class AdminOrderService {
  async getAllOrder(outletId: string) {
    try {
      const ordersList = await prisma.order.findMany({
        where: { outlet_id: outletId },
      });
      if (!ordersList) throw new HttpError(404, "Orders not found");
      return ordersList;
    } catch (error) {
      throw error;
    }
  }

  async getOrderById(orderId: string) {
    try {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
      });
      if (!order) throw new HttpError(404, "Order not found");
      return order;
    } catch (error) {
      throw error;
    }
  }

  async createOrder(data: AdminOrderInput, outletId: string, orderId: string) {
    try {
      // destructure the data
      const { total_kilos, items } = data;

      // manage the items first
      // collect the item id into array
      const itemId = items.map((item) => item.id);

      // check if the items exist
      const existingItems = await prisma.item.findMany({
        where: {
          id: { in: itemId },
        },
      });
      // handle if the inputted all items not exist
      if (existingItems.length === 0)
        throw new HttpError(404, "Items not found");

      // collect the existing items id from database
      const existingItemIds = existingItems.map((item) => item.id);

      // valid items (O(n))
      //const validItems = items.filter((item) =>
      //  existingItemIds.includes(item.id)
      //);

      // valid items
      const existingItemIdsSet = new Set(existingItemIds);
      // filter into item id exist in db and quantity > 0
      const validItems = items.filter(
        (item) => existingItemIdsSet.has(item.id) && item.quantity > 0
      );

      // reject if all items are filtered out
      if (validItems.length === 0) {
        throw new HttpError(400, "No valid items to process");
      }

      // transaction start
      const result = await prisma.$transaction(async (tx) => {
        // calculate the laundry price
        const { price_per_kg } =
          (await tx.outlet.findUnique({
            where: { id: outletId },
            select: { price_per_kg: true },
          })) ?? {};
        if (!price_per_kg) throw new HttpError(404, "Outlet not found");
        const laundryPrice = Math.ceil(Math.ceil(total_kilos) * price_per_kg);

        //calculate the total price
        const order = await tx.order.findFirst({
          where: { id: orderId },
          select: {
            pickup_fee: true,
            delivery_fee: true,
          },
        });
        if (!order) throw new HttpError(404, "Order not found");
        const totalAmount =
          order.pickup_fee + order.delivery_fee + laundryPrice;

        // update the order details and status
        const orderUpdated = await tx.order.update({
          where: { id: orderId },
          data: {
            total_kilo: total_kilos,
            laundry_price: laundryPrice,
            total_amount: totalAmount,
            status: "arrived_at_outlet",
          },
        });

        // create the order items
        const orderItems = await tx.orderItem.createMany({
          data: validItems.map((item) => ({
            order_id: orderId,
            item_id: item.id,
            quantity_initial: item.quantity,
          })),
        });

        return {
          order: orderUpdated,
          orderItems,
        };
      });

      return result;
    } catch (err) {
      throw err;
    }
  }
}
