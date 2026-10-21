import { ClassesService } from "@app-application/classes";
import { ApiResult, ChiefAuthGuard, CurrentUser } from "@app-common";
import { BadRequestException, Body, Controller, ForbiddenException, Put, UseGuards } from "@nestjs/common";
import { IsInt, IsNotEmpty, IsString, Max, Min } from "class-validator";

class UpdateRoleDto {
  @IsString()
  @IsNotEmpty()
  studentCode!: string;

  @IsInt()
  @Min(0)
  @Max(7)
  role!: number;
}

@Controller("classes")
@UseGuards(ChiefAuthGuard)
export class ClassesController {
  constructor(private readonly classes: ClassesService) {}

  /** Đổi role của 1 SV: role 7 set tuỳ ý (<8); role 3 set trừ 7 (giữ rule legacy). */
  @Put("role")
  async updateRole(@CurrentUser() user: { studentCode: string; role: number }, @Body() dto: UpdateRoleDto) {
    if (user.role === 7) {
      // full quyền
    } else if (user.role === 3) {
      if (dto.role === 7) throw new ForbiddenException("Không có quyền chỉnh sửa");
    } else {
      throw new ForbiddenException("Không có quyền chỉnh sửa");
    }
    await this.classes.updateRole(dto.studentCode.toUpperCase(), dto.role);
    return new ApiResult("Thay đổi thành công", null);
  }

  /** Crawl lại malop toàn khoá từ UIS — job nền (BullMQ), trả ngay jobId. */
  @Put("sync")
  async syncClass(@CurrentUser() user: { studentCode: string; role: number }) {
    if (user.role === 6 || user.role === 0) {
      throw new BadRequestException("Chỉ có ban chấp hành/ban cán sự lớp mới có thể cập nhật");
    }
    const jobId = await this.classes.queueClassSync(user.studentCode);
    return new ApiResult("Đã xếp hàng đợi cập nhật", { jobId });
  }
}
