// src/validations/workerShift.validation.ts
import { z } from "zod";
import { StationName, WorkerShiftDay } from "@/generated/prisma/enums";

export const ScheduleItemSchema = z.object({
  day: z.enum(WorkerShiftDay),
  start: z.string().regex(/^\d{2}:\d{2}$/, "Invalid start time"),
  end: z.string().regex(/^\d{2}:\d{2}$/, "Invalid end time"),
});

export const CreateWorkerShiftSchema = z.object({
  outletId: z.uuid(),
  workerId: z.uuid(),
  station: z.enum(StationName),
  schedules: z
    .array(ScheduleItemSchema)
    .min(1, "At least one day must be selected"),
});

export type CreateWorkerShiftInput = z.infer<typeof CreateWorkerShiftSchema>;
