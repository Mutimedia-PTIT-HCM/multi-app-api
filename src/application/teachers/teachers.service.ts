import { toPaginated, toPrismaPage } from "@app-common";
import { PrismaService } from "@app-infra/prisma";
import { PaginationQuery } from "@app-type";
import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";

@Injectable()
export class TeachersService {
  constructor(private readonly prisma: PrismaService) {}

  async list(q: PaginationQuery) {
    const [total, teachers] = await Promise.all([
      this.prisma.teacher.count(),
      this.prisma.teacher.findMany({
        orderBy: { teacherCode: "asc" },
        ...toPrismaPage(q),
      }),
    ]);
    return toPaginated(teachers, total, q);
  }

  async update(teacherCode: string, data: Prisma.TeacherUpdateInput) {
    return this.prisma.teacher.update({ where: { teacherCode }, data });
  }
}
