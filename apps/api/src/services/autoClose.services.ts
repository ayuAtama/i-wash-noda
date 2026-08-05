// src/services/autoClose.services.ts
import { prisma } from "@/config/prisma";
import { sendOrderCompletionEmail } from "@/utils/mail";

export class AutoCloseService {
  async closeDeliveredOrders() {
    try {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

      const ordersToClose = await prisma.order.findMany({
        where: {
          status: "delivered",
          paid: true,
          delivered_at: { lte: twentyFourHoursAgo },
        },
        select: {
          id: true,
          customer_id: true,
          customer: { select: { email: true, name: true } },
          outlet: { select: { name: true } },
        },
      });

      const result = await prisma.order.updateMany({
        where: {
          status: "delivered",
          paid: true,
          delivered_at: { lte: twentyFourHoursAgo },
        },
        data: {
          status: "finished",
        },
      });

      for (const order of ordersToClose) {
        if (order.customer?.email) {
          try {
            await sendOrderCompletionEmail(
              order.customer.email,
              order.id,
              order.outlet.name,
            );
          } catch (emailError) {
            console.error(
              `[AutoClose] Failed to send completion email for order ${order.id}:`,
              emailError,
            );
          }
        }
      }

      return result;
    } catch (error) {
      throw error;
    }
  }
}
