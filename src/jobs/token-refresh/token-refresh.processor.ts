import { TOKEN_REFRESH_QUEUE } from "@app-common";
import { IUisSessionService, PRISMA_PORT, PrismaPort, UIS_SESSION_PORT } from "@app-contracts";
import { StudentCodeRow } from "@app-type";
import { InjectQueue, Processor, WorkerHost } from "@nestjs/bullmq";
import { Inject, Logger, OnModuleInit } from "@nestjs/common";
import { Job, Queue } from "bullmq";
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
    @Inject(PRISMA_PORT) private readonly prisma: PrismaPort,
    @Inject(UIS_SESSION_PORT) private readonly session: IUisSessionService,
    @InjectQueue(TOKEN_REFRESH_QUEUE) private readonly queue: Queue,
  ) {
    super();
  }

  async onModuleInit(): Promise<void> {
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

  private async renewAll(): Promise<void> {
    const students: StudentCodeRow[] = await this.prisma.student.findMany({
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

  private async renewOne(studentCode: string): Promise<void> {
    const ok = await this.session.forceRenew(studentCode);
    if (!ok) this.logger.warn(`renew UIS tokens failed: ${studentCode}`);
  }
}
