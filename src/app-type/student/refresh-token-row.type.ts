import type { Prisma } from "@prisma/client";

/** Row chỉ lấy uisRefreshToken. */
export type RefreshTokenRow = Prisma.StudentGetPayload<{ select: { uisRefreshToken: true } }>;
