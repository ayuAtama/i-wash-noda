// src/services/payment.services.ts
import { prisma } from "@/config/prisma";
import { HttpError } from "@/utils/httpError";
import { finalizePaidOrder } from "@/services/midtrans.services";

export class PaymentService {
  async uploadPaymentProof(orderId: string, userId: string, imageUrl: string) {
    try {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        select: { id: true, customer_id: true, source: true, status: true },
      });

      if (!order) throw new HttpError(404, "Order not found");
      if (order.customer_id !== userId) {
        throw new HttpError(403, "Not your order");
      }
      if (order.status !== "waiting_for_payment") {
        throw new HttpError(400, "Order is not awaiting payment");
      }

      const existing = await prisma.paymentProof.findUnique({
        where: { order_id: orderId },
      });

      if (existing) {
        throw new HttpError(
          409,
          "Payment proof already submitted for this order",
        );
      }

      const proof = await prisma.paymentProof.create({
        data: {
          order_id: orderId,
          image_url: imageUrl,
        },
      });

      return proof;
    } catch (error) {
      throw error;
    }
  }

  async getPaymentProof(orderId: string) {
    try {
      const proof = await prisma.paymentProof.findUnique({
        where: { order_id: orderId },
        select: { id: true, image_url: true, created_at: true },
      });

      return proof;
    } catch (error) {
      throw error;
    }
  }

  async confirmPayment(orderId: string, adminId: string, outletId: string) {
    try {
      const order = await prisma.order.findUnique({
        where: { id: orderId, outlet_id: outletId },
        select: {
          id: true,
          status: true,
          paid: true,
          source: true,
          customer_id: true,
          total_amount: true,
        },
      });

      if (!order) throw new HttpError(404, "Order not found in this outlet");
      if (order.status !== "waiting_for_payment") {
        throw new HttpError(400, "Order is not awaiting payment");
      }
      if (order.paid) {
        throw new HttpError(400, "Order is already paid");
      }

      const result = await prisma.$transaction(async (tx) => {
        await finalizePaidOrder(tx, orderId);

        await tx.paymentGatewayTransaction.create({
          data: {
            order_id: orderId,
            gross_amount: String(order.total_amount),
            transaction_status: "paid",
            payment_type: "manual",
          },
        });

        return tx.order.findUniqueOrThrow({
          where: { id: orderId },
          select: { id: true, status: true, paid: true, source: true },
        });
      });

      return result;
    } catch (error) {
      throw error;
    }
  }

  async rejectPaymentProof(orderId: string, outletId: string, reason: string) {
    try {
      const order = await prisma.order.findUnique({
        where: { id: orderId, outlet_id: outletId },
        select: { id: true, status: true, paid: true },
      });

      if (!order) throw new HttpError(404, "Order not found in this outlet");
      if (order.status !== "waiting_for_payment") {
        throw new HttpError(400, "Order is not awaiting payment");
      }

      const proof = await prisma.paymentProof.findUnique({
        where: { order_id: orderId },
      });

      if (!proof) {
        throw new HttpError(404, "No payment proof found for this order");
      }

      await prisma.paymentProof.delete({
        where: { order_id: orderId },
      });

      await prisma.paymentGatewayTransaction.create({
        data: {
          order_id: orderId,
          gross_amount: "0",
          transaction_status: "cancelled",
          raw_response: { reason },
        },
      });

      return { message: "Payment proof rejected" };
    } catch (error) {
      throw error;
    }
  }
}
