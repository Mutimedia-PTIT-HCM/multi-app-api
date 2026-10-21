import { MessagesService } from "@app-application/messages";
import { ApiResult, CurrentUser, rethrowError, StudentAuthGuard } from "@app-common";
import { Controller, Delete, Get, Param, UseGuards } from "@nestjs/common";

@Controller("messages")
@UseGuards(StudentAuthGuard)
export class MessagesController {
  constructor(private readonly messages: MessagesService) {}

  /** Danh sách hội thoại + tin nhắn cuối mỗi peer. */
  @Get("conversations")
  async conversations(@CurrentUser("studentCode") code: string) {
    try {
      return new ApiResult("Lấy tin nhắn thành công", await this.messages.conversations(code));
    } catch (e) {
      rethrowError(e);
    }
  }

  /** Lịch sử chat với 1 người. */
  @Get(":peerCode")
  async conversation(@CurrentUser("studentCode") code: string, @Param("peerCode") peer: string) {
    try {
      return new ApiResult(
        "Lấy tin nhắn thành công",
        await this.messages.conversation(code, peer.toUpperCase()),
      );
    } catch (e) {
      rethrowError(e);
    }
  }

  @Delete(":messageCode")
  async remove(@CurrentUser("studentCode") code: string, @Param("messageCode") messageCode: string) {
    try {
      await this.messages.remove(code, messageCode);
      return new ApiResult("Thành công", null);
    } catch (e) {
      rethrowError(e);
    }
  }
}
