import { ScheduleSubject } from "./schedule-subject.type";

/** 1 ngày trong tuần TKB sau khi normalize cho app. */
export interface ScheduleDay {
  date: string; // 'd/m/yyyy' (giữ định dạng legacy trả về)
  subjects: ScheduleSubject[];
}
