import { NotificationsService } from "@app-application/notifications";
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
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FilesInterceptor } from "@nestjs/platform-express";

@Controller("notifications")
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  /** Thông báo của mình. */
  @Get()
  @UseGuards(StudentAuthGuard)
  async listMine(@CurrentUser("studentCode") code: string, @Query() q: PaginationQueryDto) {
    try {
      return new ApiResult("Thành công", await this.notifications.listMine(code, q));
    } catch (e) {
      rethrowError(e);
    }
  }

  /** Đánh dấu đã đọc. */
  @Patch("recipients/:recipientId/read")
  @UseGuards(StudentAuthGuard)
  async markRead(
    @CurrentUser("studentCode") code: string,
    @Param("recipientId", ParseIntPipe) recipientId: number,
  ) {
    try {
      await this.notifications.markRead(code, recipientId);
      return new ApiResult("Thành công", null);
    } catch (e) {
      rethrowError(e);
    }
  }

  /** Chief gửi thông báo cho cả lớp (multipart: files[] + fields). */
  @Post()
  @UseGuards(ChiefAuthGuard)
  @UseInterceptors(FilesInterceptor("files", 10, { limits: { fileSize: 20 * 1024 * 1024 } }))
  async send(
    @CurrentUser("studentCode") code: string,
    @Body() body: Record<string, string>,
    @UploadedFiles() files: UploadedFilePayload[],
  ) {
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
