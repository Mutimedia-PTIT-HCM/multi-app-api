import { SystemService } from "@app-application/system";
import { PrismaService } from "@app-infra/prisma";
import { UisService, UisSessionService } from "@app-infra/uis";
import { Injectable, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";

/**
 * Thay thế legacy `checkTKB` (cron 0h hằng ngày):
 * nếu hôm nay cách ngày bắt đầu HK sau < 10 ngày → chuyển `semesterCode` sang HK mới.
 */
@Injectable()
export class SemesterSyncService {
  private readonly logger = new Logger(SemesterSyncService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly uis: UisService,
    private readonly session: UisSessionService,
    private readonly system: SystemService,
  ) {}

  @Cron("0 0 * * *")
  async checkSemester() {
    try {
      const current = await this.system.getCurrentSemester();
      const next = this.system.nextSemester(current);

      // Lấy session của 1 SV bất kỳ còn credential để đọc TKB
      const sample = await this.prisma.student.findFirst({
        where: { uisRefreshToken: { not: null } },
        orderBy: { studentCode: "desc" },
        select: { studentCode: true },
      });
      if (!sample) return;

      const session = await this.session.getSession(sample.studentCode);
      const startDate = await this.uis.getFirstWeekStartDate(session, next);
      if (!startDate) {
        this.logger.warn("checkSemester: no start date from UIS");
        return;
      }

      const threshold = new Date(startDate);
      threshold.setDate(threshold.getDate() - 10);
      if (new Date() > threshold) {
        await this.system.setCurrentSemester(next);
        this.logger.log(`Semester updated: ${current} -> ${next}`);
      }
    } catch (e) {
      this.logger.error("checkSemester failed", e instanceof Error ? e.message : e);
    }
  }
}
