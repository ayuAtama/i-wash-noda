// src/services/midtrans.services.ts
import { prisma as defaultPrisma, PrismaWrapper } from "@/config/prisma";
import { HttpError } from "@/utils/httpError";
import {
  createSnapTransaction,
  getTransactionStatus,
  verifyNotificationSignature,
} from "@/config/midtrans";
import { Prisma } from "@/generated/prisma/client";
import midtrans, { MidtransClients } from "@/utils/midtrans";
import {
  ParsedMidtransNotification,
  RawMidtransNotification,
} from "@/validations/midtrans.validation";

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

function isPaidTransaction(
  transactionStatus?: string,
  fraudStatus?: string,
): boolean {
  return (
    transactionStatus === "settlement" ||
    (transactionStatus === "capture" && fraudStatus === "accept")
  );
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
  settlement_time?: string;
  custom_field1?: string;
  va_numbers?: Array<{ bank?: string }>;
  bank?: string;
  issuer?: string;
  acquirer?: string;
  [key: string]: unknown;
}

export class MidtransService {
  private readonly prisma: PrismaWrapper;
  private readonly midtrans: MidtransClients;

  constructor(
    prismaClient: PrismaWrapper = defaultPrisma,
    midtransClient: MidtransClients = midtrans,
  ) {
    this.prisma = prismaClient;
    this.midtrans = midtransClient;
  }

  async createPayment(orderId: string, userId: string) {
    const order = await this.prisma.order.findUnique({
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

    const existing = await this.prisma.paymentGatewayTransaction.findFirst({
      where: { order_id: orderId, transaction_status: "pending" },
      orderBy: { created_at: "desc" },
      select: { id: true, token: true },
    });

    if (existing?.token) {
      try {
        const status = await getTransactionStatus(orderId);
        if (isPaidTransaction(status.transaction_status, status.fraud_status)) {
          await this.prisma.$transaction(async (tx) => {
            await tx.paymentGatewayTransaction.update({
              where: { id: existing.id },
              data: {
                provider_transaction_id: status.transaction_id ?? null,
                payment_type: status.payment_type ?? null,
                transaction_status: status.transaction_status ?? null,
                status_code: status.status_code ?? null,
                fraud_status: status.fraud_status ?? null,
                transaction_time: status.transaction_time ?? null,
                settlement_time: status.settlement_time ?? null,
                gross_amount: status.gross_amount ?? null,
                raw_response: status as unknown as Prisma.InputJsonValue,
              },
            });
            const current = await tx.order.findUnique({
              where: { id: orderId },
              select: { paid: true },
            });
            if (current && !current.paid) {
              await finalizePaidOrder(tx, orderId);
            }
          });
          return { snap_token: existing.token, already_paid: true };
        }
      } catch {
        // fall through and return the existing token
      }
      return { snap_token: existing.token };
    }

    const transaction = await this.prisma.paymentGatewayTransaction.create({
      data: {
        order_id: orderId,
        gross_amount: String(order.total_amount),
        transaction_status: "pending",
        status_code: "201",
      },
      select: { id: true },
    });

    const snapResponse = await createSnapTransaction({
      order_id: orderId,
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
      custom_field1: transaction.id,
    });

    await this.prisma.$transaction(async (tx) => {
      await tx.paymentGatewayTransaction.update({
        where: { id: transaction.id },
        data: {
          token: snapResponse.token,
          raw_response: {
            redirect_url: snapResponse.redirect_url,
          } as Prisma.InputJsonValue,
        },
      });
      await tx.order.update({
        where: { id: orderId },
        data: { payment_method: "payment_gateway" },
      });
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
      settlement_time,
      custom_field1,
      va_numbers,
      bank,
      issuer,
      acquirer,
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

    const transaction = custom_field1
      ? await this.prisma.paymentGatewayTransaction.findUnique({
          where: { id: custom_field1 },
          select: { id: true, order_id: true },
        })
      : null;

    if (!transaction) {
      throw new HttpError(404, "Transaction not found");
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.paymentGatewayTransaction.update({
        where: { id: transaction.id },
        data: {
          provider_transaction_id: transaction_id ?? null,
          payment_type: payment_type ?? null,
          transaction_status: transaction_status ?? null,
          status_code: status_code ?? null,
          fraud_status: fraud_status ?? null,
          transaction_time: transaction_time ?? null,
          settlement_time: settlement_time ?? null,
          gross_amount: gross_amount ?? null,
          bank: bank ?? va_numbers?.[0]?.bank ?? null,
          issuer: issuer ?? null,
          acquirer: acquirer ?? null,
          raw_response: payload as Prisma.InputJsonValue,
        },
      });

      if (isPaidTransaction(transaction_status, fraud_status)) {
        const order = await tx.order.findUnique({
          where: { id: transaction.order_id },
          select: { paid: true },
        });
        if (order && !order.paid) {
          await finalizePaidOrder(tx, transaction.order_id);
        }
      } else if (
        transaction_status === "cancel" ||
        transaction_status === "deny" ||
        transaction_status === "expire"
      ) {
        await tx.order.update({
          where: { id: transaction.order_id },
          data: { payment_method: null },
        });
      }
    });

    return { message: "Notification processed successfully" };
  }

  async getPaymentStatus(orderId: string, userId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, customer_id: true, status: true, paid: true },
    });

    if (!order) throw new HttpError(404, "Order not found");
    if (order.customer_id !== userId) {
      throw new HttpError(403, "Not your order");
    }

    const transactions = await this.prisma.paymentGatewayTransaction.findMany({
      where: { order_id: orderId },
      orderBy: { created_at: "desc" },
      select: {
        id: true,
        provider_transaction_id: true,
        payment_type: true,
        transaction_status: true,
        fraud_status: true,
        gross_amount: true,
        created_at: true,
      },
    });

    return {
      order_status: order.status,
      paid: order.paid,
      transactions,
    };
  }

  async syncPaymentStatus(orderId: string, userId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, customer_id: true, status: true, paid: true },
    });

    if (!order) throw new HttpError(404, "Order not found");
    if (order.customer_id !== userId) {
      throw new HttpError(403, "Not your order");
    }

    const transaction = await this.prisma.paymentGatewayTransaction.findFirst({
      where: { order_id: orderId },
      orderBy: { created_at: "desc" },
      select: { id: true, token: true },
    });

    if (!transaction) {
      throw new HttpError(404, "No payment transaction for this order");
    }

    const status = await getTransactionStatus(orderId);

    await this.prisma.$transaction(async (tx) => {
      await tx.paymentGatewayTransaction.update({
        where: { id: transaction.id },
        data: {
          provider_transaction_id: status.transaction_id ?? null,
          payment_type: status.payment_type ?? null,
          transaction_status: status.transaction_status ?? null,
          status_code: status.status_code ?? null,
          fraud_status: status.fraud_status ?? null,
          transaction_time: status.transaction_time ?? null,
          settlement_time: status.settlement_time ?? null,
          gross_amount: status.gross_amount ?? null,
          raw_response: status as unknown as Prisma.InputJsonValue,
        },
      });

      if (isPaidTransaction(status.transaction_status, status.fraud_status)) {
        const current = await tx.order.findUnique({
          where: { id: orderId },
          select: { paid: true },
        });
        if (current && !current.paid) {
          await finalizePaidOrder(tx, orderId);
        }
      }
    });

    const updated = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: { status: true, paid: true },
    });

    return {
      synced: true,
      order_status: updated?.status,
      paid: updated?.paid,
      transaction_status: status.transaction_status,
    };
  }

  async handleWebhookNotification(data: {
    parsedData: ParsedMidtransNotification;
    rawData: RawMidtransNotification;
  }) {
    try {
      const { parsedData, rawData } = data;
      if (!rawData || !parsedData) {
        throw new HttpError(400, "Invalid request");
      }

      const {
        signature_key,
        order_id,
        gross_amount,
        status_code,
        transaction_id,
        payment_type,
        currency,
        transaction_status,
        fraud_status,
        transaction_time,
        settlement_time,
        va_numbers,
        bank,
        issuer,
        acquirer,
        custom_field1,
      } = parsedData;

      console.log(JSON.stringify(rawData, null, 2));

      // verify the response
      const isValid = await this.midtrans.verifyResponse({
        order_id,
        status_code,
        gross_amount,
        signature_key,
      });
      if (!isValid) {
        throw new HttpError(400, "Invalid signature key");
      }

      //store the raw data
      const result = await this.prisma.$transaction(async (tx) => {
        const storedWebhook =
          await this.prisma.paymentGatewayTransaction.update({
            where: {
              id: custom_field1,
              order_id: parsedData.order_id,
            },
            data: {
              provider_transaction_id: transaction_id,
              raw_response: rawData,
              payment_type,
              gross_amount,
              currency,
              transaction_status,
              status_code,
              fraud_status,
              transaction_time,
              settlement_time,
              bank: bank ?? va_numbers?.[0]?.["bank"],
              issuer,
              acquirer,
            },
            select: {
              id: true,
              order_id: true,
              transaction_status: true,
              fraud_status: true,
            },
          });

        if (
          (storedWebhook.transaction_status === "capture" &&
            storedWebhook.fraud_status === "accept") ||
          storedWebhook.transaction_status === "settlement"
        ) {
          // change the order status to "paid"
          const updateOrderStatus = await tx.order.update({
            where: { id: storedWebhook.order_id },
            data: { paid: true },
            select: { id: true, paid: true },
          });

          return { storedWebhook, updateOrderStatus };
        }

        // if cancled expired and etc
        if (
          storedWebhook.transaction_status === "cancel" ||
          storedWebhook.transaction_status === "deny" ||
          storedWebhook.transaction_status === "expire"
        ) {
          const cancelPayment = await tx.order.update({
            where: { id: storedWebhook.order_id },
            data: { payment_method: null },
            select: { id: true, payment_method: true },
          });
          return cancelPayment;
        }

        return storedWebhook;
      });

      return result;
    } catch (error) {
      throw error;
    }
  }
}
