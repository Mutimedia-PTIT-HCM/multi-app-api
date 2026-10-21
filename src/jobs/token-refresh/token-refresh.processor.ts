import { PrismaService } from "@app-infra/prisma";
import { UisSessionService } from "@app-infra/uis";
import { InjectQueue, Processor, WorkerHost } from "@nestjs/bullmq";
import { Logger, OnModuleInit } from "@nestjs/common";
import { Job, Queue } from "bullmq";

import { TOKEN_REFRESH_QUEUE } from "./token-refresh.queue";
/**
 * Gia hạn phiên UIS định kỳ mỗi 5h:
 * - Job cha `renew-all` lặp lại → fan-out mỗi SV có credential thành 1 job `renew-one`.
 * - refresh_token của UIS ROTATE mỗi lần dùng; cron giữ session sống ngay cả khi
 *   user lâu không mở app (nếu không, token có thể chết sau thời gian idle).
 * - `UisSessionService.forceRenew` đã dedupe theo mssv — an toàn nếu user đang
 *   dùng app đồng thời với cron.
 */
@Processor(TOKEN_REFRESH_QUEUE, {
  concurrency: 2,
  limiter: { max: 5, duration: 10_000 },
})
export class TokenRefreshProcessor extends WorkerHost implements OnModuleInit {
  private readonly logger = new Logger(TokenRefreshProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly session: UisSessionService,
    @InjectQueue(TOKEN_REFRESH_QUEUE) private readonly queue: Queue,
  ) {
    super();
  }

  async onModuleInit() {
    await this.queue.upsertJobScheduler(
      "5h-token-renew",
      { pattern: "0 */5 * * *" },
      { name: "renew-all", data: {} },
    );
  }

  async process(job: Job): Promise<void> {
    if (job.name === "renew-all") return this.renewAll();
    if (job.name === "renew-one") return this.renewOne(job.data.studentCode);
  }

  private async renewAll() {
    const students = await this.prisma.student.findMany({
      where: { uisRefreshToken: { not: null } },
      select: { studentCode: true },
    });
    await this.queue.addBulk(
      students.map((s) => ({
        name: "renew-one",
        data: { studentCode: s.studentCode },
        opts: { attempts: 2, backoff: { type: "fixed", delay: 60_000 }, removeOnComplete: true },
      })),
    );
    this.logger.log(`Fan-out ${students.length} renew-one jobs`);
  }

  private async renewOne(studentCode: string) {
    const ok = await this.session.forceRenew(studentCode);
    if (!ok) this.logger.warn(`renew UIS tokens failed: ${studentCode}`);
  }
}
