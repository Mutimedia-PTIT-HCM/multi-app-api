import type { Prisma } from "@prisma/client";

/** Row message + sender select (fullName/avatarKey). */
export type MessageWithSenderRow = Prisma.MessageGetPayload<{
  include: { sender: { select: { fullName: true; avatarKey: true } } };
}>;
