import type { Prisma } from "@prisma/client";

/** Row notificationRecipient + notification + poster select. */
export type NotificationRecipientRow = Prisma.NotificationRecipientGetPayload<{
  include: { notification: { include: { poster: { select: { fullName: true; avatarKey: true } } } } };
}>;
