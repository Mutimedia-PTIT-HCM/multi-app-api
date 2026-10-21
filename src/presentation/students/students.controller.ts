import { StudentsService } from "@app-application/students";
import {
  ApiResult,
  ChiefAuthGuard,
  CurrentUser,
  PaginationQueryDto,
  rethrowError,
  StudentAuthGuard,
} from "@app-common";
import { UploadedFilePayload } from "@app-type";
import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { UpdateProfileDto } from "./dto/update-profile.dto";

@Controller("students")
export class StudentsController {
  constructor(private readonly students: StudentsService) {}

  /** Tìm sinh viên theo tên/mssv — GET /students?search= */
  @Get()
  @UseGuards(StudentAuthGuard)
  async search(
    @Query("search") search: string,
    @CurrentUser("studentCode") code: string,
    @Query() q: PaginationQueryDto,
  ) {
    try {
      return new ApiResult("Thành công", await this.students.search(search ?? "", code, q));
    } catch (e) {
      rethrowError(e);
    }
  }

  /** Hồ sơ của chính mình. */
  @Get("me")
  @UseGuards(StudentAuthGuard)
  async getMe(@CurrentUser("studentCode") code: string) {
    try {
      return new ApiResult("Lấy thông tin thành công", await this.students.getByCode(code));
    } catch (e) {
      rethrowError(e);
    }
  }

  /** Thông tin 1 sinh viên. */
  @Get(":studentCode")
  @UseGuards(StudentAuthGuard)
  async getOne(@Param("studentCode") studentCode: string) {
    try {
      return new ApiResult("Lấy thông tin sinh viên thành công", await this.students.getByCode(studentCode));
    } catch (e) {
      rethrowError(e);
    }
  }

  /** Cập nhật hồ sơ + avatar (multipart: file field `avatar`). */
  @Patch("me/profile")
  @UseGuards(StudentAuthGuard)
  @UseInterceptors(FileInterceptor("avatar", { limits: { fileSize: 5 * 1024 * 1024 } }))
  async updateProfile(
    @CurrentUser("studentCode") code: string,
    @Body() dto: UpdateProfileDto,
    @UploadedFile() avatar?: UploadedFilePayload,
  ) {
    try {
      await this.students.updateProfile(code, dto, avatar);
      return new ApiResult("Cập nhật thông tin thành công", null);
    } catch (e) {
      rethrowError(e);
    }
  }

  /** Danh sách thành viên lớp mình (chief). */
  @Get("me/class-members")
  @UseGuards(ChiefAuthGuard)
  async classMembers(@CurrentUser("studentCode") code: string, @Query() q: PaginationQueryDto) {
    try {
      return new ApiResult("Lấy danh sách lớp thành công", await this.students.getClassMembers(code, q));
    } catch (e) {
      rethrowError(e);
    }
  }
}
