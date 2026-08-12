import { WorkerShiftDay } from "@/generated/prisma/enums";

export class DateUtils {
  static today(): WorkerShiftDay {
    const now = new Date();
    const today: WorkerShiftDay = [
      WorkerShiftDay.sun,
      WorkerShiftDay.mon,
      WorkerShiftDay.tue,
      WorkerShiftDay.wed,
      WorkerShiftDay.thu,
      WorkerShiftDay.fri,
      WorkerShiftDay.sat,
    ][now.getDay()];
    return today as WorkerShiftDay;
  }

  static now(): Date {
    const now = new Date();
    return now;
  }

  static toUtc(time: string): Date {
    const [hours, minutes] = time.split(":").map(Number);

    // IMPORTANT: use UTC setters
    const date = new Date(Date.UTC(1970, 0, 1, hours, minutes, 0));

    return date;
  }
}
