import { SystemService } from "@app-application/system";
import { ChiefAuthGuard, StudentAuthGuard } from "@app-common";
import { Controller, Get, UseGuards } from "@nestjs/common";

@Controller("system")
export class SystemController {
  constructor(private readonly system: SystemService) {}

  @Get("semester")
  @UseGuards(StudentAuthGuard)
  async getSemester() {
    return { semesterCode: await this.system.getCurrentSemester() };
  }

  @Get("semester/chief")
  @UseGuards(ChiefAuthGuard)
  async getSemesterChief() {
    return { semesterCode: await this.system.getCurrentSemester() };
  }
}
