import { ScheduleDay } from "./schedule-day.type";

/** GET /schedule/weeks/:week — TKB chi tiết 1 tuần. */
export interface WeekSchedule {
  week: number;
  semesterCode: string;
  days: ScheduleDay[];
}
