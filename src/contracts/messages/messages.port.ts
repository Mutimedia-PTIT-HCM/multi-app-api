import type { ConversationItem, MessageItem, PaginatedResult, PaginationQuery } from "@app-type";
import type { Message } from "@prisma/client";

export interface IMessagesService {
  conversation(selfCode: string, peerCode: string, q: PaginationQuery): Promise<PaginatedResult<MessageItem>>;
  conversations(selfCode: string): Promise<ConversationItem[]>;
  send(senderCode: string, receiverCode: string, content: string): Promise<Message>;
  remove(studentCode: string, messageCode: string): Promise<void>;
}
