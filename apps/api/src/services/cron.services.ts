import cron from "node-cron";
import { prisma as defaultPrisma, PrismaWrapper } from "@/config/prisma";

const RUN_EVERY_12_HOURS = process.env.RUN_EVERY ?? "0 0 */12 * * *";
const TWENTY_FOUR_HOURS_IN_MS =
  Number(process.env.ORDER_AUTO_FINISH_AFTER_MS) ?? 24 * 60 * 60 * 1000;

export class CronService {
  private task: ReturnType<typeof cron.schedule> | null = null;

  constructor(private readonly prisma: PrismaWrapper = defaultPrisma) {}

  public start(): void {
    if (this.task) return;

    this.task = cron.schedule(
      RUN_EVERY_12_HOURS,
      async () => {
        await this.finishDeliveredOrders();
      },
      { name: "finish-delivered-orders" },
    );

    console.log(
      `[CronService] Scheduled "finish-delivered-orders" — every 12h, TTL ${TWENTY_FOUR_HOURS_IN_MS / 3600000}h`,
    );
  }

  public async stop(): Promise<void> {
    if (this.task) {
      await this.task.destroy();
      this.task = null;
    }
  }

  private async finishDeliveredOrders(): Promise<void> {
    const cutoff = new Date(Date.now() - TWENTY_FOUR_HOURS_IN_MS);

    const data = await this.prisma.order.updateManyAndReturn({
      where: {
        status: "delivered",
        delivered_at: { not: null, lte: cutoff },
      },
      data: {
        status: "finished",
        confirmed_at: new Date(),
      },
      select: {
        id: true,
        status: true,
        updated_at: true,
        customer: {
          select: { name: true },
        },
      },
    });

    if (data.length > 0) {
      console.log(
        `[CronService] Auto-finished ${data.length} delivered order(s) older than 24h\n${JSON.stringify(data, null, 2)}`,
      );
    }
  }
}
