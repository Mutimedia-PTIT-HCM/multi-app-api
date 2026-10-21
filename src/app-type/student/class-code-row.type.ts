import type { Prisma } from "@prisma/client";

/** Row chỉ lấy classCode. */
export type ClassCodeRow = Prisma.StudentGetPayload<{ select: { classCode: true } }>;
