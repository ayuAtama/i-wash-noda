import { prisma as defaultPrisma, PrismaWrapper } from "@/config/prisma";
import { HttpError } from "@/utils/httpError";
import {
  complainPayloadDTO,
  markDoneDTO,
  uploadPaymentDTO,
  UserIdDTO,
} from "@/validations/customerOrder.validation";

export class CustomerOrderService {
  constructor(private readonly prisma: PrismaWrapper = defaultPrisma) {}

  async checkActiveOrderStatus(userId: UserIdDTO) {
    try {
      // check if the user is valid
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });
      if (!user) throw new HttpError(404, "User not found");

      // find the most recent active order for this customer
      const order = await this.prisma.order.findMany({
        where: {
          customer_id: userId,
          status: {
            notIn: ["cancelled", "finished"],
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
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });
      if (!user) throw new HttpError(404, "User not found");

      // find the most recent active order for this customer
      const order = await this.prisma.order.findMany({
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
          confirmed_at: true,
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

  async getMyOrders(userId: UserIdDTO) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true },
      });
      if (!user) throw new HttpError(404, "User not found");

      const orders = await this.prisma.order.findMany({
        where: { customer_id: userId },
        select: {
          id: true,
          status: true,
          paid: true,
          total_amount: true,
          created_at: true,
          updated_at: true,
          items: {
            select: {
              id: true,
              quantity_initial: true,
              item: { select: { name: true } },
            },
          },
        },
        orderBy: { created_at: "desc" },
      });

      const data = orders.map((order) => ({
        id: order.id,
        status: order.status,
        paid: order.paid,
        total_amount: order.total_amount,
        total_price: order.total_amount,
        created_at: order.created_at,
        updated_at: order.updated_at,
        items: order.items.map((oi) => ({
          id: oi.id,
          name: oi.item.name,
          quantity_initial: oi.quantity_initial,
        })),
      }));

      return {
        success: true,
        message: "Orders fetched successfully",
        data,
      };
    } catch (error) {
      throw error;
    }
  }

  async uploadPaymentProof(data: uploadPaymentDTO) {
    try {
      const { orderId, userId, urlProof } = data;

      const orderData = await this.prisma.order.findFirst({
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

      const uploadProof = await this.prisma.paymentProof.create({
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

  async markDone(data: markDoneDTO) {
    try {
      const { orderId, userId } = data;

      // guard
      const order = await this.prisma.order.findUnique({
        where: { id: orderId, customer_id: userId },
        select: { id: true, status: true, paid: true },
      });

      if (!order) throw new HttpError(404, "Order not found");
      if (order.status === "finished" && order.paid === true)
        throw new HttpError(
          409,
          "You've already marked this order as finished",
        );
      if (order.status === "complaint_received")
        throw new HttpError(409, "Please wait for admin response");

      if (order.status !== "delivered")
        throw new HttpError(409, "Please dont be a little hacker");

      const markDone = await this.prisma.order.update({
        where: { id: order.id },
        data: { status: "finished", confirmed_at: new Date() },
        select: {
          id: true,
          status: true,
          outlet: {
            select: {
              name: true,
            },
          },
          total_amount: true,
          confirmed_at: true,
        },
      });

      const normalized = {
        id: markDone.id,
        outlet: markDone.outlet.name,
        total_amount: markDone.total_amount,
        confirmed_at: markDone.confirmed_at,
      };

      return {
        success: true,
        message: "Order marked as finished successfully",
        data: normalized,
      };
    } catch (error) {
      throw error;
    }
  }

  async complaint(data: complainPayloadDTO) {
    try {
      const { orderId, userId, complaintMessage, complaintImage } = data;

      // guard
      const guard = await this.prisma.complaint.findFirst({
        where: { order_id: orderId, user_id: userId, status: "pending" },
        select: { id: true, status: true },
      });
      if (!guard) {
        const result = await this.prisma.$transaction(async (tx) => {
          const complain = await tx.complaint.create({
            data: {
              order_id: orderId,
              user_id: userId,
              message: complaintMessage,
              image_url: complaintImage,
              status: "pending",
            },
            select: {
              id: true,
              order_id: true,
              message: true,
              image_url: true,
              status: true,
              created_at: true,
            },
          });

          const updateOrderStatus = await tx.order.update({
            where: { id: complain.order_id },
            data: { status: "complaint_received" },
            select: { id: true, status: true },
          });

          return { complain, updateOrderStatus };
        });

        return {
          success: true,
          message: "Complaint created successfully",
          data: result,
        };
      }

      if (guard.status !== "pending")
        throw new HttpError(409, "Admin already responded to your complain");
      if (guard) {
        throw new HttpError(409, "You've already complained about this order");
      }
    } catch (error) {
      throw error;
    }
  }
}
