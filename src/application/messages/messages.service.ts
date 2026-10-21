import { PrismaService } from "@app-infra/prisma";
import { PushService } from "@app-infra/push";
import { StorageService } from "@app-infra/storage";
import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";

@Injectable()
export class MessagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly push: PushService,
    private readonly storage: StorageService,
  ) {}

  /** Lịch sử chat 2 chiều với 1 người. */
  async conversation(selfCode: string, peerCode: string) {
    const messages = await this.prisma.message.findMany({
      where: {
        OR: [
          { senderCode: selfCode, receiverCode: peerCode },
          { senderCode: peerCode, receiverCode: selfCode },
        ],
      },
      orderBy: { sentAt: "asc" },
      include: { sender: { select: { fullName: true, avatarKey: true } } },
    });
    return messages.map((m) => ({
      ...m,
      sender: { ...m.sender, avatarUrl: this.storage.url(m.sender.avatarKey) },
    }));
  }

  /** Danh sách hội thoại: tin nhắn cuối mỗi peer. */
  async conversations(selfCode: string) {
    const messages = await this.prisma.message.findMany({
      where: { OR: [{ senderCode: selfCode }, { receiverCode: selfCode }] },
      orderBy: { sentAt: "desc" },
    });
    const peerCodes = [
      ...new Set(messages.map((m) => (m.senderCode === selfCode ? m.receiverCode : m.senderCode))),
    ];
    const peers = await this.prisma.student.findMany({
      where: { studentCode: { in: peerCodes } },
      select: { studentCode: true, fullName: true, avatarKey: true },
    });
    const peerMap = new Map(peers.map((p) => [p.studentCode, p]));
    return peerCodes.map((peer) => {
      const last = messages.find((m) => m.senderCode === peer || m.receiverCode === peer);
      const info = peerMap.get(peer);
      return {
        peer: info ? { ...info, avatarUrl: this.storage.url(info.avatarKey) } : { studentCode: peer },
        lastMessage: last ?? null,
      };
    });
  }

  /** Gửi tin nhắn (REST + socket đều qua đây). */
  async send(senderCode: string, receiverCode: string, content: string) {
    const sender = await this.prisma.student.findUnique({
      where: { studentCode: senderCode },
      select: { fullName: true, avatarKey: true },
    });
    const message = await this.prisma.message.create({
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

  async remove(studentCode: string, messageCode: string) {
    const message = await this.prisma.message.findUnique({ where: { messageCode } });
    if (!message) throw new NotFoundException("Không tìm thấy tin nhắn");
    if (message.senderCode !== studentCode && message.receiverCode !== studentCode) {
      throw new ForbiddenException("Không có quyền xoá tin nhắn này");
    }
    await this.prisma.message.delete({ where: { messageCode } });
  }
}
