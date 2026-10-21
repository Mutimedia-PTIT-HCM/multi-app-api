import { toPaginated, toPrismaPage } from "@app-common";
import { ITeachersService, PRISMA_PORT, PrismaPort } from "@app-contracts";
import { PaginatedResult, PaginationQuery } from "@app-type";
import { Inject, Injectable } from "@nestjs/common";
import type { Prisma, Teacher } from "@prisma/client";

@Injectable()
export class TeachersService implements ITeachersService {
  constructor(@Inject(PRISMA_PORT) private readonly prisma: PrismaPort) {}

  async list(q: PaginationQuery): Promise<PaginatedResult<Teacher>> {
    const [total, teachers]: [number, Teacher[]] = await Promise.all([
      this.prisma.teacher.count(),
      this.prisma.teacher.findMany({
        orderBy: { teacherCode: "asc" },
        ...toPrismaPage(q),
      }),
    ]);
    return toPaginated(teachers, total, q);
  }

  async update(teacherCode: string, data: Prisma.TeacherUpdateInput): Promise<Teacher> {
    const teacher: Teacher = await this.prisma.teacher.update({ where: { teacherCode }, data });
    return teacher;
  }
}
