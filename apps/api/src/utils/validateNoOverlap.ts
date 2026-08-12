import { WorkerShiftDay } from "@/generated/prisma/client";
import { HttpError } from "./httpError";

type IncomingShift = {
  day: WorkerShiftDay;
  start: string;
  end: string;
};

export class ShiftValidator {
  private static timeToMinutes(time: string) {
    const parts = time.split(":");

    if (parts.length !== 2) {
      throw new HttpError(400, `Invalid time format: ${time}`);
    }

    const hours = Number(parts[0]);
    const minutes = Number(parts[1]);

    if (Number.isNaN(hours) || Number.isNaN(minutes)) {
      throw new HttpError(400, `Invalid time value: ${time}`);
    }

    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
      throw new HttpError(400, `Invalid time range: ${time}`);
    }

    return hours * 60 + minutes;
  }

  // export function validateNoOverlap(shifts: IncomingShift[]) {
  //   const byDay = new Map<WorkerShiftDay, IncomingShift[]>();

  //   // group by day
  //   for (const shift of shifts) {
  //     if (!byDay.has(shift.day)) {
  //       byDay.set(shift.day, []);
  //     }
  //     byDay.get(shift.day)!.push(shift);
  //   }

  //   // check overlap per day
  //   for (const [day, dayShifts] of byDay) {
  //     const normalized = dayShifts
  //       .map((s) => ({
  //         start: timeToMinutes(s.start),
  //         end: timeToMinutes(s.end),
  //       }))
  //       .sort((a, b) => a.start - b.start);

  //     for (let i = 0; i < normalized.length - 1; i++) {
  //       const current = normalized[i];
  //       const next = normalized[i + 1];

  //       if (current.end > next.start) {
  //         throw new Error(`Overlapping shifts detected on ${day.toUpperCase()}`);
  //       }
  //     }
  //   }
  // }

  static validateNoOverlap(shifts: IncomingShift[]) {
    const byDay = new Map<WorkerShiftDay, { start: number; end: number }[]>();

    // 1. Validate each shift & normalize
    shifts.forEach((shift, index) => {
      if (!shift.start || !shift.end) return;

      const startMin = ShiftValidator.timeToMinutes(shift.start);
      const endMin = ShiftValidator.timeToMinutes(shift.end);

      // 🔴 same as client: start must be before end
      if (startMin >= endMin) {
        throw new HttpError(
          400,
          `Invalid time range in array index ${index}: start time must be before end time`,
        );
      }

      if (!byDay.has(shift.day)) {
        byDay.set(shift.day, []);
      }

      byDay.get(shift.day)!.push({
        start: startMin,
        end: endMin,
      });
    });

    // 2. Detect overlap per day
    for (const [day, dayShifts] of byDay) {
      if (dayShifts.length < 2) continue;

      dayShifts.sort((a, b) => a.start - b.start);

      for (let i = 0; i < dayShifts.length - 1; i++) {
        const current = dayShifts[i];
        const next = dayShifts[i + 1];

        if (current.end > next.start) {
          throw new HttpError(400, `Overlap on ${day.toUpperCase()}`);
        }
      }
    }
  }
}
