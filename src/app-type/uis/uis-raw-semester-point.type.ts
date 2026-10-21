import type { UisRawSubjectPoint } from "./uis-raw-subject-point.type";

/** Điểm 1 học kỳ trong response UIS `ds_diem_hocky` (raw). */
export interface UisRawSemesterPoint {
  hoc_ky: string | number;
  dtb_hk_he4: string | null;
  ds_diem_mon_hoc?: UisRawSubjectPoint[];
}
