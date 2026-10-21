import type { Prisma } from "@prisma/client";

/** Row check-in + student select (studentCode/fullName/avatarKey). */
export type CheckInWithStudentRow = Prisma.EventCheckInGetPayload<{
  include: { student: { select: { studentCode: true; fullName: true; avatarKey: true } } };
}>;
