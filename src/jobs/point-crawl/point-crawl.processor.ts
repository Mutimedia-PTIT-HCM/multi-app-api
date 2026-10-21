import { SystemService } from "@app-application/system";
import { PrismaService } from "@app-infra/prisma";
import { PushService } from "@app-infra/push";
import { UisService, UisSessionService, UisUnreachableError } from "@app-infra/uis";
import { UisSession } from "@app-type";
import { InjectQueue, Processor, WorkerHost } from "@nestjs/bullmq";
import { Logger, OnModuleInit } from "@nestjs/common";
import { Job, Queue } from "bullmq";

import { POINT_CRAWL_QUEUE } from "./point-crawl.queue";
/**
 * Thay thế legacy `runCheckNewPoint` (while(true) mỗi giờ):
 * - Job cha `crawl-all` lặp lại mỗi giờ → fan-out mỗi SV thành 1 job `crawl-one`.
 * - Worker giới hạn concurrency + retry/backoff → không đánh UIS một loạt.
 */
@Processor(POINT_CRAWL_QUEUE, {
  concurrency: 3,
  limiter: { max: 5, duration: 10_000 },
})
export class PointCrawlProcessor extends WorkerHost implements OnModuleInit {
  private readonly logger = new Logger(PointCrawlProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly uis: UisService,
    private readonly session: UisSessionService,
    private readonly push: PushService,
    private readonly system: SystemService,
    @InjectQueue(POINT_CRAWL_QUEUE) private readonly queue: Queue,
  ) {
    super();
  }

  async onModuleInit() {
    // Đăng ký repeatable job mỗi giờ (idempotent)
    await this.queue.upsertJobScheduler(
      "hourly-point-crawl",
      { pattern: "0 * * * *" },
      { name: "crawl-all", data: {} },
    );
  }

  async process(job: Job): Promise<void> {
    if (job.name === "crawl-all") return this.crawlAll();
    if (job.name === "crawl-one") return this.crawlOne(job.data.studentCode);
  }

  private async crawlAll() {
    const students = await this.prisma.student.findMany({
      where: { uisRefreshToken: { not: null } },
      select: { studentCode: true },
    });
    await this.queue.addBulk(
      students.map((s) => ({
        name: "crawl-one",
        data: { studentCode: s.studentCode },
        opts: { attempts: 3, backoff: { type: "exponential", delay: 30_000 }, removeOnComplete: true },
      })),
    );
    this.logger.log(`Fan-out ${students.length} crawl-one jobs`);
  }

  private async crawlOne(studentCode: string) {
    let session: UisSession;
    try {
      session = await this.session.getSession(studentCode);
    } catch (e) {
      // UIS sập/timeout → throw để BullMQ retry theo backoff
      if (e instanceof UisUnreachableError) throw e;
      // Auth fail (đổi password, revoke) → nhắc user login lại app
      await this.push.sendToTopics(
        "Thông báo đồng bộ thông tin đăng nhập",
        "Có vẻ như bạn đã đổi mật khẩu trên uis nhưng chưa đăng nhập lại trên ứng dụng. Vui lòng đăng nhập lại để ghi nhận mật khẩu uis mới vào hệ thống ứng dụng để hệ thống có thể thông báo cập nhật điểm đến bạn nhé!",
        [studentCode],
      );
      return;
    }

    const current = await this.system.getCurrentSemester();
    const previous = this.prevSemester(current);
    const gpaList = await this.uis.getRecentGpa(session);

    let updated = false;
    for (const g of gpaList) {
      const semesterCode = `${g.year}${g.semester}`;
      if (semesterCode !== current && semesterCode !== previous) continue;
      const existing = await this.prisma.pointSnapshot.findUnique({
        where: { studentCode_semesterCode: { studentCode, semesterCode } },
      });
      if (!existing) {
        await this.prisma.pointSnapshot.create({ data: { studentCode, semesterCode, gpa: g.gpa } });
      } else if (existing.gpa !== g.gpa) {
        await this.prisma.pointSnapshot.update({
          where: { id: existing.id },
          data: { gpa: g.gpa },
        });
        updated = true;
      }
    }
    if (updated) {
      await this.push.sendToTopics(
        "Thông báo điểm",
        "Điểm của bạn vừa được cập nhật, hãy vào ứng dụng để xem chi tiết",
        [studentCode],
      );
    }
  }

  /** HK trước của YYYYK: K1 → năm-1 K3; còn lại K-1. */
  private prevSemester(semesterCode: string): string {
    const year = parseInt(semesterCode.slice(0, 4), 10);
    const sem = parseInt(semesterCode.slice(4), 10);
    return sem === 1 ? `${year - 1}3` : `${year}${sem - 1}`;
  }
}
