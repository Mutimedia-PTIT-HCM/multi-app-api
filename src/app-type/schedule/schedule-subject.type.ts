export interface ScheduleSubject {
  subjectCode: string; // mamh / ma_mon
  subjectName: string; // tenmh / ten_mon
  credits: number; // sotc
  dayOfWeek: string; // thu: 'Thứ Hai'...
  lecturer: string; // tencb / ten_giang_vien
  room: string; // phong / ma_phong
  startPeriod: number; // tietbd / tiet_bat_dau
  periodCount: number; // sotiet / so_tiet
}
