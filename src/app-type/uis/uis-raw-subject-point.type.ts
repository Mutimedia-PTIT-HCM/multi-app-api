import type { UisRawGradeComponent } from "./uis-raw-grade-component.type";

/** Điểm 1 môn trong response UIS `ds_diem_mon_hoc` (raw). */
export interface UisRawSubjectPoint {
  mamon: string;
  ten_mon: string;
  so_tin_chi: string;
  diem_thi: number | null;
  diem_tk: string;
  ds_diem_thanh_phan?: UisRawGradeComponent[];
}
