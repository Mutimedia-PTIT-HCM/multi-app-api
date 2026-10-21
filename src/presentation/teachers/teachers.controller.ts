import { TeachersService } from "@app-application/teachers";
import { ApiResult, ChiefAuthGuard, PaginationQueryDto, rethrowError, StudentAuthGuard } from "@app-common";
import { Body, Controller, Get, Param, Put, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { UpdateTeacherDto } from "./dto";

@ApiTags("Teachers")
@ApiBearerAuth()
@Controller("teachers")
export class TeachersController {
  constructor(private readonly teachers: TeachersService) {}

  /** Danh bạ giảng viên. */
  @Get()
  @ApiOperation({ summary: "Danh bạ giảng viên — phân trang" })
  @UseGuards(StudentAuthGuard)
  async list(@Query() q: PaginationQueryDto) {
    try {
      return new ApiResult("Thành công", await this.teachers.list(q));
    } catch (e) {
      rethrowError(e);
    }
  }

  /** Sửa thông tin GV — giới hạn chief (legacy để mở cho mọi SV, đó là bug). */
  @Put(":teacherCode")
  @ApiOperation({ summary: "Sửa thông tin giảng viên (chief)" })
  @UseGuards(ChiefAuthGuard)
  async update(@Param("teacherCode") teacherCode: string, @Body() dto: UpdateTeacherDto) {
    try {
      await this.teachers.update(teacherCode, dto);
      return new ApiResult("Thành công", null);
    } catch (e) {
      rethrowError(e);
    }
  }
}
