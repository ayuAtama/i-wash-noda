import { prisma } from "@/config/prisma";
import { HttpError } from "@/utils/httpError";
import {
  uploadPaymentDTO,
  UserIdDTO,
} from "@/validations/customerOrder.validation";

export class CustomerOrderService {
  async checkActiveOrderStatus(userId: UserIdDTO) {
    try {
      // check if the user is valid
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });
      if (!user) throw new HttpError(404, "User not found");

      // find the most recent active order for this customer
      const order = await prisma.order.findMany({
        where: {
          customer_id: userId,
          status: {
            notIn: ["cancelled", "finished", "delivered"],
          },
        },
        select: {
          id: true,
          status: true,
          paid: true,
          pickup_fee: true,
          delivery_fee: true,
          total_kilo: true,
          laundry_price: true,
          total_amount: true,
          updated_at: true,
          created_at: true,
        },
        orderBy: {
          created_at: "desc",
        },
      });

      if (!order)
        throw new HttpError(404, "Currently there is no active order");

      // return the response
      return {
        success: true,
        message: "Order status fetched successfully",
        data: order,
      };
    } catch (err) {
      throw err;
    }
  }

  //check all completed orders
  async checkCompletedOrderStatus(userId: UserIdDTO) {
    try {
      // check if the user is valid
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });
      if (!user) throw new HttpError(404, "User not found");

      // find the most recent active order for this customer
      const order = await prisma.order.findMany({
        where: {
          customer_id: userId,
          status: { in: ["finished", "cancelled"] },
        },
        select: {
          id: true,
          status: true,
          paid: true,
          pickup_fee: true,
          delivery_fee: true,
          total_kilo: true,
          laundry_price: true,
          total_amount: true,
          updated_at: true,
          created_at: true,
        },
        orderBy: {
          created_at: "desc",
        },
      });

      if (!order)
        throw new HttpError(404, "Currently there is no completed order");

      // return the response
      return {
        success: true,
        message: "Order status fetched successfully",
        data: order,
      };
    } catch (err) {
      throw err;
    }
  }

  async uploadPaymentProof(data: uploadPaymentDTO) {
    try {
      const { orderId, userId, urlProof } = data;

      const orderData = await prisma.order.findFirst({
        where: {
          id: orderId,
          customer_id: userId,
        },
        select: {
          id: true,
          paymentProof: {
            where: { is_deleted: false },
            select: { id: true },
          },
        },
      });

      if (!orderData)
        throw new HttpError(
          404,
          "Order not found, and don't be a little hacker",
        );
      if (orderData.paymentProof)
        throw new HttpError(
          409,
          "Proof already uploaded, waiting for admin approval",
        );

      const uploadProof = await prisma.paymentProof.create({
        data: {
          order_id: orderData.id,
          image_url: urlProof,
        },
        select: {
          id: true,
          order_id: true,
          image_url: true,
          created_at: true,
        },
      });

      return {
        success: true,
        message: "Payment proof uploaded successfully",
        data: uploadProof,
      };
    } catch (error) {
      throw error;
    }
  }
}
