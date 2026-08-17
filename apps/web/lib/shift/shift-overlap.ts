export function timeToMinutes(time: string): number {
  const parts = time.split(":");

  if (parts.length !== 2) {
    throw new Error(`Invalid time format: ${time}`);
  }

  const hours = Number(parts[0]);
  const minutes = Number(parts[1]);

  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    throw new Error(`Invalid time value: ${time}`);
  }

  return hours * 60 + minutes;
}

type FlatShift = {
  day: string;
  start: number;
  end: number;
  index: number;
};

export function detectOverlaps(
  shifts: {
    days: string[];
    start: string;
    end: string;
  }[],
): string[] {
  const errors: string[] = [];
  const flattened: FlatShift[] = [];

  shifts.forEach((shift, index) => {
    if (!shift.start || !shift.end) return;

    const startMin = timeToMinutes(shift.start);
    const endMin = timeToMinutes(shift.end);

    if (startMin >= endMin) {
      errors.push(
        `Invalid time range in shift ${index + 1}: start time must be before end time`,
      );
      return;
    }

    shift.days.forEach((day) => {
      flattened.push({ day, start: startMin, end: endMin, index });
    });
  });

  const byDay: Record<string, FlatShift[]> = {};

  for (const item of flattened) {
    const day = item.day;
    if (!byDay[day]) {
      byDay[day] = [];
    }
    byDay[day].push(item);
  }

  for (const day in byDay) {
    const dayShifts = byDay[day];

    if (!dayShifts || dayShifts.length < 2) continue;

    dayShifts.sort((a, b) => a.start - b.start);

    for (let i = 0; i < dayShifts.length - 1; i++) {
      const current = dayShifts[i];
      const next = dayShifts[i + 1];

      if (!current || !next) continue;

      if (current.end > next.start) {
        errors.push(
          `Overlap on ${day.toUpperCase()} between shift ${current.index + 1} and shift ${next.index + 1}`,
        );
      }
    }
  }

  return errors;
}
