// src/validations/workerShift.validation.ts
import { z } from "zod";
import { StationName, WorkerShiftDay } from "@/generated/prisma/enums";
import "zod-openapi";

export const ScheduleItemSchema = z.object({
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

export const CreateWorkerShiftSchema = z
  .object({
    schedules: z
      .array(ScheduleItemSchema)
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

export const WorkerShiftIdParamsSechema = z
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

export const OutletIDSchema = z
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

export const FetchUnScheduledWorkerSchema = z
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

export const OrderEnum = z.enum(["asc", "desc"]);
export const RoleEnum = z.enum(["driver", "worker"]);
export const StationEnum = z.enum(StationName);
export const FilterQueryScheduleSchema = z
  .object({
    role: RoleEnum.optional().meta({
      description: "Role of the worker",
      example: "driver",
    }),
    station: StationEnum.optional().meta({
      description: "Station of the worker",
      example: "Washing",
    }),
    name: OrderEnum.optional().meta({
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

export class WorkerShiftValidation {
  static CreateWorkerShiftSchema = CreateWorkerShiftSchema;
  static WorkerShiftIdParamsSchema = WorkerShiftIdParamsSechema;
  static OutletIDSchema = OutletIDSchema;
  static FetchUnScheduledWorkerSchema = FetchUnScheduledWorkerSchema;
  static FilterQueryScheduleSchema = FilterQueryScheduleSchema;
}

export type CreateWorkerShiftInputDTO = z.infer<typeof CreateWorkerShiftSchema>;
export type WorkerShiftIdParamsDTO = z.infer<typeof WorkerShiftIdParamsSechema>;
export type OutletIDDTO = z.infer<typeof OutletIDSchema>;
export type CreateSchedulePayloadDTO = CreateWorkerShiftInputDTO &
  OutletIDDTO &
  WorkerShiftIdParamsDTO;
export type FetchUnScheduledWorkerDTO = z.infer<
  typeof FetchUnScheduledWorkerSchema
>;
export type UnScheduleWorkerPayloadDTO = FetchUnScheduledWorkerDTO &
  OutletIDDTO;
export type FilterQueryScheduleDTO = z.infer<typeof FilterQueryScheduleSchema>;
export type GetScheduleDTO = FilterQueryScheduleDTO & OutletIDDTO;
