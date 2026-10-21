import { ApiResult, ChiefAuthGuard, StudentAuthGuard } from "@app-common";
import { PrismaService } from "@app-infra/prisma";
import { Body, Controller, Get, Param, Put, UseGuards } from "@nestjs/common";
import { IsOptional, IsString } from "class-validator";

class UpdateTeacherDto {
  @IsOptional()
  @IsString()
  birthDate?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  academicRank?: string;

  @IsOptional()
  @IsString()
  degree?: string;
}

@Controller("teachers")
export class TeachersController {
  constructor(private readonly prisma: PrismaService) {}

  /** Danh bạ giảng viên. */
  @Get()
  @UseGuards(StudentAuthGuard)
  async list() {
    const teachers = await this.prisma.teacher.findMany({ orderBy: { teacherCode: "asc" } });
    return new ApiResult("Thành công", teachers);
  }

  /** Sửa thông tin GV — giới hạn chief (legacy để mở cho mọi SV, đó là bug). */
  @Put(":teacherCode")
  @UseGuards(ChiefAuthGuard)
  async update(@Param("teacherCode") teacherCode: string, @Body() dto: UpdateTeacherDto) {
    await this.prisma.teacher.update({ where: { teacherCode }, data: dto });
    return new ApiResult("Thành công", null);
  }
}
