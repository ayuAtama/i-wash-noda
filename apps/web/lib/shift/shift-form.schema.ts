import { z } from "zod";
import { WORKER_STATIONS, WORKER_SHIFT_DAYS } from "@/lib/api/types";

export const ShiftRowSchema = z.object({
  days: z.array(z.enum(WORKER_SHIFT_DAYS)).min(1, "Pilih minimal satu hari"),
  start: z.string().regex(/^\d{2}:\d{2}$/),
  end: z.string().regex(/^\d{2}:\d{2}$/),
});

export const MultiShiftFormSchema = z.object({
  outletId: z.string().uuid(),
  workerId: z.string().uuid(),
  station: z.enum(WORKER_STATIONS),
  shifts: z.array(ShiftRowSchema).min(1, "Tambahkan minimal satu shift"),
});

export type MultiShiftFormValues = z.infer<typeof MultiShiftFormSchema>;
