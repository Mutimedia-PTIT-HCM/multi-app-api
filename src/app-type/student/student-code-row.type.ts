import type { Prisma } from "@prisma/client";

/** Row chỉ lấy studentCode. */
export type StudentCodeRow = Prisma.StudentGetPayload<{ select: { studentCode: true } }>;
