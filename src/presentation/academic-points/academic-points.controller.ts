import { ApiDataResponse, CurrentUser, rethrowError, SemesterPointDto, StudentAuthGuard } from "@app-common";
import { IUisService, IUisSessionService, UIS_PORT, UIS_SESSION_PORT } from "@app-contracts";
import { SemesterPoint } from "@app-type";
import { Controller, Get, Inject, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";

/** Điểm học tập — crawl trực tiếp UIS. */
@ApiTags("Academic Points")
@ApiBearerAuth()
@Controller("academic-points")
@UseGuards(StudentAuthGuard)
export class AcademicPointsController {
  constructor(
    @Inject(UIS_PORT) private readonly uis: IUisService,
    @Inject(UIS_SESSION_PORT) private readonly session: IUisSessionService,
  ) {}

  @Get()
  @ApiOperation({ summary: "Điểm học tập toàn khoá — crawl trực tiếp UIS" })
  @ApiDataResponse({ type: SemesterPointDto, isArray: true })
  async getPoints(@CurrentUser("studentCode") code: string): Promise<SemesterPoint[]> {
    try {
      const sess = await this.session.getSession(code);
      return this.uis.getAllPoints(sess);
    } catch (e) {
      rethrowError(e);
    }
  }
}
