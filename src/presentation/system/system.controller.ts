import { SystemService } from "@app-application/system";
import { ChiefAuthGuard, rethrowError, StudentAuthGuard } from "@app-common";
import { SemesterInfo } from "@app-type";
import { Controller, Get, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";

@ApiTags("System")
@ApiBearerAuth()
@Controller("system")
export class SystemController {
  constructor(private readonly system: SystemService) {}

  @Get("semester")
  @ApiOperation({ summary: "Mã học kỳ hiện tại" })
  @UseGuards(StudentAuthGuard)
  async getSemester(): Promise<SemesterInfo> {
    try {
      return { semesterCode: await this.system.getCurrentSemester() };
    } catch (e) {
      rethrowError(e);
    }
  }

  @Get("semester/chief")
  @ApiOperation({ summary: "Mã học kỳ hiện tại (chief)" })
  @UseGuards(ChiefAuthGuard)
  async getSemesterChief(): Promise<SemesterInfo> {
    try {
      return { semesterCode: await this.system.getCurrentSemester() };
    } catch (e) {
      rethrowError(e);
    }
  }
}
