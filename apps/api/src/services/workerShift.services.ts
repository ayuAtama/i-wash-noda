// apps/api/src/services/workerShift.services.ts
import { prisma } from "@/config/prisma";
import { Prisma, StationName, WorkerShiftDay } from "@/generated/prisma/client";
import { HttpError } from "@/utils/httpError";
import { validateNoOverlap } from "@/utils/validateNoOverlap";
import {
  CreateWorkerShiftInput,
  CreateWorkerShiftSchema,
} from "@/validations/workerShift.validation";

export class WorkerShiftService {
  async getShiftsByWorkerId(workerId: string) {
    try {
      return await prisma.workerShift.findMany({
        where: {
          worker_id: workerId,
          is_deleted: false,
        },
        select: {
          day_of_week: true,
          start_time: true,
          end_time: true,
          station: true,
        },
        orderBy: {
          day_of_week: "asc",
        },
      });
    } catch (error) {
      throw new HttpError(500, "Failed to get shifts, desuwa~");
    }
  }

  async replaceWeeklySchedule(data: CreateWorkerShiftInput) {
    try {
      const { outletId, workerId, station, schedules } = data;

      function timeToUtcDate(time: string): Date {
        const [h, m] = time.split(":").map(Number);

        // IMPORTANT: use UTC setters
        const d = new Date(Date.UTC(1970, 0, 1, h, m, 0));

        return d;
      }

      // validate overlap in request
      validateNoOverlap(schedules);
      // IMPORTANT:
      // One transaction = atomic weekly replacement
      await prisma.$transaction(async (tx) => {
        // 1. delete existing shifts for this worker + outlet (soft delete)
        await tx.workerShift.updateMany({
          where: {
            outlet_id: outletId,
            worker_id: workerId,
            is_deleted: false,
          },
          data: { is_deleted: true },
        });

        // 2. create new shifts
        await tx.workerShift.createMany({
          data: schedules.map((s) => ({
            outlet_id: outletId,
            worker_id: workerId,
            station,
            day_of_week: s.day,
            start_time: timeToUtcDate(s.start),
            end_time: timeToUtcDate(s.end),
          })),
        });
      });
    } catch (error) {
      throw error;
    }
  }
}
