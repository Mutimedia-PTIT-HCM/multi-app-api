import { CurrentUser, rethrowError, StudentAuthGuard } from "@app-common";
import { UisService, UisSessionService } from "@app-infra/uis";
import { SemesterPoint } from "@app-type";
import { Controller, Get, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";

/** Điểm học tập — crawl trực tiếp UIS. */
@ApiTags("Academic Points")
@ApiBearerAuth()
@Controller("academic-points")
@UseGuards(StudentAuthGuard)
export class AcademicPointsController {
  constructor(
    private readonly uis: UisService,
    private readonly session: UisSessionService,
  ) {}

  @Get()
  @ApiOperation({ summary: "Điểm học tập toàn khoá — crawl trực tiếp UIS" })
  async getPoints(@CurrentUser("studentCode") code: string): Promise<SemesterPoint[]> {
    try {
      const sess = await this.session.getSession(code);
      return this.uis.getAllPoints(sess);
    } catch (e) {
      rethrowError(e);
    }
  }
}
