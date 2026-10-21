import type { Prisma } from "@prisma/client";

/** Row 3 cột token UIS (đã mã hoá) của SV. */
export type UisTokenRow = Prisma.StudentGetPayload<{
  select: { uisAccessToken: true; uisRefreshToken: true; uisTokenExpiresAt: true };
}>;
