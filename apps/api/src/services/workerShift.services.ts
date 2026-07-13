// apps/api/src/services/workerShift.services.ts
import { prisma } from "@/config/prisma";
import { HttpError } from "@/utils/httpError";
import { validateNoOverlap } from "@/utils/validateNoOverlap";
import timeToUtcDate from "@/utils/timeToUTCDate";
import {
  CreateSchedulePayloadDTO,
  CreateWorkerShiftInputDTO,
  UnScheduleWorkerPayloadDTO,
  FetchWorkerSchedulePayloadDTO,
} from "@/validations/workerShift.validation";
import { Prisma, WorkerShiftDay } from "@/generated/prisma/client";

// sse experiment
import { sseService } from "./sse.services";

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

      // get the user to validate existence and fallback station
      const user = await prisma.user.findFirst({
        where: { id: workerId, outlet_id: outletId },
        select: { role: true, worker_station: true },
      });

      if (!user) {
        throw new HttpError(404, "Worker not found");
      }

      // validate overlap in request
      validateNoOverlap(schedules);

      // One transaction = atomic weekly replacement
      const res = await prisma.$transaction(async (tx) => {
        // permanent delete old shifts
        await tx.workerShift.deleteMany({
          where: {
            outlet_id: outletId,
            worker_id: workerId,
          },
        });

        // 2. create new shifts — use explicit station if provided, else fall back to user's worker_station
        const res = await tx.workerShift.createManyAndReturn({
          data: schedules.map((s) => ({
            outlet_id: outletId,
            worker_id: workerId,
            station: s.station !== undefined ? s.station : user.worker_station,
            day_of_week: s.day,
            start_time: timeToUtcDate(s.start),
            end_time: timeToUtcDate(s.end),
          })),
        });

        return res;
      });
      // send the sse event before the http response
      sseService.broadcastToOutlet(res, "ScheduleUpdated", outletId);

      return res;
    } catch (error) {
      throw error;
    }
  }

  async fetchUnScheduledWorker(
    data: UnScheduleWorkerPayloadDTO,
    page: number = 1,
    limit: number = 10,
  ) {
    try {
      const { outlet_id: outletId, keyword, role } = data;
      const { skip, take } = { skip: (page - 1) * limit, take: limit };

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

      const [workers, total] = await Promise.all([
        prisma.user.findMany({
          where,
          select: {
            id: true,
            name: true,
            role: true,
            worker_station: true,
          },
          orderBy: { name: "asc" },
          skip,
          take,
        }),
        prisma.user.count({ where }),
      ]);

      return {
        data: workers,
        meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
      };
    } catch (error) {
      throw error;
    }
  }

  async fetchAllSchedules(data: FetchWorkerSchedulePayloadDTO) {
    try {
      const { outlet_id, query, page = 1, limit = 10 } = data;
      const skip = (page - 1) * limit;

      const where: Prisma.WorkerShiftWhereInput = {
        outlet_id,
        worker: query
          ? { name: { contains: query, mode: "insensitive" } }
          : undefined,
      };

      const [schedules, totalSchedules] = await Promise.all([
        prisma.workerShift.findMany({
          where,
          include: {
            worker: {
              select: { name: true, role: true, worker_station: true },
            },
          },
          skip,
          take: limit,
          orderBy: { created_at: "desc" },
        }),
        prisma.workerShift.count({ where }),
      ]);

      const today = new Date()
        .toLocaleString("en-US", { weekday: "short" })
        .toLowerCase() as WorkerShiftDay;
      const [total_worker, total_driver, on_duty_today] = await Promise.all([
        prisma.user.count({
          where: { outlet_id, role: "worker", is_deleted: false },
        }),
        prisma.user.count({
          where: { outlet_id, role: "driver", is_deleted: false },
        }),
        prisma.workerShift
          .groupBy({
            by: ["worker_id"],
            where: { outlet_id, day_of_week: today },
          })
          .then((res) => res.length),
      ]);

      return {
        data: schedules,
        meta: {
          page,
          limit,
          total: totalSchedules,
          totalPages: Math.ceil(totalSchedules / limit),
        },
        summary: {
          total_worker,
          total_driver,
          total_schedule: totalSchedules, // Total schedules for the given query
          on_duty_today,
        },
      };
    } catch (error) {
      throw error;
    }
  }

  async fetchWorkersByOutlet(
    outlet_id: string,
    role?: "worker" | "driver",
    station?: "washing" | "ironing" | "packing",
    page: number = 1,
    limit: number = 10,
  ) {
    try {
      const { skip, take } = { skip: (page - 1) * limit, take: limit };
      const where: Prisma.UserWhereInput = {
        outlet_id,
        is_deleted: false,
      };

      if (role) where.role = role;
      else where.role = { in: ["worker", "driver"] };

      if (station) where.worker_station = station;

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          select: {
            id: true,
            name: true,
            role: true,
            worker_station: true,
            email: true,
          },
          orderBy: { name: "asc" },
          skip,
          take,
        }),
        prisma.user.count({ where }),
      ]);

      return {
        data: users,
        meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
      };
    } catch (error) {
      throw error;
    }
  }
}
