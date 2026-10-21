import type { UisRawScheduleEntry } from "./uis-raw-schedule-entry.type";

/** 1 tuần trong response UIS `ds_tuan_tkb` (raw). */
export interface UisRawWeek {
  ngay_bat_dau: string;
  ngay_ket_thuc: string;
  ds_thoi_khoa_bieu?: UisRawScheduleEntry[];
}
