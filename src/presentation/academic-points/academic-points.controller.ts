import { CurrentUser, rethrowError, StudentAuthGuard } from "@app-common";
import { UisService, UisSessionService } from "@app-infra/uis";
import { Controller, Get, UseGuards } from "@nestjs/common";

/** Điểm học tập — crawl trực tiếp UIS. */
@Controller("academic-points")
@UseGuards(StudentAuthGuard)
export class AcademicPointsController {
  constructor(
    private readonly uis: UisService,
    private readonly session: UisSessionService,
  ) {}

  @Get()
  async getPoints(@CurrentUser("studentCode") code: string) {
    try {
      const sess = await this.session.getSession(code);
      return this.uis.getAllPoints(sess);
    } catch (e) {
      rethrowError(e);
    }
  }
}
