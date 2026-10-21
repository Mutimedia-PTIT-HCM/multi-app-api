import { ApiResult, ChiefAuthGuard, rethrowError, StudentAuthGuard } from "@app-common";
import { PrismaService } from "@app-infra/prisma";
import { Body, Controller, Get, Param, Put, UseGuards } from "@nestjs/common";
import { UpdateTeacherDto } from "./dto";

@Controller("teachers")
export class TeachersController {
  constructor(private readonly prisma: PrismaService) {}

  /** Danh bạ giảng viên. */
  @Get()
  @UseGuards(StudentAuthGuard)
  async list() {
    try {
      const teachers = await this.prisma.teacher.findMany({ orderBy: { teacherCode: "asc" } });
      return new ApiResult("Thành công", teachers);
    } catch (e) {
      rethrowError(e);
    }
  }

  /** Sửa thông tin GV — giới hạn chief (legacy để mở cho mọi SV, đó là bug). */
  @Put(":teacherCode")
  @UseGuards(ChiefAuthGuard)
  async update(@Param("teacherCode") teacherCode: string, @Body() dto: UpdateTeacherDto) {
    try {
      await this.prisma.teacher.update({ where: { teacherCode }, data: dto });
      return new ApiResult("Thành công", null);
    } catch (e) {
      rethrowError(e);
    }
  }
}
