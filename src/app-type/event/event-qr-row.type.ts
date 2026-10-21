import type { Prisma } from "@prisma/client";

/** Row payload nhúng vào QR check-in. */
export type EventQrRow = Prisma.EventGetPayload<{
  select: { eventCode: true; eventTime: true; posterCode: true };
}>;
