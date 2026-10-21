import type { Certificate } from "@prisma/client";

/** Minh chứng tự upload — imageKeys đã resolve thành imageUrls. */
export type CertificateItem = Certificate & { imageUrls: string[] };
