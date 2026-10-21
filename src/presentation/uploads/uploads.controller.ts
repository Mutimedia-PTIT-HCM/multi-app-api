import { UploadsService } from "@app-application/uploads";
import {
  ApiDataResponse,
  ApiResult,
  PresignedUploadDto,
  Public,
  rethrowError,
  StudentAuthGuard,
  UploadedKeyDto,
} from "@app-common";
import { PresignedUpload, UploadPurpose } from "@app-type";
import { Body, Controller, HttpCode, Param, Post, Put, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import { RequestUploadDto } from "./dto";

@ApiTags("Uploads")
@Controller("uploads")
export class UploadsController {
  constructor(private readonly uploads: UploadsService) {}

  /**
   * Bước 1: xin quyền upload → trả uploadUrl + key.
   * Client PUT binary file lên uploadUrl (Content-Type đúng như response),
   * sau đó truyền `key` vào API nghiệp vụ (avatar/product/notification...).
   */
  @Post("presign")
  @UseGuards(StudentAuthGuard)
  @ApiBearerAuth()
  @HttpCode(200)
  @ApiOperation({ summary: "Xin quyền upload — trả presigned URL + key" })
  @ApiDataResponse({ type: PresignedUploadDto })
  async presign(@Body() dto: RequestUploadDto): Promise<ApiResult<PresignedUpload>> {
    try {
      const data = await this.uploads.requestUpload(
        dto.purpose as UploadPurpose,
        dto.fileName,
        dto.contentType,
      );
      return new ApiResult("Lấy quyền upload thành công", data);
    } catch (e) {
      rethrowError(e);
    }
  }

  /**
   * Bước 2 (chỉ local dev, không dùng R2): PUT binary file theo token đã ký.
   * Endpoint public — bảo mật nằm ở chữ ký token ngắn hạn trong URL.
   */
  @Put("local/:token")
  @Public()
  @HttpCode(200)
  @ApiBody({ schema: { type: "string", format: "binary" } })
  @ApiOperation({ summary: "Upload binary (local dev only) — theo token từ presign" })
  @ApiDataResponse({ type: UploadedKeyDto })
  async receiveLocal(
    @Param("token") token: string,
    @Req() req: Request,
  ): Promise<ApiResult<{ key: string }>> {
    try {
      const body = Buffer.isBuffer(req.body) ? req.body : undefined;
      const data = await this.uploads.receiveLocalUpload(token, body);
      return new ApiResult("Upload thành công", data);
    } catch (e) {
      rethrowError(e);
    }
  }
}
