import { SystemService } from "@app-application/system";
import { AppException, CurrentUser, rethrowError, SCHEDULE_ERRORS, StudentAuthGuard } from "@app-common";
import { UisService, UisSessionService } from "@app-infra/uis";
import { Controller, Get, HttpStatus, Param, ParseIntPipe, Query, UseGuards } from "@nestjs/common";

@Controller("schedule")
@UseGuards(StudentAuthGuard)
export class ScheduleController {
  constructor(
    private readonly uis: UisService,
    private readonly session: UisSessionService,
    private readonly system: SystemService,
  ) {}

  /** Số tuần của học kỳ hiện tại + tuần hiện tại — ?date=dd/mm/yyyy */
  @Get("weeks")
  async getWeeks(@CurrentUser("studentCode") code: string, @Query("date") date?: string) {
    try {
      const sess = await this.session.getSession(code);
      const semester = await this.system.getCurrentSemester();
      const { totalWeeks, currentWeek } = await this.uis.getSemesterWeeks(
        sess,
        semester,
        this.parseDate(date),
      );
      return { totalWeeks, currentWeek, semesterCode: semester };
    } catch (e) {
      rethrowError(e);
    }
  }

  /** TKB chi tiết 1 tuần. */
  @Get("weeks/:week")
  async getWeek(
    @CurrentUser("studentCode") code: string,
    @Param("week", ParseIntPipe) week: number,
    @Query("date") _date?: string,
  ) {
    try {
      if (week < 1) throw new AppException(HttpStatus.BAD_REQUEST, SCHEDULE_ERRORS.INVALID_WEEK);
      const sess = await this.session.getSession(code);
      const semester = await this.system.getCurrentSemester();
      const days = await this.uis.getWeekSchedule(sess, semester, week);
      return { week, semesterCode: semester, days };
    } catch (e) {
      rethrowError(e);
    }
  }

  private parseDate(dmy?: string): Date {
    if (!dmy) return new Date();
    const [d, m, y] = dmy.split("/").map(Number);
    if (!d || !m || !y) return new Date();
    return new Date(y, m - 1, d);
  }
}
