import { ClassesService } from "@app-application/classes";
import {
  ApiDataResponse,
  ApiResult,
  AppException,
  ChiefAuthGuard,
  CLASS_ERRORS,
  CurrentUser,
  JobIdDto,
  rethrowError,
} from "@app-common";
import { Body, Controller, HttpStatus, Put, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { UpdateRoleDto } from "./dto";

@ApiTags("Classes")
@ApiBearerAuth()
@Controller("classes")
@UseGuards(ChiefAuthGuard)
export class ClassesController {
  constructor(private readonly classes: ClassesService) {}

  /** Đổi role của 1 SV: role 7 set tuỳ ý (<8); role 3 set trừ 7 (giữ rule legacy). */
  @Put("role")
  @ApiOperation({ summary: "Đổi role của 1 SV (role 7 full quyền, role 3 trừ 7)" })
  @ApiDataResponse()
  async updateRole(
    @CurrentUser() user: { studentCode: string; role: number },
    @Body() dto: UpdateRoleDto,
  ): Promise<ApiResult<null>> {
    try {
      if (user.role === 7) {
        // full quyền
      } else if (user.role === 3) {
        if (dto.role === 7) {
          throw new AppException(HttpStatus.FORBIDDEN, CLASS_ERRORS.CANNOT_EDIT_ROLE);
        }
      } else {
        throw new AppException(HttpStatus.FORBIDDEN, CLASS_ERRORS.CANNOT_EDIT_ROLE);
      }
      await this.classes.updateRole(dto.studentCode.toUpperCase(), dto.role);
      return new ApiResult("Thay đổi thành công", null);
    } catch (e) {
      rethrowError(e);
    }
  }

  /** Crawl lại malop toàn khoá từ UIS — job nền (BullMQ), trả ngay jobId. */
  @Put("sync")
  @ApiOperation({ summary: "Crawl lại malop toàn khoá từ UIS — job nền, trả jobId" })
  @ApiDataResponse({ type: JobIdDto })
  async syncClass(
    @CurrentUser("studentCode") code: string,
    @CurrentUser("role") role: number,
  ): Promise<ApiResult<{ jobId: string }>> {
    try {
      if (role === 6 || role === 0) {
        throw new AppException(HttpStatus.BAD_REQUEST, CLASS_ERRORS.COMMITTEE_ONLY);
      }
      const jobId = await this.classes.queueClassSync(code);
      return new ApiResult("Đã xếp hàng đợi cập nhật", { jobId });
    } catch (e) {
      rethrowError(e);
    }
  }
}
