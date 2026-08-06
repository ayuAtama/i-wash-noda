// apps/api/src/services/workerShift.services.ts
import { prisma as defaultPrisma, PrismaWrapper } from "@/config/prisma";
import { HttpError } from "@/utils/httpError";
import { validateNoOverlap } from "@/utils/validateNoOverlap";
import timeToUtcDate from "@/utils/timeToUTCDate";
import {
  CreateSchedulePayloadDTO,
  CreateWorkerShiftInputDTO,
  FilterQueryScheduleDTO,
  GetScheduleDTO,
  OutletIDDTO,
  UnScheduleWorkerPayloadDTO,
  WorkerIdDTO,
  FetchWorkerSchedulePayloadDTO,
} from "@/validations/workerShift.validation";
import { Prisma, WorkerShiftDay } from "@/generated/prisma/client";
import { today } from "@/utils/today";

// sse experiment
import { sseService } from "./sse.services";


export class WorkerShiftService {
  constructor(private readonly prisma: PrismaWrapper = defaultPrisma) {}

  async getShiftsByWorkerId(workerId: WorkerIdDTO) {
    try {
      return await this.prisma.workerShift.findMany({
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
      const { id: workerId, schedules, outlet_id: outletId } = data;
      // worker id from fetch in dasboard
      // outled id from req.contex
      // station?? fetch in service layer?

      // get the user to validate existence and fallback station
      const user = await this.prisma.user.findFirst({

        where: { id: workerId, outlet_id: outletId },
        select: { role: true, worker_station: true },
      });

      if (!user) {
        throw new HttpError(404, "Worker not found");
      }

      // validate overlap in request
      validateNoOverlap(schedules);

      // One transaction = atomic weekly replacement
      const res = await this.prisma.$transaction(async (tx) => {
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
        this.prisma.user.findMany({
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
        this.prisma.user.count({ where }),
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
        this.prisma.workerShift.findMany({
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
        this.prisma.workerShift.count({ where }),
      ]);

      const today = new Date()
        .toLocaleString("en-US", { weekday: "short" })
        .toLowerCase() as WorkerShiftDay;
      const [total_worker, total_driver, on_duty_today] = await Promise.all([
        this.prisma.user.count({
          where: { outlet_id, role: "worker", is_deleted: false },
        }),
        this.prisma.user.count({
          where: { outlet_id, role: "driver", is_deleted: false },
        }),
        this.prisma.workerShift
          .groupBy({
            by: ["worker_id"],
            where: { outlet_id, day_of_week: today },
          orderBy: { worker_id: "asc" },
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
        this.prisma.user.findMany({
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
        this.prisma.user.count({ where }),
      ]);

      return {
        data: users,
        meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
      };
    } catch (error) {
      throw error;
    }
  }

  async scheduleSummaryDashboard(data: OutletIDDTO) {
    try {
      const { outlet_id } = data;

      // fetch the data on transaction for the dashboard
      const [totalWorker, totalDriver, totalOnDutyByWorker] =
        await this.prisma.$transaction([
          // fetch the total worker
          this.prisma.user.count({
            where: {
              outlet_id,
              role: "worker",
            },
          }),

          // fetch the total driver
          this.prisma.user.count({
            where: {
              outlet_id,
              role: "driver",
            },
          }),

          // onduty
          this.prisma.workerShift.groupBy({
            by: ["worker_id"],
            where: {
              outlet_id,
              day_of_week: today(),
            },
            _count: {
              id: true,
            },
            orderBy: { worker_id: "asc" },
          }),
        ]);

      return {
        totalWorker,
        totalDriver,
        totalOnDuty: totalOnDutyByWorker.length,
        today: today(),
      };
    } catch (error) {
      throw error;
    }
  }

  async getSchedule(data: GetScheduleDTO) {
    try {
      const { role, station, name, outlet_id } = data;

      // redifine the where
      const where: Prisma.WorkerShiftWhereInput = {
        outlet_id: outlet_id,
      };

      // role the filter
      if (role === "driver") {
        where.station = null;
      } else if (role === "worker") {
        where.station = { not: null };
      }

      // station filter
      if (station) {
        where.station = station;
      }

      // throw error if checking role === driver and station
      if (role === "driver" && station) {
        throw new HttpError(400, "Invalid request");
      }

      // get the data
      const res = await this.prisma.workerShift.findMany({
        where,
        select: {
          id: true,
          worker_id: true,
          day_of_week: true,
          start_time: true,
          end_time: true,
          station: true,
          worker: {
            select: {
              name: true,
            },
          },
        },
        orderBy: name ? { worker: { name: name } } : undefined,
      });

      // normalize
      const normalized = res.map(({ worker, ...r }) => {
        return {
          ...r,
          name: worker.name,
          start_time: r.start_time.toISOString().slice(11, 16),
          end_time: r.end_time.toISOString().slice(11, 16),
        };
      });
      return normalized;
    } catch (error) {
      throw error;
    }
  }
}
