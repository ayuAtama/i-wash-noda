// apps/api/src/services/workerShift.services.ts
import { prisma } from "@/config/prisma";
import { HttpError } from "@/utils/httpError";
import { validateNoOverlap } from "@/utils/validateNoOverlap";
import timeToUtcDate from "@/utils/timeToUTCDate";
import {
  CreateSchedulePayloadDTO,
  CreateWorkerShiftInputDTO,
  UnScheduleWorkerPayloadDTO,
} from "@/validations/workerShift.validation";
import { Prisma } from "@/generated/prisma/client";
import { socketService } from "@/socket";

export class WorkerShiftService {
  async getShiftsByWorkerId(workerId: string) {
    try {
      return await prisma.workerShift.findMany({
        where: {
          worker_id: workerId,
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
      throw error;
    }
  }

  async replaceWeeklySchedule(data: CreateSchedulePayloadDTO) {
    try {
      const { workerId, schedules, outlet_id: outletId } = data;
      // worker id from fetch in dasboard
      // outled id from req.contex
      // station?? fetch in service layer?

      // get the station or skip if the driver
      const station = await prisma.user.findFirst({
        where: { id: workerId, outlet_id: outletId },
        select: { role: true, worker_station: true },
      });

      if (!station) {
        throw new HttpError(404, "Worker not found");
      }

      // validate overlap in request
      validateNoOverlap(schedules);

      // IMPORTANT:
      // One transaction = atomic weekly replacement
      const res = await prisma.$transaction(async (tx) => {
        // permanent delete old shifts
        await tx.workerShift.deleteMany({
          where: {
            outlet_id: outletId,
            worker_id: workerId,
          },
        });

        // 2. create new shifts
        const res = await tx.workerShift.createManyAndReturn({
          data: schedules.map((s) => ({
            outlet_id: outletId,
            worker_id: workerId,
            station: station.worker_station,
            day_of_week: s.day,
            start_time: timeToUtcDate(s.start),
            end_time: timeToUtcDate(s.end),
          })),
        });

        return res;
      });
      socketService.broadcast("ScheduleUpdated", JSON.stringify(res));
      return res;
    } catch (error) {
      throw error;
    }
  }

  async fetchUnScheduledWorker(data: UnScheduleWorkerPayloadDTO) {
    try {
      // destructure the data
      const { outlet_id: outletId, keyword, role } = data;

      // fetch the id of the worker and related data
      const where = {
        outlet_id: outletId,
        ...(role
          ? { role: role }
          : { role: { notIn: ["super_admin", "outlet_admin", "customer"] } }),
        name: {
          contains: keyword,
          mode: "insensitive",
        },
        workerShifts: {
          none: {},
        },
      } as Prisma.UserWhereInput;

      const workers = await prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          role: true,
          worker_station: true,
        },
        orderBy: {
          name: "asc",
        },
      });

      if (workers.length === 0) {
        throw new HttpError(404, "No worker or driver shift found");
      }

      return workers;
    } catch (error) {
      throw error;
    }
  }
}
