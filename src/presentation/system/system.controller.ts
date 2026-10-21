import {
  ApiDataResponse,
  ChiefAuthGuard,
  rethrowError,
  SemesterInfoDto,
  StudentAuthGuard,
} from "@app-common";
import { ISystemService, SYSTEM_PORT } from "@app-contracts";
import { SemesterInfo } from "@app-type";
import { Controller, Get, Inject, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";

@ApiTags("System")
@ApiBearerAuth()
@Controller("system")
export class SystemController {
  constructor(@Inject(SYSTEM_PORT) private readonly system: ISystemService) {}

  @Get("semester")
  @ApiOperation({ summary: "Mã học kỳ hiện tại" })
  @UseGuards(StudentAuthGuard)
  @ApiDataResponse({ type: SemesterInfoDto })
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
  @ApiDataResponse({ type: SemesterInfoDto })
  async getSemesterChief(): Promise<SemesterInfo> {
    try {
      return { semesterCode: await this.system.getCurrentSemester() };
    } catch (e) {
      rethrowError(e);
    }
  }
}
