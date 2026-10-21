import { PrismaService } from "@app-infra/prisma";
import { PushService } from "@app-infra/push";
import { StorageService } from "@app-infra/storage";
import { UploadedFilePayload } from "@app-type";
import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import QRCode from "qrcode";

@Injectable()
export class EventsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly push: PushService,
  ) {}

  async list(limit?: number) {
    const events = await this.prisma.event.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
      include: { poster: { select: { fullName: true, avatarKey: true } } },
    });
    return events.map((e) => this.withUrls(e));
  }

  async create(posterCode: string, title: string, content: string, thumb?: UploadedFilePayload) {
    if (!thumb) throw new BadRequestException("Sự kiện gửi lên không có Poster");
    const thumbnailKey = this.storage.generateKey("event/thumb", thumb.originalname);
    await this.storage.upload(thumbnailKey, thumb.buffer, thumb.mimetype);
    const event = await this.prisma.event.create({
      data: { eventCode: Date.now().toString(), title, content, thumbnailKey, posterCode },
    });
    this.push.sendToTopics(title, content, ["all"], {
      fcm_type: "notifi",
      notification_type: "else",
      title,
      body: content,
      click_action: "Trigger",
      fragment_opened: "multi_page",
    });
    return this.withUrls(event);
  }

  async remove(eventCode: string, actorCode: string, actorRole: number) {
    const event = await this.prisma.event.findUnique({ where: { eventCode } });
    if (!event) throw new NotFoundException("Không tìm thấy sự kiện");
    if (event.posterCode !== actorCode && actorRole !== 7) {
      throw new ForbiddenException("Không có quyền xoá sự kiện này");
    }
    await this.prisma.event.delete({ where: { eventCode } });
    if (event.thumbnailKey) await this.storage.delete(event.thumbnailKey).catch(() => undefined);
  }

  /** QR check-in (JSON {eventCode, eventTime, posterCode}) — trả PNG buffer. */
  async qrPng(eventCode: string): Promise<Buffer> {
    const event = await this.prisma.event.findUnique({
      where: { eventCode },
      select: { eventCode: true, eventTime: true, posterCode: true },
    });
    if (!event) throw new NotFoundException("Không tìm thấy sự kiện");
    return QRCode.toBuffer(JSON.stringify(event), { width: 700 });
  }

  async attendance(eventCode: string) {
    const checkIns = await this.prisma.eventCheckIn.findMany({
      where: { eventCode },
      include: { student: { select: { studentCode: true, fullName: true, avatarKey: true } } },
      orderBy: { checkInAt: "asc" },
    });
    if (checkIns.length === 0) throw new NotFoundException("Không tìm thấy sự kiện này");
    return checkIns.map((c) => ({
      ...c,
      student: { ...c.student, avatarUrl: this.storage.url(c.student.avatarKey) },
    }));
  }

  async checkIn(studentCode: string, eventCode: string, location?: string) {
    const event = await this.prisma.event.findUnique({ where: { eventCode } });
    if (!event) throw new NotFoundException("Không tìm thấy sự kiện này");
    const exists = await this.prisma.eventCheckIn.findUnique({
      where: { eventCode_studentCode: { eventCode, studentCode } },
    });
    if (exists) throw new BadRequestException("Bạn đã checkin sự kiện này rồi.");
    await this.prisma.eventCheckIn.create({ data: { eventCode, studentCode, location } });
  }

  private withUrls<T extends { thumbnailKey: string | null; poster?: { avatarKey: string | null } | null }>(
    e: T,
  ) {
    return {
      ...e,
      thumbnailUrl: this.storage.url(e.thumbnailKey),
      poster: e.poster ? { ...e.poster, avatarUrl: this.storage.url(e.poster.avatarKey) } : e.poster,
    };
  }
}
