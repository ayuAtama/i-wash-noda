// // apps/web/app/(schedule)/utils/shiftOverlap.ts

// /**
//  * Convert "HH:mm" into minutes since midnight
//  * Example: "08:30" → 510
//  */
// export function timeToMinutes(time: string): number {
//   const parts = time.split(":");

//   // guard invalid format
//   if (parts.length !== 2) {
//     throw new Error(`Invalid time format: ${time}`);
//   }

//   const hours = Number(parts[0]);
//   const minutes = Number(parts[1]);

//   if (Number.isNaN(hours) || Number.isNaN(minutes)) {
//     throw new Error(`Invalid time value: ${time}`);
//   }

//   return hours * 60 + minutes;
// }

// type FlatShift = {
//   day: string;
//   start: number;
//   end: number;
//   index: number;
// };

// /**
//  * Detect overlapping shifts
//  */
// export function detectOverlaps(
//   shifts: {
//     days: string[];
//     start: string;
//     end: string;
//   }[]
// ): string[] {
//   const errors: string[] = [];

//   const flattened: FlatShift[] = [];

//   // // Step 1: flatten shifts per day
//   // const flattened: {
//   //   day: string;
//   //   start: number;
//   //   end: number;
//   //   index: number;
//   // }[] = [];

//   shifts.forEach((shift, index) => {
//     if (!shift.start || !shift.end) return;

//     const startMin = timeToMinutes(shift.start);
//     const endMin = timeToMinutes(shift.end);

//     shift.days.forEach((day) => {
//       flattened.push({
//         day,
//         start: startMin,
//         end: endMin,
//         index,
//       });
//     });
//   });

//   // Step 2: group by day
//   const byDay: Record<string, FlatShift[]> = {};

//   for (const item of flattened) {
//     const day = item.day;
//     if (!byDay[day]) {
//       byDay[day] = [];
//     }
//     byDay[day].push(item);
//   }

//   // Step 3: detect overlap per day
//   // Object.entries(byDay).forEach(([day, items]) => {
//   //   items.sort((a, b) => a.start - b.start);

//   //   for (let i = 0; i < items.length - 1; i++) {
//   //     const current = items[i];
//   //     const next = items[i + 1];

//   //     if (current.end > next.start) {
//   //       errors.push(
//   //         `Overlap on ${day.toUpperCase()} between shift ${
//   //           current.index + 1
//   //         } and shift ${next.index + 1}`
//   //       );
//   //     }
//   //   }
//   // });

//   // 3. Detect overlaps per day
//   for (const day in byDay) {
//     const dayShifts = byDay[day];

//     if (!dayShifts || dayShifts.length < 2) continue;

//     dayShifts.sort((a, b) => a.start - b.start);

//     for (let i = 0; i < dayShifts.length - 1; i++) {
//       const currentShift = dayShifts[i];
//       const nextShift = dayShifts[i + 1];

//       // explicit guard (this satisfies TS)
//       if (!currentShift || !nextShift) continue;

//       if (currentShift.end > nextShift.start) {
//         errors.push(
//           `Overlap on ${day.toUpperCase()} between shift ${
//             currentShift.index + 1
//           } and shift ${nextShift.index + 1}`
//         );
//       }
//     }
//   }

//   return errors;
// }

// apps/web/app/(schedule)/utils/shiftOverlap.ts

/**
 * Convert "HH:mm" to minutes since midnight
 */
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

/**
 * Detect invalid time ranges AND overlapping shifts
 */
export function detectOverlaps(
  shifts: {
    days: string[];
    start: string;
    end: string;
  }[]
): string[] {
  const errors: string[] = [];

  const flattened: FlatShift[] = [];

  // 1. Validate each shift row (start < end)
  shifts.forEach((shift, index) => {
    if (!shift.start || !shift.end) return;

    const startMin = timeToMinutes(shift.start);
    const endMin = timeToMinutes(shift.end);

    // 🔴 INVALID TIME RANGE
    if (startMin >= endMin) {
      errors.push(
        `Invalid time range in shift ${index + 1}: start time must be before end time`
      );
      return; // DO NOT include this shift in overlap check
    }

    // flatten valid shifts only
    shift.days.forEach((day) => {
      flattened.push({
        day,
        start: startMin,
        end: endMin,
        index,
      });
    });
  });

  // 2. Group by day
  const byDay: Record<string, FlatShift[]> = {};

  // for (const item of flattened) {
  //   if (!byDay[item.day]) {
  //     byDay[item.day] = [];
  //   }
  //   byDay[item.day].push(item);
  // }

  for (const item of flattened) {
    const day = item.day;
    if (!byDay[day]) {
      byDay[day] = [];
    }
    byDay[day].push(item);
  }

  // 3. Detect overlaps per day
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
          `Overlap on ${day.toUpperCase()} between shift ${
            current.index + 1
          } and shift ${next.index + 1}`
        );
      }
    }
  }

  return errors;
}
