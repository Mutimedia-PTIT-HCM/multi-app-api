/** Session xác thực với cổng UIS của trường — chỉ cần Bearer access token. */
export interface UisSession {
  accessToken: string;
}

/** Token trả về từ OAuth grant (login hoặc refresh). */
export interface UisTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date; // access token hết hạn (~8h từ lúc cấp)
}

export interface UisStudentInfo {
  fullName: string; // ten_day_du
  classCode: string; // lop
  gender: string; // gioi_tinh: 'Nam' | khác
  birthDate: string; // ngay_sinh 'dd/mm/yyyy'
  phone: string; // dien_thoai
}

/** 1 ngày trong tuần TKB sau khi normalize cho app. */
export interface ScheduleDay {
  date: string; // 'd/m/yyyy' (giữ định dạng legacy trả về)
  subjects: ScheduleSubject[];
}

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

export interface SemesterPoint {
  year: number;
  semester: number;
  gpa: number;
  subjects: SubjectPoint[];
}

export interface SubjectPoint {
  subjectCode: string;
  subjectName: string;
  credits: number;
  attendance: number | null; // CC (K3)
  midterm: number | null; // KT (K1)
  exercise: number | null; // Se (B1)
  practice: number | null; // TH (K2)
  exam: number | null; // Thi
  final: number | null; // TK
}

export interface RecentGpa {
  year: number;
  semester: number;
  gpa: number;
}

/** Kết quả login UIS */
export type UisLoginResult =
  | { status: "ok"; session: UisSession; tokens: UisTokens }
  | { status: "invalid" } // sai tài khoản
  | { status: "unsupported" } // MSSV không thuộc ngành hỗ trợ
  | { status: "unreachable" }; // UIS timeout/lỗi mạng
