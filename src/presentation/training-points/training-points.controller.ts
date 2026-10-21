import { TrainingPointsService } from "@app-application/training-points";
import { ApiResult, ChiefAuthGuard, CurrentUser, rethrowError, StudentAuthGuard } from "@app-common";
import { UploadedFilePayload } from "@app-type";
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FilesInterceptor } from "@nestjs/platform-express";
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiParam, ApiTags } from "@nestjs/swagger";
import { ReviewPointDto, SelfAssessDto, ToggleStatusDto } from "./dto";

/** Điểm rèn luyện — tự chấm (student) + duyệt (chief). */
@ApiTags("Training Points")
@ApiBearerAuth()
@Controller("training-points")
export class TrainingPointsController {
  constructor(private readonly service: TrainingPointsService) {}

  // ---------- Student ----------

  /** Form tiêu chí + điểm của mình. */
  @Get("form")
  @ApiOperation({ summary: "Form tiêu chí + điểm của mình" })
  @UseGuards(StudentAuthGuard)
  async getForm(@CurrentUser("studentCode") code: string) {
    try {
      return new ApiResult("Lấy điểm rèn luyện thành công", await this.service.getFormWithPoints(code));
    } catch (e) {
      rethrowError(e);
    }
  }

  /** SV tự chấm. */
  @Post("self")
  @ApiOperation({ summary: "SV tự chấm điểm 1 tiêu chí" })
  @UseGuards(StudentAuthGuard)
  async selfAssess(@CurrentUser("studentCode") code: string, @Body() dto: SelfAssessDto) {
    try {
      await this.service.selfAssess(code, dto.formId, dto.point);
      return new ApiResult("Thành công", null);
    } catch (e) {
      rethrowError(e);
    }
  }

  /** Upload minh chứng (multipart: files[] + title). */
  @Post("certificates")
  @ApiOperation({ summary: "Upload minh chứng (multipart: files[] + title)" })
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      required: ["title", "files"],
      properties: {
        title: { type: "string" },
        files: { type: "array", items: { type: "string", format: "binary" } },
      },
    },
  })
  @UseGuards(StudentAuthGuard)
  @UseInterceptors(FilesInterceptor("files", 10, { limits: { fileSize: 10 * 1024 * 1024 } }))
  async uploadCert(
    @CurrentUser("studentCode") code: string,
    @Body("title") title: string,
    @UploadedFiles() files: UploadedFilePayload[],
  ) {
    try {
      await this.service.uploadCertificate(code, title ?? "", files ?? []);
      return new ApiResult("Thành công", null);
    } catch (e) {
      rethrowError(e);
    }
  }

  /** Minh chứng của mình (sự kiện đã check-in + cert upload). */
  @Get("certificates")
  @ApiOperation({ summary: "Minh chứng của mình (sự kiện + cert upload)" })
  @UseGuards(StudentAuthGuard)
  async getCerts(@CurrentUser("studentCode") code: string) {
    try {
      return new ApiResult("Lấy danh sách chứng nhận thành công", await this.service.getCertificates(code));
    } catch (e) {
      rethrowError(e);
    }
  }

  // ---------- Chief ----------

  @Get("status")
  @ApiOperation({ summary: "Trạng thái mở/khoá chấm điểm của lớp (chief)" })
  @UseGuards(ChiefAuthGuard)
  async getStatus(@CurrentUser("studentCode") code: string) {
    try {
      return new ApiResult("Lấy trạng thái điểm rèn luyện thành công", await this.service.getStatus(code));
    } catch (e) {
      rethrowError(e);
    }
  }

  @Post("status")
  @ApiOperation({ summary: "Mở/khoá chấm điểm cho lớp (chief)" })
  @UseGuards(ChiefAuthGuard)
  async setStatus(@CurrentUser("studentCode") code: string, @Body() dto: ToggleStatusDto) {
    try {
      await this.service.setStatus(code, dto.isOpen);
      return new ApiResult("Thành công", null);
    } catch (e) {
      rethrowError(e);
    }
  }

  /** Điểm cả lớp (1 query). */
  @Get("class")
  @ApiOperation({ summary: "Điểm rèn luyện cả lớp (chief)" })
  @UseGuards(ChiefAuthGuard)
  async getClassPoints(@CurrentUser("studentCode") code: string) {
    try {
      return new ApiResult("Lấy điểm rèn luyện lớp thành công", await this.service.getClassPoints(code));
    } catch (e) {
      rethrowError(e);
    }
  }

  /** Điểm 1 SV trong lớp. */
  @Get("students/:studentCode")
  @ApiOperation({ summary: "Điểm 1 SV trong lớp (chief)" })
  @ApiParam({ name: "studentCode", example: "N18DCPT064" })
  @UseGuards(ChiefAuthGuard)
  async getStudentPoints(@Param("studentCode") studentCode: string) {
    try {
      return new ApiResult(
        "Lấy điểm rèn luyện thành công",
        await this.service.getFormWithPoints(studentCode.toUpperCase()),
      );
    } catch (e) {
      rethrowError(e);
    }
  }

  /** Minh chứng của 1 SV trong lớp. */
  @Get("students/:studentCode/certificates")
  @ApiOperation({ summary: "Minh chứng của 1 SV trong lớp (chief)" })
  @UseGuards(ChiefAuthGuard)
  async getStudentCerts(@Param("studentCode") studentCode: string) {
    try {
      return new ApiResult(
        "Lấy danh sách chứng nhận thành công",
        await this.service.getCertificates(studentCode.toUpperCase()),
      );
    } catch (e) {
      rethrowError(e);
    }
  }

  /** Chief chấm điểm cho SV. */
  @Post("review")
  @ApiOperation({ summary: "Chief chấm điểm cho SV" })
  @UseGuards(ChiefAuthGuard)
  async review(@CurrentUser("studentCode") code: string, @Body() dto: ReviewPointDto) {
    try {
      await this.service.reviewPoint(code, dto.studentCode.toUpperCase(), dto.formId, dto.point);
      return new ApiResult("Thành công", null);
    } catch (e) {
      rethrowError(e);
    }
  }

  @Delete(":pointId")
  @ApiOperation({ summary: "Xoá 1 điểm (chief)" })
  @UseGuards(ChiefAuthGuard)
  async deletePoint(
    @CurrentUser("studentCode") code: string,
    @Param("pointId", ParseIntPipe) pointId: number,
  ) {
    try {
      await this.service.deletePoint(code, pointId);
      return new ApiResult("Thành công", null);
    } catch (e) {
      rethrowError(e);
    }
  }

  /** Reset điểm + minh chứng cả lớp (role 3/4). */
  @Post("reset")
  @ApiOperation({ summary: "Reset điểm + minh chứng cả lớp — role 3/4 (chief)" })
  @UseGuards(ChiefAuthGuard)
  async reset(@CurrentUser("studentCode") code: string, @CurrentUser("role") role: number) {
    try {
      await this.service.resetClass(code, role);
      return new ApiResult("Thành công", null);
    } catch (e) {
      rethrowError(e);
    }
  }
}
