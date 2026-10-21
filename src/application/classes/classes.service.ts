import { AppException, CLASS_SYNC_QUEUE, STUDENT_ERRORS } from "@app-common";
import { IClassesService, PRISMA_PORT, PrismaPort } from "@app-contracts";
import { ClassCodeRow } from "@app-type";
import { InjectQueue } from "@nestjs/bullmq";
import { HttpStatus, Inject, Injectable } from "@nestjs/common";
import type { Student } from "@prisma/client";
import { Queue } from "bullmq";
@Injectable()
export class ClassesService implements IClassesService {
  constructor(
    @Inject(PRISMA_PORT) private readonly prisma: PrismaPort,
    @InjectQueue(CLASS_SYNC_QUEUE) private readonly queue: Queue,
  ) {}

  async updateRole(studentCode: string, role: number): Promise<void> {
    const student: Student | null = await this.prisma.student.findUnique({ where: { studentCode } });
    if (!student) throw new AppException(HttpStatus.NOT_FOUND, STUDENT_ERRORS.NOT_FOUND);
    await this.prisma.student.update({ where: { studentCode }, data: { role } });
  }

  /** Đẩy job crawl lại malop của toàn khoá (cùng 2 số khóa trong malop) vào queue. */
  async queueClassSync(studentCode: string): Promise<string> {
    const me: ClassCodeRow | null = await this.prisma.student.findUnique({
      where: { studentCode },
      select: { classCode: true },
    });
    if (!me) throw new AppException(HttpStatus.NOT_FOUND, STUDENT_ERRORS.NOT_FOUND);
    const job = await this.queue.add("sync-class", { classCode: me.classCode });
    return String(job.id);
  }
}
