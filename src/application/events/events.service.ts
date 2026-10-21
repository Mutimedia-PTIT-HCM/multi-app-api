import { AppException, EVENT_ERRORS, toPaginated, toPrismaPage } from "@app-common";
import {
  IEventsService,
  IPushService,
  IStorageService,
  PRISMA_PORT,
  PrismaPort,
  PUSH_PORT,
  STORAGE_PORT,
} from "@app-contracts";
import {
  AttendanceItem,
  CheckInWithStudentRow,
  EventItem,
  EventQrRow,
  EventWithPosterRow,
  PaginatedResult,
  PaginationQuery,
  UploadedFilePayload,
} from "@app-type";
import { HttpStatus, Inject, Injectable } from "@nestjs/common";
import type { Event, EventCheckIn } from "@prisma/client";
import QRCode from "qrcode";

@Injectable()
export class EventsService implements IEventsService {
  constructor(
    @Inject(PRISMA_PORT) private readonly prisma: PrismaPort,
    @Inject(STORAGE_PORT) private readonly storage: IStorageService,
    @Inject(PUSH_PORT) private readonly push: IPushService,
  ) {}

  async list(q: PaginationQuery): Promise<PaginatedResult<EventItem>> {
    const [total, events]: [number, EventWithPosterRow[]] = await Promise.all([
      this.prisma.event.count(),
      this.prisma.event.findMany({
        orderBy: { createdAt: "desc" },
        include: { poster: { select: { fullName: true, avatarKey: true } } },
        ...toPrismaPage(q),
      }),
    ]);
    return toPaginated(
      events.map((e) => this.withUrls(e)),
      total,
      q,
    );
  }

  async create(
    posterCode: string,
    title: string,
    content: string,
    thumb?: UploadedFilePayload,
  ): Promise<EventItem> {
    if (!thumb) throw new AppException(HttpStatus.BAD_REQUEST, EVENT_ERRORS.MISSING_POSTER);
    const thumbnailKey = this.storage.generateKey("event/thumb", thumb.originalname);
    await this.storage.upload(thumbnailKey, thumb.buffer, thumb.mimetype);
    const event: Event = await this.prisma.event.create({
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

  async remove(eventCode: string, actorCode: string, actorRole: number): Promise<void> {
    const event: Event | null = await this.prisma.event.findUnique({ where: { eventCode } });
    if (!event) throw new AppException(HttpStatus.NOT_FOUND, EVENT_ERRORS.NOT_FOUND);
    if (event.posterCode !== actorCode && actorRole !== 7) {
      throw new AppException(HttpStatus.FORBIDDEN, EVENT_ERRORS.DELETE_FORBIDDEN);
    }
    await this.prisma.event.delete({ where: { eventCode } });
    if (event.thumbnailKey) await this.storage.delete(event.thumbnailKey).catch(() => undefined);
  }

  /** QR check-in (JSON {eventCode, eventTime, posterCode}) — trả PNG buffer. */
  async qrPng(eventCode: string): Promise<Buffer> {
    const event: EventQrRow | null = await this.prisma.event.findUnique({
      where: { eventCode },
      select: { eventCode: true, eventTime: true, posterCode: true },
    });
    if (!event) throw new AppException(HttpStatus.NOT_FOUND, EVENT_ERRORS.NOT_FOUND);
    return QRCode.toBuffer(JSON.stringify(event), { width: 700 });
  }

  async attendance(eventCode: string): Promise<AttendanceItem[]> {
    const checkIns: CheckInWithStudentRow[] = await this.prisma.eventCheckIn.findMany({
      where: { eventCode },
      include: { student: { select: { studentCode: true, fullName: true, avatarKey: true } } },
      orderBy: { checkInAt: "asc" },
    });
    if (checkIns.length === 0) throw new AppException(HttpStatus.NOT_FOUND, EVENT_ERRORS.NOT_FOUND);
    return checkIns.map((c) => ({
      ...c,
      student: { ...c.student, avatarUrl: this.storage.url(c.student.avatarKey) },
    }));
  }

  async checkIn(studentCode: string, eventCode: string, location?: string): Promise<void> {
    const event: Event | null = await this.prisma.event.findUnique({ where: { eventCode } });
    if (!event) throw new AppException(HttpStatus.NOT_FOUND, EVENT_ERRORS.NOT_FOUND);
    const exists: EventCheckIn | null = await this.prisma.eventCheckIn.findUnique({
      where: { eventCode_studentCode: { eventCode, studentCode } },
    });
    if (exists) throw new AppException(HttpStatus.BAD_REQUEST, EVENT_ERRORS.ALREADY_CHECKED_IN);
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
