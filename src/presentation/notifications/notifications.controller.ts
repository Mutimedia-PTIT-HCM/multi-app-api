import { NotificationsService } from "@app-application/notifications";
import {
  ApiResult,
  ChiefAuthGuard,
  CurrentUser,
  PaginationQueryDto,
  rethrowError,
  StudentAuthGuard,
} from "@app-common";
import { NotificationItem, PaginatedResult, UploadedFilePayload } from "@app-type";
import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FilesInterceptor } from "@nestjs/platform-express";
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiTags } from "@nestjs/swagger";

@ApiTags("Notifications")
@ApiBearerAuth()
@Controller("notifications")
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  /** Thông báo của mình. */
  @Get()
  @ApiOperation({ summary: "Thông báo gửi tới mình — phân trang" })
  @UseGuards(StudentAuthGuard)
  async listMine(
    @CurrentUser("studentCode") code: string,
    @Query() q: PaginationQueryDto,
  ): Promise<ApiResult<PaginatedResult<NotificationItem>>> {
    try {
      return new ApiResult("Thành công", await this.notifications.listMine(code, q));
    } catch (e) {
      rethrowError(e);
    }
  }

  /** Đánh dấu đã đọc. */
  @Patch("recipients/:recipientId/read")
  @ApiOperation({ summary: "Đánh dấu đã đọc" })
  @UseGuards(StudentAuthGuard)
  async markRead(
    @CurrentUser("studentCode") code: string,
    @Param("recipientId", ParseIntPipe) recipientId: number,
  ): Promise<ApiResult<null>> {
    try {
      await this.notifications.markRead(code, recipientId);
      return new ApiResult("Thành công", null);
    } catch (e) {
      rethrowError(e);
    }
  }

  /** Chief gửi thông báo cho cả lớp (multipart: files[] + fields). */
  @Post()
  @ApiOperation({ summary: "Gửi thông báo cho cả lớp, kèm file + payload lịch học (chief)" })
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      required: ["title", "content"],
      properties: {
        title: { type: "string" },
        content: { type: "string" },
        type: { type: "string", enum: ["normal", "schedule"], default: "normal" },
        learn_time_clock: { type: "string", example: "7h-9h35", description: "Chỉ khi type=schedule" },
        learn_time_date: { type: "string", example: "20/10/2025" },
        room: { type: "string", example: "2.B22" },
        files: { type: "array", items: { type: "string", format: "binary" } },
      },
    },
  })
  @UseGuards(ChiefAuthGuard)
  @UseInterceptors(FilesInterceptor("files", 10, { limits: { fileSize: 20 * 1024 * 1024 } }))
  async send(
    @CurrentUser("studentCode") code: string,
    @Body() body: Record<string, string>,
    @UploadedFiles() files: UploadedFilePayload[],
  ): Promise<ApiResult<null>> {
    try {
      await this.notifications.send(
        code,
        {
          title: body.title ?? "",
          content: body.content ?? "",
          type: body.type ?? "normal",
          learnTimeClock: body.learn_time_clock,
          learnTimeDate: body.learn_time_date,
          room: body.room,
        },
        files ?? [],
      );
      return new ApiResult("Thành công", null);
    } catch (e) {
      rethrowError(e);
    }
  }
}
