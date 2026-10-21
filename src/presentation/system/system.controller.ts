import { SystemService } from "@app-application/system";
import { ChiefAuthGuard, rethrowError, StudentAuthGuard } from "@app-common";
import { Controller, Get, UseGuards } from "@nestjs/common";

@Controller("system")
export class SystemController {
  constructor(private readonly system: SystemService) {}

  @Get("semester")
  @UseGuards(StudentAuthGuard)
  async getSemester() {
    try {
      return { semesterCode: await this.system.getCurrentSemester() };
    } catch (e) {
      rethrowError(e);
    }
  }

  @Get("semester/chief")
  @UseGuards(ChiefAuthGuard)
  async getSemesterChief() {
    try {
      return { semesterCode: await this.system.getCurrentSemester() };
    } catch (e) {
      rethrowError(e);
    }
  }
}
