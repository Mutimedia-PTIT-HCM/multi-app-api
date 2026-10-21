import { AppException, MESSAGE_ERRORS, toPaginated, toPrismaPage } from "@app-common";
import { PrismaService } from "@app-infra/prisma";
import { PushService } from "@app-infra/push";
import { StorageService } from "@app-infra/storage";
import {
  AvatarUserRow,
  ConversationItem,
  MessageItem,
  MessageWithSenderRow,
  PaginatedResult,
  PaginationQuery,
  StudentSearchRow,
} from "@app-type";
import { HttpStatus, Injectable } from "@nestjs/common";
import type { Message } from "@prisma/client";

@Injectable()
export class MessagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly push: PushService,
    private readonly storage: StorageService,
  ) {}

  /** Lịch sử chat 2 chiều — page mới nhất trước, trong page vẫn asc để hiển thị. */
  async conversation(
    selfCode: string,
    peerCode: string,
    q: PaginationQuery,
  ): Promise<PaginatedResult<MessageItem>> {
    const where = {
      OR: [
        { senderCode: selfCode, receiverCode: peerCode },
        { senderCode: peerCode, receiverCode: selfCode },
      ],
    };
    const [total, messages]: [number, MessageWithSenderRow[]] = await Promise.all([
      this.prisma.message.count({ where }),
      this.prisma.message.findMany({
        where,
        orderBy: { sentAt: "desc" },
        include: { sender: { select: { fullName: true, avatarKey: true } } },
        ...toPrismaPage(q),
      }),
    ]);
    return toPaginated(
      messages.reverse().map((m) => ({
        ...m,
        sender: { ...m.sender, avatarUrl: this.storage.url(m.sender.avatarKey) },
      })),
      total,
      q,
    );
  }

  /** Danh sách hội thoại: tin nhắn cuối mỗi peer. */
  async conversations(selfCode: string): Promise<ConversationItem[]> {
    const messages: Message[] = await this.prisma.message.findMany({
      where: { OR: [{ senderCode: selfCode }, { receiverCode: selfCode }] },
      orderBy: { sentAt: "desc" },
    });
    const peerCodes = [
      ...new Set(messages.map((m) => (m.senderCode === selfCode ? m.receiverCode : m.senderCode))),
    ];
    const peers: StudentSearchRow[] = await this.prisma.student.findMany({
      where: { studentCode: { in: peerCodes } },
      select: { studentCode: true, fullName: true, avatarKey: true },
    });
    const peerMap = new Map<string, StudentSearchRow>(peers.map((p) => [p.studentCode, p]));
    return peerCodes.map((peer) => {
      const last: Message | undefined = messages.find(
        (m) => m.senderCode === peer || m.receiverCode === peer,
      );
      const info = peerMap.get(peer);
      return {
        peer: info ? { ...info, avatarUrl: this.storage.url(info.avatarKey) } : { studentCode: peer },
        lastMessage: last ?? null,
      };
    });
  }

  /** Gửi tin nhắn (REST + socket đều qua đây). */
  async send(senderCode: string, receiverCode: string, content: string): Promise<Message> {
    const sender: AvatarUserRow | null = await this.prisma.student.findUnique({
      where: { studentCode: senderCode },
      select: { fullName: true, avatarKey: true },
    });
    const message: Message = await this.prisma.message.create({
      data: {
        messageCode: Date.now().toString(),
        senderCode,
        receiverCode,
        content,
        state: 1,
      },
    });
    await this.push.sendToTopics(sender?.fullName ?? senderCode, content, [receiverCode], {
      message_code: message.messageCode,
      sender: senderCode,
      link_avt: this.storage.url(sender?.avatarKey) ?? "",
      title: sender?.fullName ?? senderCode,
      content,
      receiver: receiverCode,
      click_action: "Trigger",
      fragment_opened: "message",
      fcm_type: "message",
    });
    return message;
  }

  async remove(studentCode: string, messageCode: string): Promise<void> {
    const message: Message | null = await this.prisma.message.findUnique({ where: { messageCode } });
    if (!message) throw new AppException(HttpStatus.NOT_FOUND, MESSAGE_ERRORS.NOT_FOUND);
    if (message.senderCode !== studentCode && message.receiverCode !== studentCode) {
      throw new AppException(HttpStatus.FORBIDDEN, MESSAGE_ERRORS.DELETE_FORBIDDEN);
    }
    await this.prisma.message.delete({ where: { messageCode } });
  }
}
