import type { Prisma } from "@prisma/client";

/** Row thành viên lớp (kèm birthDate). */
export type ClassMemberRow = Prisma.StudentGetPayload<{
  select: { studentCode: true; classCode: true; fullName: true; birthDate: true; avatarKey: true };
}>;
