import { WorkerShiftDay } from "@/generated/prisma/enums";

export function today(): WorkerShiftDay {
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

export function now(): Date {
  const now = new Date();
  return now;
}
