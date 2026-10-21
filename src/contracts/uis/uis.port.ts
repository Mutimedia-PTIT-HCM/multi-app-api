import type {
  RecentGpa,
  ScheduleDay,
  SemesterPoint,
  UisLoginResult,
  UisSession,
  UisStudentInfo,
  UisTokens,
} from "@app-type";

/** Port giao tiếp UIS (trường). */
export interface IUisService {
  login(username: string, password: string): Promise<UisLoginResult>;
  refresh(username: string, refreshToken: string): Promise<UisTokens | "unreachable" | null>;
  oauthLogin(username: string, password: string): Promise<string | null>;
  getStudentInfo(session: UisSession): Promise<UisStudentInfo>;
  getSemesterWeeks(
    session: UisSession,
    semesterCode: string,
    currentDate: Date,
  ): Promise<{ totalWeeks: number; currentWeek: number }>;
  getWeekSchedule(session: UisSession, semesterCode: string, week: number): Promise<ScheduleDay[]>;
  getAllPoints(session: UisSession): Promise<SemesterPoint[]>;
  getRecentGpa(session: UisSession): Promise<RecentGpa[]>;
  getFirstWeekStartDate(session: UisSession, semesterCode: string): Promise<Date | null>;
}
