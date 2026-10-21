import type { Message } from "@prisma/client";
import { MessageSender } from "./message-sender.type";

/** 1 tin nhắn trả ra API — sender kèm avatarUrl. */
export type MessageItem = Message & { sender: MessageSender };
