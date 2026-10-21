import type { Prisma } from "@prisma/client";

/** Row check-in + event đầy đủ — dùng trong getCertificates (minh chứng theo sự kiện). */
export type CheckInWithEventRow = Prisma.EventCheckInGetPayload<{ include: { event: true } }>;
