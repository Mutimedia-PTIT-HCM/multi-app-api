import type { Prisma } from "@prisma/client";

/** Row của query tìm SV (studentCode/fullName/avatarKey) — cũng dùng cho peer select. */
export type StudentSearchRow = Prisma.StudentGetPayload<{
  select: { studentCode: true; fullName: true; avatarKey: true };
}>;
