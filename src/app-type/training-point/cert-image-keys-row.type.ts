import type { Prisma } from "@prisma/client";

/** Row chỉ lấy imageKeys của certificate (dùng khi reset lớp). */
export type CertImageKeysRow = Prisma.CertificateGetPayload<{ select: { imageKeys: true } }>;
