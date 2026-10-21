import { MessagesService } from "@app-application/messages";
import { ApiResult, CurrentUser, StudentAuthGuard } from "@app-common";
import { Controller, Delete, Get, Param, UseGuards } from "@nestjs/common";

@Controller("messages")
@UseGuards(StudentAuthGuard)
export class MessagesController {
  constructor(private readonly messages: MessagesService) {}

  /** Danh sách hội thoại + tin nhắn cuối mỗi peer. */
  @Get("conversations")
  async conversations(@CurrentUser("studentCode") code: string) {
    return new ApiResult("Lấy tin nhắn thành công", await this.messages.conversations(code));
  }

  /** Lịch sử chat với 1 người. */
  @Get(":peerCode")
  async conversation(@CurrentUser("studentCode") code: string, @Param("peerCode") peer: string) {
    return new ApiResult(
      "Lấy tin nhắn thành công",
      await this.messages.conversation(code, peer.toUpperCase()),
    );
  }

  @Delete(":messageCode")
  async remove(@CurrentUser("studentCode") code: string, @Param("messageCode") messageCode: string) {
    await this.messages.remove(code, messageCode);
    return new ApiResult("Thành công", null);
  }
}
