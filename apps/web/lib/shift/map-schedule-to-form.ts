import type { WorkerShiftDay } from "@/lib/api/types";

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

export function mapScheduleToForm(shifts: BackendShift[]): FormShift[] {
  const map = new Map<string, FormShift>();

  for (const shift of shifts) {
    const start = timeFromISO(shift.start_time);
    const end = timeFromISO(shift.end_time);
    const key = `${start}-${end}`;

    if (!map.has(key)) {
      map.set(key, { days: [], start, end });
    }

    map.get(key)!.days.push(shift.day_of_week);
  }

  return Array.from(map.values());
}
