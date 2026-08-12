// src/validations/workerShift.validation.ts
import { z } from "zod";
import { StationName, WorkerShiftDay } from "@/generated/prisma/enums";
import "zod-openapi";

export class WorkerShiftValidation {
  static ScheduleItemSchema = z.object({
    day: z.enum(WorkerShiftDay).meta({
      description: "Day of the week",
      example: "mon",
    }),
    start: z
      .string()
      .regex(/^\d{2}:\d{2}$/, "Invalid start time")
      .meta({
        description: "Start time (HH:mm)",
        example: "08:00",
      }),
    end: z
      .string()
      .regex(/^\d{2}:\d{2}$/, "Invalid end time")
      .meta({
        description: "End time (HH:mm)",
        example: "16:00",
      }),
  });

  static CreateWorkerShiftSchema = z
    .object({
      schedules: z
        .array(WorkerShiftValidation.ScheduleItemSchema)
        .min(1, "You must provide schedule for at least one day")
        .meta({
          description: "Weekly schedule array",
          example: [
            { day: "mon", start: "08:00", end: "16:00" },
            { day: "tue", start: "08:00", end: "16:00" },
          ],
        }),
    })
    .meta({
      id: "CreateWorkerShift",
      description: "Payload for creating worker shift schedule",
      example: {
        schedules: [
          { day: "mon", start: "08:00", end: "16:00" },
          { day: "tue", start: "08:00", end: "16:00" },
        ],
      },
    });

  static WorkerShiftIdParamsSchema = z
    .object({
      id: z.uuid().meta({
        description: "Worker Shift ID (UUID)",
        example: "123e4567-e89b-12d3-a456-426614174000",
      }),
    })
    .meta({
      id: "WorkerShiftIdParams",
      description: "Payload for updating a worker shift",
      example: {
        id: "123e4567-e89b-12d3-a456-426614174000",
      },
    });

  static OutletIDSchema = z
    .object({
      outlet_id: z.uuid().meta({
        description: "Outlet ID (UUID)",
        example: "123e4567-e89b-12d3-a456-426614174000",
      }),
    })
    .meta({
      id: "OutletID",
      description: "Payload for updating a worker shift",
      example: {
        outlet_id: "123e4567-e89b-12d3-a456-426614174000",
      },
    });

  static OrderEnum = z.enum(["asc", "desc"]);
  static RoleEnum = z.enum(["driver", "worker"]);
  static StationEnum = z.enum(StationName);

  static FilterQueryScheduleSchema = z
    .object({
      role: WorkerShiftValidation.RoleEnum.optional().meta({
        description: "Role of the worker",
        example: "driver",
      }),
      station: WorkerShiftValidation.StationEnum.optional().meta({
        description: "Station of the worker",
        example: "Washing",
      }),
      name: WorkerShiftValidation.OrderEnum.optional().meta({
        description: "Name of the worker",
        example: "asc",
      }),
    })
    .meta({
      id: "FilterQuerySchedule",
      description: "Payload for fetching workers without schedules sift",
      example: {
        role: "driver",
        station: "Washing",
        name: "asc",
      },
    });

  static FetchUnScheduledWorkerSchema = z
    .object({
      keyword: z.string().min(1, "Keyword is required").optional().meta({
        description: "Keyword to search for workers without schedules sift",
        example: "John",
      }),
      role: z.enum(["driver", "worker"]).optional().meta({
        description: "Role of the worker",
        example: "driver",
      }),
    })
    .meta({
      id: "FetchUnScheduledWorker",
      description: "Payload for fetching workers without schedules sift",
      example: {
        keyword: "John",
        role: "driver",
      },
    });

  static workerId = z.uuid().meta({
    description: "Worker ID (UUID)",
    example: "123e4567-e89b-12d3-a456-426614174000",
  });
}

export type CreateWorkerShiftInputDTO = z.infer<
  typeof WorkerShiftValidation.CreateWorkerShiftSchema
>;
export type WorkerShiftIdParamsDTO = z.infer<
  typeof WorkerShiftValidation.WorkerShiftIdParamsSchema
>;
export type OutletIDDTO = z.infer<typeof WorkerShiftValidation.OutletIDSchema>;
export type CreateSchedulePayloadDTO = CreateWorkerShiftInputDTO &
  OutletIDDTO &
  WorkerShiftIdParamsDTO;
export type FetchUnScheduledWorkerDTO = z.infer<
  typeof WorkerShiftValidation.FetchUnScheduledWorkerSchema
>;
export type UnScheduleWorkerPayloadDTO = FetchUnScheduledWorkerDTO &
  OutletIDDTO;
export type FilterQueryScheduleDTO = z.infer<
  typeof WorkerShiftValidation.FilterQueryScheduleSchema
>;
export type GetScheduleDTO = FilterQueryScheduleDTO & OutletIDDTO;
export type WorkerIdDTO = z.infer<typeof WorkerShiftValidation.workerId>;
