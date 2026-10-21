import { SystemService } from "@app-application/system";
import { CurrentUser, StudentAuthGuard } from "@app-common";
import { UisService, UisSessionService } from "@app-infra/uis";
import { BadRequestException, Controller, Get, Param, ParseIntPipe, Query, UseGuards } from "@nestjs/common";

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
    const sess = await this.session.getSession(code);
    const semester = await this.system.getCurrentSemester();
    const { totalWeeks, currentWeek } = await this.uis.getSemesterWeeks(sess, semester, this.parseDate(date));
    return { totalWeeks, currentWeek, semesterCode: semester };
  }

  /** TKB chi tiết 1 tuần. */
  @Get("weeks/:week")
  async getWeek(
    @CurrentUser("studentCode") code: string,
    @Param("week", ParseIntPipe) week: number,
    @Query("date") _date?: string,
  ) {
    if (week < 1) throw new BadRequestException("Tuần không hợp lệ");
    const sess = await this.session.getSession(code);
    const semester = await this.system.getCurrentSemester();
    const days = await this.uis.getWeekSchedule(sess, semester, week);
    return { week, semesterCode: semester, days };
  }

  private parseDate(dmy?: string): Date {
    if (!dmy) return new Date();
    const [d, m, y] = dmy.split("/").map(Number);
    if (!d || !m || !y) return new Date();
    return new Date(y, m - 1, d);
  }
}
