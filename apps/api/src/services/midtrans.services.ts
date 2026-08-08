import { prisma as defaultPrisma, PrismaWrapper } from "@/config/prisma";
import midtrans, { MidtransClients } from "@/utils/midtrans";
import { HttpError } from "@/utils/httpError";
import {
  ParsedMidtransNotification,
  RawMidtransNotification,
} from "@/validations/midtrans.validation";

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

        return storedWebhook;
      });

      return result;
    } catch (error) {
      throw error;
    }
  }
}
