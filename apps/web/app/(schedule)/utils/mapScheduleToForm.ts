import { WorkerShiftDay } from "../validation/prisma.enum";

type BackendShift = {
  day_of_week: WorkerShiftDay;
  start_time: string;
  end_time: string;
};

type FormShift = {
  days: WorkerShiftDay[];
  start: string;
  end: string;
};

function timeFromISO(iso: string): string {
  const d = new Date(iso);
  const h = d.getUTCHours().toString().padStart(2, "0");
  const m = d.getUTCMinutes().toString().padStart(2, "0");
  return `${h}:${m}`;
}

/**
 * Convert backend shifts (1 row per day)
 * into frontend form shifts (grouped by time)
 */
export function mapScheduleToForm(shifts: BackendShift[]): FormShift[] {
  const map = new Map<string, FormShift>();

  for (const shift of shifts) {
    const start = timeFromISO(shift.start_time);
    const end = timeFromISO(shift.end_time);
    const key = `${start}-${end}`;

    if (!map.has(key)) {
      map.set(key, {
        days: [],
        start,
        end,
      });
    }

    // ✅ enum-safe push
    map.get(key)!.days.push(shift.day_of_week);
  }

  return Array.from(map.values());
}
