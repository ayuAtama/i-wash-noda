// src/validations/workerShift.validation.ts
import { z } from "zod";
import { StationName, WorkerShiftDay } from "@/generated/prisma/enums";
import "zod-openapi";

export const ScheduleItemSchema = z.object({
  day: z.enum(WorkerShiftDay).meta({
    description: "Day of the week",
    example: "MONDAY",
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
    outletId: z.string().uuid().meta({
      description: "Outlet ID (UUID)",
      example: "123e4567-e89b-12d3-a456-426614174000",
    }),
    workerId: z.string().uuid().meta({
      description: "Worker ID (UUID)",
      example: "123e4567-e89b-12d3-a456-426614174001",
    }),
    station: z.enum(StationName).meta({
      description: "Station name",
      example: "WASHING",
    }),
    schedules: z
      .array(ScheduleItemSchema)
      .min(1, "At least one day must be selected")
      .meta({
        description: "Weekly schedule array",
        example: [
          { day: "MONDAY", start: "08:00", end: "16:00" },
          { day: "TUESDAY", start: "08:00", end: "16:00" },
        ],
      }),
  })
  .meta({
    id: "CreateWorkerShift",
    description: "Payload for creating worker shift schedule",
    example: {
      outletId: "123e4567-e89b-12d3-a456-426614174000",
      workerId: "123e4567-e89b-12d3-a456-426614174001",
      station: "WASHING",
      schedules: [
        { day: "MONDAY", start: "08:00", end: "16:00" },
        { day: "TUESDAY", start: "08:00", end: "16:00" },
      ],
    },
  });

export class WorkerShiftValidation {
  static CreateWorkerShiftSchema = CreateWorkerShiftSchema;
}

export type CreateWorkerShiftInput = z.infer<typeof CreateWorkerShiftSchema>;
