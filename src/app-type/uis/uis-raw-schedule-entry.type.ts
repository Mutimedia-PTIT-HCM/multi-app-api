/** 1 tiết học trong response UIS `ds_thoi_khoa_bieu` (raw, chưa normalize). */
export interface UisRawScheduleEntry {
  ngay_hoc: string;
  ma_mon: string;
  ten_mon: string;
  thu_kieu_so: number;
  ten_giang_vien: string;
  ma_phong: string;
  tiet_bat_dau: number;
  so_tiet: number;
}
