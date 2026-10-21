import { CLASS_SYNC_QUEUE } from "@app-common";
import { PrismaService } from "@app-infra/prisma";
import { UisService, UisSessionService } from "@app-infra/uis";
import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Logger } from "@nestjs/common";
import { Job } from "bullmq";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Thay thế legacy `update_new_class`: crawl lại `malop` toàn khoá qua UIS.
 * Chạy nền trong queue — không block request.
 */
@Processor(CLASS_SYNC_QUEUE, { concurrency: 1 })
export class ClassSyncProcessor extends WorkerHost {
  private readonly logger = new Logger(ClassSyncProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly uis: UisService,
    private readonly session: UisSessionService,
  ) {
    super();
  }

  async process(job: Job<{ classCode: string }>): Promise<void> {
    if (job.name !== "sync-class") return;
    const { classCode } = job.data;
    // Khóa = 2 ký tự sau chữ cái đầu của mã lớp (legacy: slice(1,3))
    const academicYear = classCode.slice(1, 3);
    const students = await this.prisma.student.findMany({
      where: {
        classCode: { contains: academicYear },
        uisRefreshToken: { not: null },
      },
      select: { studentCode: true },
    });
    this.logger.log(`Sync class for ${students.length} students, year=${academicYear}`);

    for (const s of students) {
      try {
        const session = await this.session.getSession(s.studentCode);
        const info = await this.uis.getStudentInfo(session);
        if (info.classCode && info.classCode !== classCode) {
          await this.prisma.student.update({
            where: { studentCode: s.studentCode },
            data: { classCode: info.classCode },
          });
        }
      } catch (e) {
        this.logger.warn(`sync ${s.studentCode} failed: ${e instanceof Error ? e.message : e}`);
      }
      await sleep(500); // giữ nhịp như legacy — tránh đánh UIS dồn dập
    }
  }
}
