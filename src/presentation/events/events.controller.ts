import { EventsService } from "@app-application/events";
import {
  ApiResult,
  ChiefAuthGuard,
  CurrentUser,
  PaginationQueryDto,
  rethrowError,
  StudentAuthGuard,
} from "@app-common";
import { AttendanceItem, EventItem, PaginatedResult, UploadedFilePayload } from "@app-type";
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiTags } from "@nestjs/swagger";
import { Response } from "express";

@ApiTags("Events")
@ApiBearerAuth()
@Controller("events")
export class EventsController {
  constructor(private readonly events: EventsService) {}

  // ---------- Student ----------

  /** Danh sách sự kiện — ?page=&limit= (?limit=3 lấy 3 mới nhất). */
  @Get()
  @ApiOperation({ summary: "Danh sách sự kiện — phân trang" })
  @UseGuards(StudentAuthGuard)
  async list(@Query() q: PaginationQueryDto): Promise<ApiResult<PaginatedResult<EventItem>>> {
    try {
      return new ApiResult("Thành công", await this.events.list(q));
    } catch (e) {
      rethrowError(e);
    }
  }

  /** Check-in sự kiện. */
  @Post(":eventCode/check-in")
  @ApiOperation({ summary: "Check-in sự kiện" })
  @ApiBody({ schema: { type: "object", properties: { location: { type: "string", example: "PTIT HCM" } } } })
  @UseGuards(StudentAuthGuard)
  async checkIn(
    @CurrentUser("studentCode") code: string,
    @Param("eventCode") eventCode: string,
    @Body("location") location?: string,
  ): Promise<ApiResult<null>> {
    try {
      await this.events.checkIn(code, eventCode, location);
      return new ApiResult("Check in thành công, chúc bạn tham gia sự kiện vui vẻ", null);
    } catch (e) {
      rethrowError(e);
    }
  }

  // ---------- Chief ----------

  /** Đăng sự kiện (multipart: file `thumb` + title/content). */
  @Post()
  @ApiOperation({ summary: "Đăng sự kiện (multipart: thumb + title/content) (chief)" })
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      required: ["title", "content", "thumb"],
      properties: {
        title: { type: "string" },
        content: { type: "string" },
        thumb: { type: "string", format: "binary" },
      },
    },
  })
  @UseGuards(ChiefAuthGuard)
  @UseInterceptors(FileInterceptor("thumb", { limits: { fileSize: 10 * 1024 * 1024 } }))
  async create(
    @CurrentUser("studentCode") code: string,
    @Body("title") title: string,
    @Body("content") content: string,
    @UploadedFile() thumb?: UploadedFilePayload,
  ): Promise<ApiResult<EventItem>> {
    try {
      const event = await this.events.create(code, title ?? "", content ?? "", thumb);
      return new ApiResult("Thành công", event);
    } catch (e) {
      rethrowError(e);
    }
  }

  @Delete(":eventCode")
  @ApiOperation({ summary: "Xoá sự kiện (chief)" })
  @UseGuards(ChiefAuthGuard)
  async remove(
    @Param("eventCode") eventCode: string,
    @CurrentUser("studentCode") code: string,
    @CurrentUser("role") role: number,
  ): Promise<ApiResult<null>> {
    try {
      await this.events.remove(eventCode, code, role);
      return new ApiResult("Thành công", null);
    } catch (e) {
      rethrowError(e);
    }
  }

  /** QR check-in PNG (stream trực tiếp — không ghi đĩa như legacy). */
  @Get(":eventCode/qr")
  @ApiOperation({ summary: "QR check-in PNG — stream trực tiếp (chief)" })
  @UseGuards(ChiefAuthGuard)
  async qr(@Param("eventCode") eventCode: string, @Res() res: Response): Promise<void> {
    try {
      const png = await this.events.qrPng(eventCode);
      res.type("image/png").send(png);
    } catch (e) {
      rethrowError(e);
    }
  }

  @Get(":eventCode/attendance")
  @ApiOperation({ summary: "Danh sách điểm danh sự kiện (chief)" })
  @UseGuards(ChiefAuthGuard)
  async attendance(@Param("eventCode") eventCode: string): Promise<ApiResult<AttendanceItem[]>> {
    try {
      return new ApiResult("Thành công", await this.events.attendance(eventCode));
    } catch (e) {
      rethrowError(e);
    }
  }
}
