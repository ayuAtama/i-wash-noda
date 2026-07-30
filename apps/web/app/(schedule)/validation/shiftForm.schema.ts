import { z } from "zod";
import { StationName, WorkerShiftDay } from "./prisma.enum";

export const ShiftRowSchema = z.object({
  days: z.array(z.enum(WorkerShiftDay)).min(1, "Select at least one day"),
  start: z.string().regex(/^\d{2}:\d{2}$/),
  end: z.string().regex(/^\d{2}:\d{2}$/),
});

export const MultiShiftFormSchema = z.object({
  outletId: z.uuid(),
  workerId: z.uuid(),
  station: z.enum(StationName),
  shifts: z.array(ShiftRowSchema).min(1, "Add at least one shift"),
});

export type MultiShiftFormValues = z.infer<typeof MultiShiftFormSchema>;
