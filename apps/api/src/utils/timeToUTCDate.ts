import { DateUtils } from "./today";

export class TimeUtils {
  static toUtc(time: string): Date {
    return DateUtils.toUtc(time);
  }
}
