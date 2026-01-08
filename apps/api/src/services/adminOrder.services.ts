// src/services/adminOrder.services.ts
import { prisma } from "@/config/prisma";
import { Prisma } from "@/generated/prisma/client";
import { HttpError } from "@/utils/httpError";

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

  async createOrder(data: Prisma.OrderUpdateInput) {
    try {
      
    } catch (err) {
      throw err;
    }
  }
}
