import { AppException, NOTIFICATION_ERRORS, STUDENT_ERRORS, toPaginated, toPrismaPage } from "@app-common";
import { PrismaService } from "@app-infra/prisma";
import { PushService } from "@app-infra/push";
import { StorageService } from "@app-infra/storage";
import { PaginationQuery, SchedulePayload, UploadedFilePayload } from "@app-type";
import { HttpStatus, Injectable } from "@nestjs/common";

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly push: PushService,
  ) {}

  /** Thông báo gửi tới mình (mới nhất trước). */
  async listMine(studentCode: string, q: PaginationQuery) {
    const [total, rows] = await Promise.all([
      this.prisma.notificationRecipient.count({ where: { studentCode } }),
      this.prisma.notificationRecipient.findMany({
        where: { studentCode },
        orderBy: { notification: { sentAt: "desc" } },
        include: {
          notification: {
            include: { poster: { select: { fullName: true, avatarKey: true } } },
          },
        },
        ...toPrismaPage(q),
      }),
    ]);
    return toPaginated(
      rows.map((r) => ({
        recipientId: r.id,
        notificationCode: r.notificationCode,
        seen: r.seen,
        title: r.notification.title,
        content: r.notification.content,
        sentAt: r.notification.sentAt,
        type: r.notification.type,
        poster: {
          studentCode: r.notification.posterCode,
          fullName: r.notification.poster.fullName,
          avatarUrl: this.storage.url(r.notification.poster.avatarKey),
        },
        attachments: this.storage.urls(r.notification.fileKeys).map((url, i) => ({
          url,
          name: r.notification.fileKeys?.split(" ").filter(Boolean)[i] ?? url,
        })),
      })),
      total,
      q,
    );
  }

  async markRead(studentCode: string, recipientId: number) {
    const row = await this.prisma.notificationRecipient.findUnique({ where: { id: recipientId } });
    if (!row || row.studentCode !== studentCode) {
      throw new AppException(HttpStatus.NOT_FOUND, NOTIFICATION_ERRORS.NOT_FOUND);
    }
    await this.prisma.notificationRecipient.update({
      where: { id: recipientId },
      data: { seen: true },
    });
  }

  /** Chief gửi thông báo cho cả lớp (kèm file đính kèm + payload schedule). */
  async send(
    posterCode: string,
    input: { title: string; content: string; type: string } & SchedulePayload,
    files: UploadedFilePayload[],
  ) {
    const poster = await this.prisma.student.findUnique({
      where: { studentCode: posterCode },
      select: { classCode: true },
    });
    if (!poster) throw new AppException(HttpStatus.NOT_FOUND, STUDENT_ERRORS.NOT_FOUND);
    const classCode = poster.classCode;

    const keys: string[] = [];
    for (const f of files) {
      const key = this.storage.generateKey("notification", f.originalname);
      await this.storage.upload(key, f.buffer, f.mimetype);
      keys.push(key);
    }

    const notificationCode = Date.now().toString();
    await this.prisma.notification.create({
      data: {
        notificationCode,
        title: input.title,
        content: input.content,
        posterCode,
        type: input.type,
        fileKeys: keys.join(" "),
        recipients: {
          createMany: {
            data: (
              await this.prisma.student.findMany({
                where: { classCode },
                select: { studentCode: true },
              })
            ).map((s) => ({ studentCode: s.studentCode })),
          },
        },
      },
    });

    const payload: Record<string, string> = {
      title: input.title,
      body: input.content,
      fcm_type: "normal",
      click_action: "Trigger",
      fragment_opened: "notification",
      notification_type: input.type,
    };
    if (input.type === "schedule" && input.learnTimeClock && input.learnTimeDate) {
      const [hh, mm] = input.learnTimeClock.split(":").map(Number);
      const [d, m, y] = input.learnTimeDate.split("/").map(Number);
      const at = new Date(y, m - 1, d, hh, mm).getTime() - 86_400_000; // nhắc trước 1 ngày
      payload.milis_scheduling = String(at);
      payload.room = input.room ?? "";
      payload.learn_time = input.learnTimeClock;
    }
    await this.push.sendToTopics(input.title, input.content, [classCode], payload);
  }
}
