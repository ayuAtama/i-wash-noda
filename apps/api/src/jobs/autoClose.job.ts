// src/jobs/autoClose.job.ts
import cron from "node-cron";
import { AutoCloseService } from "@/services/autoClose.services";

const service = new AutoCloseService();

export function startAutoCloseJob() {
  cron.schedule("0 * * * *", async () => {
    try {
      const result = await service.closeDeliveredOrders();
      if (result.count > 0) {
        console.log(`[AutoClose] Closed ${result.count} delivered order(s)`);
      }
    } catch (error) {
      console.error("[AutoClose] Error closing delivered orders:", error);
    }
  });

  console.log("[AutoClose] Cron job scheduled (every hour)");
}
