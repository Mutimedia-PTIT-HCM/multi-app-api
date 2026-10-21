import { AppException, SYS_ERRORS } from "@app-common";
import { PrismaService } from "@app-infra/prisma";
import { HttpStatus, Injectable } from "@nestjs/common";
import type { SystemConfig } from "@prisma/client";

@Injectable()
export class SystemService {
  constructor(private readonly prisma: PrismaService) {}

  /** Học kỳ hiện tại (nhhk), vd '20241'. */
  async getCurrentSemester(): Promise<string> {
    const config: SystemConfig | null = await this.prisma.systemConfig.findFirst({ orderBy: { id: "asc" } });
    if (!config) throw new AppException(HttpStatus.INTERNAL_SERVER_ERROR, SYS_ERRORS.CONFIG_MISSING);
    return config.semesterCode;
  }

  async setCurrentSemester(semesterCode: string): Promise<void> {
    const config: SystemConfig | null = await this.prisma.systemConfig.findFirst();
    if (config) {
      await this.prisma.systemConfig.update({ where: { id: config.id }, data: { semesterCode } });
    } else {
      await this.prisma.systemConfig.create({ data: { semesterCode } });
    }
  }

  /** Học kỳ kế tiếp của 1 mã học kỳ YYYYK (K∈1,2,3). */
  nextSemester(semesterCode: string): string {
    const year = parseInt(semesterCode.slice(0, 4), 10);
    const sem = parseInt(semesterCode.slice(4), 10);
    return sem === 3 ? `${year + 1}1` : `${year}${sem + 1}`;
  }
}
