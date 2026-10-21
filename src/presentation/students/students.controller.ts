import { StudentsService } from "@app-application/students";
import {
  ApiDataResponse,
  ApiResult,
  ChiefAuthGuard,
  ClassMemberDto,
  CurrentUser,
  PaginationQueryDto,
  PublicStudentDto,
  rethrowError,
  StudentAuthGuard,
  StudentSearchItemDto,
} from "@app-common";
import {
  ClassMember,
  PaginatedResult,
  PublicStudent,
  StudentSearchItem,
  UploadedFilePayload,
} from "@app-type";
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
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from "@nestjs/swagger";
import { UpdateProfileDto } from "./dto";

@ApiTags("Students")
@ApiBearerAuth()
@Controller("students")
export class StudentsController {
  constructor(private readonly students: StudentsService) {}

  /** Tìm sinh viên theo tên/mssv — GET /students?search= */
  @Get()
  @ApiOperation({ summary: "Tìm sinh viên theo tên/mssv — phân trang" })
  @ApiQuery({ name: "search", required: false, description: "Tên hoặc MSSV" })
  @UseGuards(StudentAuthGuard)
  @ApiDataResponse({ type: StudentSearchItemDto, paginated: true })
  async search(
    @Query("search") search: string,
    @CurrentUser("studentCode") code: string,
    @Query() q: PaginationQueryDto,
  ): Promise<ApiResult<PaginatedResult<StudentSearchItem>>> {
    try {
      return new ApiResult("Thành công", await this.students.search(search ?? "", code, q));
    } catch (e) {
      rethrowError(e);
    }
  }

  /** Hồ sơ của chính mình. */
  @Get("me")
  @ApiOperation({ summary: "Hồ sơ của chính mình" })
  @UseGuards(StudentAuthGuard)
  @ApiDataResponse({ type: PublicStudentDto })
  async getMe(@CurrentUser("studentCode") code: string): Promise<ApiResult<PublicStudent>> {
    try {
      return new ApiResult("Lấy thông tin thành công", await this.students.getByCode(code));
    } catch (e) {
      rethrowError(e);
    }
  }

  /** Thông tin 1 sinh viên. */
  @Get(":studentCode")
  @ApiOperation({ summary: "Thông tin public của 1 sinh viên" })
  @ApiParam({ name: "studentCode", example: "N18DCPT064" })
  @UseGuards(StudentAuthGuard)
  @ApiDataResponse({ type: PublicStudentDto })
  async getOne(@Param("studentCode") studentCode: string): Promise<ApiResult<PublicStudent>> {
    try {
      return new ApiResult("Lấy thông tin sinh viên thành công", await this.students.getByCode(studentCode));
    } catch (e) {
      rethrowError(e);
    }
  }

  /** Cập nhật hồ sơ + avatar (multipart: file field `avatar`). */
  @Patch("me/profile")
  @ApiOperation({ summary: "Cập nhật hồ sơ + avatar (multipart)" })
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        facebook: { type: "string" },
        personalEmail: { type: "string" },
        phone: { type: "string" },
        hidePersonalEmail: { type: "boolean" },
        hideFacebook: { type: "boolean" },
        hidePhone: { type: "boolean" },
        avatar: { type: "string", format: "binary" },
      },
    },
  })
  @UseGuards(StudentAuthGuard)
  @UseInterceptors(FileInterceptor("avatar", { limits: { fileSize: 5 * 1024 * 1024 } }))
  @ApiDataResponse()
  async updateProfile(
    @CurrentUser("studentCode") code: string,
    @Body() dto: UpdateProfileDto,
    @UploadedFile() avatar?: UploadedFilePayload,
  ): Promise<ApiResult<null>> {
    try {
      await this.students.updateProfile(code, dto, avatar);
      return new ApiResult("Cập nhật thông tin thành công", null);
    } catch (e) {
      rethrowError(e);
    }
  }

  /** Danh sách thành viên lớp mình (chief). */
  @Get("me/class-members")
  @ApiOperation({ summary: "Danh sách thành viên lớp mình (chief) — phân trang" })
  @UseGuards(ChiefAuthGuard)
  @ApiDataResponse({ type: ClassMemberDto, paginated: true })
  async classMembers(
    @CurrentUser("studentCode") code: string,
    @Query() q: PaginationQueryDto,
  ): Promise<ApiResult<PaginatedResult<ClassMember>>> {
    try {
      return new ApiResult("Lấy danh sách lớp thành công", await this.students.getClassMembers(code, q));
    } catch (e) {
      rethrowError(e);
    }
  }
}
