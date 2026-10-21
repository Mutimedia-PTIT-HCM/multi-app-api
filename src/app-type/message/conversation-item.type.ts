import type { Message } from "@prisma/client";
import { ConversationPeer } from "./conversation-peer.type";

/** 1 hội thoại: peer + tin nhắn cuối. Peer có thể chỉ có studentCode nếu SV không còn trong DB. */
export interface ConversationItem {
  peer: ConversationPeer | { studentCode: string };
  lastMessage: Message | null;
}
