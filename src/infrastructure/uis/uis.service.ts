import { IUisService } from "@app-contracts";
import {
  RecentGpa,
  ScheduleDay,
  SemesterPoint,
  SubjectPoint,
  UisLoginResult,
  UisSession,
  UisStudentInfo,
  UisTokens,
} from "@app-type";
import { Injectable, Logger } from "@nestjs/common";
import axios, { AxiosError } from "axios";

const UIS_BASE = "https://uis.ptithcm.edu.vn/api";
const REQUEST_TIMEOUT = 20_000;
const SUPPORTED_PREFIXES = ["DCPT", "DCTT"];
const DAY_NAMES = ["", "", "Hai", "Ba", "Tư", "Năm", "Sáu", "Bảy"];

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * UIS OAuth:
 * - `POST /auth/login` grant_type=password → access_token (JWE opaque, ~8h) + refresh_token.
 * - refresh_token ROTATE mỗi lần dùng và PHẢI kèm `username` — refresh xong token cũ chết (single session).
 * - Các API data (dkmh/sch/srm…) chỉ cần `Authorization: Bearer` — KHÔNG cần cookie XSRF.
 */
@Injectable()
export class UisService implements IUisService {
  private readonly logger = new Logger(UisService.name);

  // ===================== AUTH =====================

  /** Đăng nhập UIS bằng mssv + password (OAuth password grant). */
  async login(username: string, password: string): Promise<UisLoginResult> {
    if (!SUPPORTED_PREFIXES.some((p) => username.includes(p))) {
      return { status: "unsupported" };
    }
    try {
      const res = await axios.post(
        `${UIS_BASE}/auth/login`,
        new URLSearchParams({ username, password, grant_type: "password" }).toString(),
        {
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          timeout: REQUEST_TIMEOUT,
        },
      );
      const tokens = this.parseTokens(res.data);
      if (!tokens) return { status: "invalid" };
      return { status: "ok", session: { accessToken: tokens.accessToken }, tokens };
    } catch (e) {
      if (this.isAuthError(e)) return { status: "invalid" };
      this.logger.warn(`UIS login unreachable: ${this.errMsg(e)}`);
      return { status: "unreachable" };
    }
  }

  /**
   * Refresh access token. Trả:
   * - UisTokens nếu ok
   * - null nếu refresh token hết hạn/bị revoke (→ re-login bằng password)
   * - 'unreachable' nếu lỗi mạng/timeout (→ giữ nguyên token, retry sau)
   */
  async refresh(username: string, refreshToken: string): Promise<UisTokens | "unreachable" | null> {
    try {
      const res = await axios.post(
        `${UIS_BASE}/auth/login`,
        // username bắt buộc — thiếu nó token mới trả về "loggedoff" ngay
        new URLSearchParams({
          username,
          grant_type: "refresh_token",
          refresh_token: refreshToken,
        }).toString(),
        {
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          timeout: REQUEST_TIMEOUT,
        },
      );
      return this.parseTokens(res.data);
    } catch (e) {
      const status = (e as AxiosError).response?.status;
      if (status === 400 || status === 401 || status === 403) return null;
      this.logger.warn(`UIS refresh unreachable: ${this.errMsg(e)}`);
      return "unreachable";
    }
  }

  /** Login OAuth password-grant, chỉ lấy access token (dùng cho cron lấy ngày đầu học kỳ). */
  async oauthLogin(username: string, password: string): Promise<string | null> {
    const result = await this.login(username, password);
    return result.status === "ok" ? result.session.accessToken : null;
  }

  // ===================== RAW API =====================

  async getStudentInfo(session: UisSession): Promise<UisStudentInfo> {
    const res = await axios.post(`${UIS_BASE}/dkmh/w-locsinhvieninfo`, null, {
      headers: this.authHeaders(session, "text/plain"),
      timeout: REQUEST_TIMEOUT,
    });
    const d = res.data.data;
    return {
      fullName: d.ten_day_du,
      classCode: d.lop,
      gender: d.gioi_tinh,
      birthDate: d.ngay_sinh,
      phone: d.dien_thoai,
    };
  }

  private async getRawWeekSchedule(session: UisSession, semesterCode: string): Promise<any[]> {
    const res = await axios.post(
      `${UIS_BASE}/sch/w-locdstkbtuanusertheohocky`,
      { filter: { hoc_ky: semesterCode } },
      { headers: this.authHeaders(session), timeout: REQUEST_TIMEOUT },
    );
    return res.data.data?.ds_tuan_tkb ?? [];
  }

  private async getRawPoints(session: UisSession): Promise<any[]> {
    const res = await axios.post(`${UIS_BASE}/srm/w-locdsdiemsinhvien`, null, {
      headers: this.authHeaders(session),
      timeout: REQUEST_TIMEOUT,
    });
    return res.data.data?.ds_diem_hocky ?? [];
  }

  // ===================== NORMALIZED QUERIES =====================

  /** Số tuần trong học kỳ + tuần hiện tại theo ngày cho trước. */
  async getSemesterWeeks(session: UisSession, semesterCode: string, currentDate: Date) {
    const weeks = await this.getRawWeekSchedule(session, semesterCode);
    let currentWeek = 0;
    weeks.forEach((w: any, i: number) => {
      const start = this.parseDmy(w.ngay_bat_dau);
      const end = this.parseDmy(w.ngay_ket_thuc);
      if (start.getTime() <= currentDate.getTime() && currentDate.getTime() <= end.getTime()) {
        currentWeek = i + 1;
      }
    });
    if (weeks.length > 0 && currentWeek === 0) {
      const first = this.parseDmy(weeks[0].ngay_bat_dau);
      const last = this.parseDmy(weeks[weeks.length - 1].ngay_ket_thuc);
      if (currentDate.getTime() < first.getTime()) currentWeek = 1;
      if (currentDate.getTime() > last.getTime()) currentWeek = weeks.length;
    }
    return { totalWeeks: weeks.length, currentWeek };
  }

  /** TKB 1 tuần → mảng 7 ngày (Thứ 2 → CN). */
  async getWeekSchedule(session: UisSession, semesterCode: string, week: number): Promise<ScheduleDay[]> {
    const weeks = await this.getRawWeekSchedule(session, semesterCode);
    const weekData = weeks[week - 1];
    if (!weekData) return [];
    const monday = this.parseDmy(weekData.ngay_bat_dau);
    const days: ScheduleDay[] = Array.from({ length: 7 }, (_, i) => ({
      date: this.formatDmy(this.addDays(monday, i)),
      subjects: [],
    }));
    for (const s of weekData.ds_thoi_khoa_bieu ?? []) {
      const date = new Date(s.ngay_hoc);
      const idx = date.getDay() - 1; // 0 = CN → -1, bỏ qua
      if (idx < 0 || idx > 6) continue;
      days[idx].subjects.push({
        subjectCode: s.ma_mon,
        subjectName: s.ten_mon,
        credits: 0,
        dayOfWeek: `Thứ ${DAY_NAMES[s.thu_kieu_so] ?? ""}`,
        lecturer: s.ten_giang_vien,
        room: s.ma_phong,
        startPeriod: s.tiet_bat_dau,
        periodCount: s.so_tiet,
      });
    }
    return days;
  }

  /** Toàn bộ điểm các học kỳ (mới nhất trước). */
  async getAllPoints(session: UisSession): Promise<SemesterPoint[]> {
    const raw = await this.getRawPoints(session);
    const result: SemesterPoint[] = [];
    for (let i = raw.length - 1; i >= 0; --i) {
      const sem = raw[i];
      const hk = String(sem.hoc_ky ?? "");
      if (hk.length < 5) continue;
      const subjects: SubjectPoint[] = (sem.ds_diem_mon_hoc ?? []).map((m: any) => {
        const comp: Record<string, number> = {};
        for (const c of m.ds_diem_thanh_phan ?? []) {
          comp[c.ky_hieu] = parseFloat(c.diem_thanh_phan);
        }
        return {
          subjectCode: m.mamon,
          subjectName: m.ten_mon,
          credits: parseFloat(m.so_tin_chi) || 0,
          attendance: comp.K3 ?? null,
          midterm: comp.K1 ?? null,
          exercise: comp.B1 ?? null,
          practice: comp.K2 ?? null,
          exam: m.diem_thi ?? null,
          final: parseFloat(m.diem_tk) || null,
        };
      });
      result.push({
        year: parseInt(hk.slice(0, 4), 10),
        semester: parseInt(hk.slice(4, 5), 10),
        gpa: sem.dtb_hk_he4 === "" || sem.dtb_hk_he4 == null ? 0 : parseFloat(sem.dtb_hk_he4),
        subjects,
      });
    }
    return result;
  }

  /** GPA 2 học kỳ gần nhất (job notify). */
  async getRecentGpa(session: UisSession): Promise<RecentGpa[]> {
    const raw = await this.getRawPoints(session);
    return raw.slice(0, 2).map((sem: any) => {
      const hk = String(sem.hoc_ky);
      return {
        year: parseInt(hk.slice(0, 4), 10),
        semester: parseInt(hk.slice(4, 5), 10),
        gpa: sem.dtb_hk_he4 === "" || sem.dtb_hk_he4 == null ? 0 : parseFloat(sem.dtb_hk_he4),
      };
    });
  }

  /** Ngày bắt đầu tuần đầu tiên của học kỳ (dùng checkTKB). */
  async getFirstWeekStartDate(session: UisSession, semesterCode: string): Promise<Date | null> {
    try {
      const weeks = await this.getRawWeekSchedule(session, semesterCode);
      const raw = weeks[0]?.ngay_bat_dau;
      return raw ? this.parseDmy(raw) : null;
    } catch {
      return null;
    }
  }

  // ===================== HELPERS =====================

  private parseTokens(data: any): UisTokens | null {
    const accessToken = data?.access_token;
    const refreshToken = data?.refresh_token;
    const expiresIn = Number(data?.expires_in);
    if (!accessToken || !refreshToken) return null;
    // expires_in là "giây kể từ bây giờ" (~8h); trừ hao 60s
    const expiresAt = new Date(Date.now() + (Number.isFinite(expiresIn) ? expiresIn : 28800) * 1000 - 60_000);
    return { accessToken, refreshToken, expiresAt };
  }

  private authHeaders(session: UisSession, contentType = "application/json") {
    return {
      Authorization: `Bearer ${session.accessToken}`,
      "Content-Type": contentType,
    };
  }

  private isAuthError(e: unknown): boolean {
    const err = e as AxiosError;
    const status = err.response?.status;
    // UIS trả 400 (kèm access_token:null) cho sai credential — không phải 401
    return status === 400 || status === 401 || status === 403;
  }

  private errMsg(e: unknown): string {
    return e instanceof Error ? e.message : String(e);
  }

  private parseDmy(dmy: string): Date {
    const [d, m, y] = dmy.split("/").map(Number);
    return new Date(y, m - 1, d);
  }

  private formatDmy(d: Date): string {
    return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
  }

  private addDays(d: Date, n: number): Date {
    const r = new Date(d);
    r.setDate(r.getDate() + n);
    return r;
  }
}
