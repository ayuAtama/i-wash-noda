// src/services/midtrans.services.ts
import { prisma } from "@/config/prisma";
import { HttpError } from "@/utils/httpError";
import {
  createSnapTransaction,
  verifyNotificationSignature,
} from "@/config/midtrans";
import { Prisma } from "@/generated/prisma/client";
import type { PaymentGatewayStatus } from "@/generated/prisma/enums";

export async function finalizePaidOrder(
  tx: Prisma.TransactionClient,
  orderId: string,
): Promise<void> {
  const order = await tx.order.findUnique({
    where: { id: orderId },
    select: { id: true, paid: true, source: true, customer_id: true },
  });

  if (!order) throw new HttpError(404, "Order not found");
  if (order.paid) return;

  await tx.order.update({
    where: { id: orderId },
    data: { paid: true, confirmed_at: new Date() },
  });

  if (order.source === "customer_app" && order.customer_id) {
    await tx.deliveryRequest.create({
      data: { order_id: orderId },
    });
    await tx.order.update({
      where: { id: orderId },
      data: { status: "waiting_for_driver_deliver" },
    });
  }
}

function mapTransactionStatus(
  transactionStatus?: string,
  fraudStatus?: string,
): PaymentGatewayStatus | null {
  switch (transactionStatus) {
    case "settlement":
      return "paid";
    case "capture":
      return fraudStatus === "challenge" ? "pending" : "paid";
    case "pending":
      return "pending";
    case "deny":
    case "cancel":
      return "cancelled";
    case "expire":
      return "expired";
    case "refund":
      return "cancelled";
    default:
      return null;
  }
}

export interface MidtransNotificationPayload {
  signature_key?: string;
  order_id?: string;
  status_code?: string;
  gross_amount?: string;
  transaction_status?: string;
  fraud_status?: string;
  transaction_id?: string;
  payment_type?: string;
  transaction_time?: string;
  [key: string]: unknown;
}

export class MidtransService {
  async createPayment(orderId: string, userId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        customer_id: true,
        source: true,
        status: true,
        paid: true,
        total_amount: true,
        customer: { select: { name: true, email: true } },
      },
    });

    if (!order) throw new HttpError(404, "Order not found");
    if (order.customer_id !== userId) {
      throw new HttpError(403, "Not your order");
    }
    if (order.status !== "waiting_for_payment") {
      throw new HttpError(400, "Order is not awaiting payment");
    }
    if (order.paid) {
      throw new HttpError(400, "Order is already paid");
    }

    const existing = await prisma.paymentTransaction.findFirst({
      where: { order_id: orderId, status: "pending" },
      orderBy: { created_at: "desc" },
      select: { snap_token: true, provider_order_id: true },
    });

    if (existing?.snap_token) {
      return { snap_token: existing.snap_token };
    }

    const providerOrderId =
      existing?.provider_order_id ??
      `IWN-${orderId.slice(0, 8).toUpperCase()}-${Date.now()}`;

    const snapResponse = await createSnapTransaction({
      order_id: providerOrderId,
      gross_amount: order.total_amount,
      customer_details: {
        first_name: order.customer?.name,
        email: order.customer?.email,
      },
      expiry: {
        start_time: new Date().toISOString(),
        unit: "hours",
        duration: 24,
      },
    });

    await prisma.paymentTransaction.upsert({
      where: { provider_order_id: providerOrderId },
      update: { snap_token: snapResponse.token },
      create: {
        order_id: orderId,
        amount: order.total_amount,
        status: "pending",
        provider_order_id: providerOrderId,
        snap_token: snapResponse.token,
        raw_response: { redirect_url: snapResponse.redirect_url },
      },
    });

    return {
      snap_token: snapResponse.token,
      redirect_url: snapResponse.redirect_url,
    };
  }

  async handleNotification(payload: MidtransNotificationPayload) {
    const {
      signature_key,
      order_id,
      status_code,
      gross_amount,
      transaction_status,
      fraud_status,
      transaction_id,
      payment_type,
      transaction_time,
    } = payload;

    if (!signature_key || !order_id || !status_code || !gross_amount) {
      throw new HttpError(400, "Invalid notification payload");
    }

    const isValid = verifyNotificationSignature(
      signature_key,
      order_id,
      status_code,
      gross_amount,
    );
    if (!isValid) {
      throw new HttpError(403, "Invalid signature");
    }

    const transaction = await prisma.paymentTransaction.findUnique({
      where: { provider_order_id: order_id },
      select: { id: true, order_id: true },
    });

    if (!transaction) {
      throw new HttpError(404, "Transaction not found");
    }

    const nextStatus = mapTransactionStatus(
      transaction_status,
      fraud_status,
    );
    if (!nextStatus) {
      return { message: "Unknown transaction status, no action taken" };
    }

    await prisma.$transaction(async (tx) => {
      await tx.paymentTransaction.update({
        where: { id: transaction.id },
        data: {
          status: nextStatus,
          provider_transaction_id: transaction_id ?? null,
          payment_type: payment_type ?? null,
          fraud_status: fraud_status ?? null,
          transaction_time: transaction_time
            ? new Date(transaction_time)
            : null,
          raw_response: payload as Prisma.InputJsonValue,
        },
      });

      if (nextStatus === "paid") {
        const order = await tx.order.findUnique({
          where: { id: transaction.order_id },
          select: { paid: true },
        });
        if (order && !order.paid) {
          await finalizePaidOrder(tx, transaction.order_id);
        }
      }
    });

    return { message: "Notification processed successfully" };
  }

  async getPaymentStatus(orderId: string, userId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, customer_id: true, status: true, paid: true },
    });

    if (!order) throw new HttpError(404, "Order not found");
    if (order.customer_id !== userId) {
      throw new HttpError(403, "Not your order");
    }

    const transactions = await prisma.paymentTransaction.findMany({
      where: { order_id: orderId },
      orderBy: { created_at: "desc" },
      select: {
        id: true,
        provider_order_id: true,
        payment_type: true,
        status: true,
        fraud_status: true,
        amount: true,
        created_at: true,
      },
    });

    return {
      order_status: order.status,
      paid: order.paid,
      transactions,
    };
  }
}
