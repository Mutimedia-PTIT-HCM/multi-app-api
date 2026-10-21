import {
  ApiDataResponse,
  AppException,
  CurrentUser,
  rethrowError,
  SCHEDULE_ERRORS,
  SemesterWeeksDto,
  StudentAuthGuard,
  WeekScheduleDto,
} from "@app-common";
import {
  ISystemService,
  IUisService,
  IUisSessionService,
  SYSTEM_PORT,
  UIS_PORT,
  UIS_SESSION_PORT,
} from "@app-contracts";
import { SemesterWeeks, WeekSchedule } from "@app-type";
import { Controller, Get, HttpStatus, Inject, Param, ParseIntPipe, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from "@nestjs/swagger";

@ApiTags("Schedule")
@ApiBearerAuth()
@Controller("schedule")
@UseGuards(StudentAuthGuard)
export class ScheduleController {
  constructor(
    @Inject(UIS_PORT) private readonly uis: IUisService,
    @Inject(UIS_SESSION_PORT) private readonly session: IUisSessionService,
    @Inject(SYSTEM_PORT) private readonly system: ISystemService,
  ) {}

  /** Số tuần của học kỳ hiện tại + tuần hiện tại — ?date=dd/mm/yyyy */
  @Get("weeks")
  @ApiOperation({ summary: "Số tuần của học kỳ hiện tại + tuần hiện tại" })
  @ApiQuery({ name: "date", required: false, example: "20/10/2025", description: "dd/mm/yyyy" })
  @ApiDataResponse({ type: SemesterWeeksDto })
  async getWeeks(
    @CurrentUser("studentCode") code: string,
    @Query("date") date?: string,
  ): Promise<SemesterWeeks> {
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
  @ApiOperation({ summary: "TKB chi tiết 1 tuần" })
  @ApiQuery({ name: "date", required: false, description: "dd/mm/yyyy" })
  @ApiDataResponse({ type: WeekScheduleDto })
  async getWeek(
    @CurrentUser("studentCode") code: string,
    @Param("week", ParseIntPipe) week: number,
    @Query("date") _date?: string,
  ): Promise<WeekSchedule> {
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
