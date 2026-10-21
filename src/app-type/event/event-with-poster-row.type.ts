import type { Prisma } from "@prisma/client";

/** Row event + poster select (fullName/avatarKey). */
export type EventWithPosterRow = Prisma.EventGetPayload<{
  include: { poster: { select: { fullName: true; avatarKey: true } } };
}>;
