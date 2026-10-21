import { PrismaService } from "@app-infra/prisma";
import { InjectQueue } from "@nestjs/bullmq";
import { Injectable, NotFoundException } from "@nestjs/common";
import { Queue } from "bullmq";

import { CLASS_SYNC_QUEUE } from "./class-sync.queue";
@Injectable()
export class ClassesService {
  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue(CLASS_SYNC_QUEUE) private readonly queue: Queue,
  ) {}

  async updateRole(studentCode: string, role: number) {
    const student = await this.prisma.student.findUnique({ where: { studentCode } });
    if (!student) throw new NotFoundException("Không tìm thấy sinh viên");
    await this.prisma.student.update({ where: { studentCode }, data: { role } });
  }

  /** Đẩy job crawl lại malop của toàn khoá (cùng 2 số khóa trong malop) vào queue. */
  async queueClassSync(studentCode: string): Promise<string> {
    const me = await this.prisma.student.findUnique({
      where: { studentCode },
      select: { classCode: true },
    });
    if (!me) throw new NotFoundException("Không tìm thấy sinh viên");
    const job = await this.queue.add("sync-class", { classCode: me.classCode });
    return String(job.id);
  }
}
