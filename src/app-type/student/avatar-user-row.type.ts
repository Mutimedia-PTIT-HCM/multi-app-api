import type { Prisma } from "@prisma/client";

/** Row user thu gọn (fullName/avatarKey) — sender/poster select. */
export type AvatarUserRow = Prisma.StudentGetPayload<{
  select: { fullName: true; avatarKey: true };
}>;
