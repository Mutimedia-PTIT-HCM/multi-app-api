import { MessagesService } from "@app-application/messages";
import { ApiResult, CurrentUser, PaginationQueryDto, rethrowError, StudentAuthGuard } from "@app-common";
import { Controller, Delete, Get, Param, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from "@nestjs/swagger";

@ApiTags("Messages")
@ApiBearerAuth()
@Controller("messages")
@UseGuards(StudentAuthGuard)
export class MessagesController {
  constructor(private readonly messages: MessagesService) {}

  /** Danh sách hội thoại + tin nhắn cuối mỗi peer. */
  @Get("conversations")
  @ApiOperation({ summary: "Danh sách hội thoại + tin nhắn cuối mỗi peer" })
  async conversations(@CurrentUser("studentCode") code: string) {
    try {
      return new ApiResult("Lấy tin nhắn thành công", await this.messages.conversations(code));
    } catch (e) {
      rethrowError(e);
    }
  }

  /** Lịch sử chat với 1 người. */
  @Get(":peerCode")
  @ApiOperation({ summary: "Lịch sử chat với 1 người — phân trang, page 1 = mới nhất" })
  @ApiParam({ name: "peerCode", example: "N18DCPT023" })
  async conversation(
    @CurrentUser("studentCode") code: string,
    @Param("peerCode") peer: string,
    @Query() q: PaginationQueryDto,
  ) {
    try {
      return new ApiResult(
        "Lấy tin nhắn thành công",
        await this.messages.conversation(code, peer.toUpperCase(), q),
      );
    } catch (e) {
      rethrowError(e);
    }
  }

  @Delete(":messageCode")
  @ApiOperation({ summary: "Thu hồi tin nhắn của mình" })
  async remove(@CurrentUser("studentCode") code: string, @Param("messageCode") messageCode: string) {
    try {
      await this.messages.remove(code, messageCode);
      return new ApiResult("Thành công", null);
    } catch (e) {
      rethrowError(e);
    }
  }
}
