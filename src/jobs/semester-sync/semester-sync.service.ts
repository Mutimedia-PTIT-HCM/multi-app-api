import {
  ISemesterSyncService,
  ISystemService,
  IUisService,
  IUisSessionService,
  PRISMA_PORT,
  PrismaPort,
  SYSTEM_PORT,
  UIS_PORT,
  UIS_SESSION_PORT,
} from "@app-contracts";
import { StudentCodeRow } from "@app-type";
import { Inject, Injectable, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";

/**
 * Thay thế legacy `checkTKB` (cron 0h hằng ngày):
 * nếu hôm nay cách ngày bắt đầu HK sau < 10 ngày → chuyển `semesterCode` sang HK mới.
 */
@Injectable()
export class SemesterSyncService implements ISemesterSyncService {
  private readonly logger = new Logger(SemesterSyncService.name);

  constructor(
    @Inject(PRISMA_PORT) private readonly prisma: PrismaPort,
    @Inject(UIS_PORT) private readonly uis: IUisService,
    @Inject(UIS_SESSION_PORT) private readonly session: IUisSessionService,
    @Inject(SYSTEM_PORT) private readonly system: ISystemService,
  ) {}

  @Cron("0 0 * * *")
  async checkSemester(): Promise<void> {
    try {
      const current = await this.system.getCurrentSemester();
      const next = this.system.nextSemester(current);

      // Lấy session của 1 SV bất kỳ còn credential để đọc TKB
      const sample: StudentCodeRow | null = await this.prisma.student.findFirst({
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
