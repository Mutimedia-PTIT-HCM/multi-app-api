import {
  ApiDataResponse,
  ApiResult,
  ConversationItemDto,
  CurrentUser,
  MessageItemDto,
  PaginationQueryDto,
  rethrowError,
  StudentAuthGuard,
} from "@app-common";
import { IMessagesService, MESSAGES_PORT } from "@app-contracts";
import { ConversationItem, MessageItem, PaginatedResult } from "@app-type";
import { Controller, Delete, Get, Inject, Param, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from "@nestjs/swagger";

@ApiTags("Messages")
@ApiBearerAuth()
@Controller("messages")
@UseGuards(StudentAuthGuard)
export class MessagesController {
  constructor(@Inject(MESSAGES_PORT) private readonly messages: IMessagesService) {}

  /** Danh sách hội thoại + tin nhắn cuối mỗi peer. */
  @Get("conversations")
  @ApiOperation({ summary: "Danh sách hội thoại + tin nhắn cuối mỗi peer" })
  @ApiDataResponse({ type: ConversationItemDto, isArray: true })
  async conversations(@CurrentUser("studentCode") code: string): Promise<ApiResult<ConversationItem[]>> {
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
  @ApiDataResponse({ type: MessageItemDto, paginated: true })
  async conversation(
    @CurrentUser("studentCode") code: string,
    @Param("peerCode") peer: string,
    @Query() q: PaginationQueryDto,
  ): Promise<ApiResult<PaginatedResult<MessageItem>>> {
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
  @ApiDataResponse()
  async remove(
    @CurrentUser("studentCode") code: string,
    @Param("messageCode") messageCode: string,
  ): Promise<ApiResult<null>> {
    try {
      await this.messages.remove(code, messageCode);
      return new ApiResult("Thành công", null);
    } catch (e) {
      rethrowError(e);
    }
  }
}
