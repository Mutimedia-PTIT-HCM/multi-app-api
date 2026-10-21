import { AppException, CLASS_SYNC_QUEUE, STUDENT_ERRORS } from "@app-common";
import { PrismaService } from "@app-infra/prisma";
import { InjectQueue } from "@nestjs/bullmq";
import { HttpStatus, Injectable } from "@nestjs/common";
import { Queue } from "bullmq";
@Injectable()
export class ClassesService {
  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue(CLASS_SYNC_QUEUE) private readonly queue: Queue,
  ) {}

  async updateRole(studentCode: string, role: number) {
    const student = await this.prisma.student.findUnique({ where: { studentCode } });
    if (!student) throw new AppException(HttpStatus.NOT_FOUND, STUDENT_ERRORS.NOT_FOUND);
    await this.prisma.student.update({ where: { studentCode }, data: { role } });
  }

  /** Đẩy job crawl lại malop của toàn khoá (cùng 2 số khóa trong malop) vào queue. */
  async queueClassSync(studentCode: string): Promise<string> {
    const me = await this.prisma.student.findUnique({
      where: { studentCode },
      select: { classCode: true },
    });
    if (!me) throw new AppException(HttpStatus.NOT_FOUND, STUDENT_ERRORS.NOT_FOUND);
    const job = await this.queue.add("sync-class", { classCode: me.classCode });
    return String(job.id);
  }
}
