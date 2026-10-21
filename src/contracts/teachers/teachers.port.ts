import type { PaginatedResult, PaginationQuery } from "@app-type";
import type { Prisma, Teacher } from "@prisma/client";

export interface ITeachersService {
  list(q: PaginationQuery): Promise<PaginatedResult<Teacher>>;
  update(teacherCode: string, data: Prisma.TeacherUpdateInput): Promise<Teacher>;
}
