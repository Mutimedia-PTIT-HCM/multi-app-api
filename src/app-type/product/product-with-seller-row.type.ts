import type { Prisma } from "@prisma/client";

/** Row product + seller select (fullName/avatarKey) — chi tiết ấn phẩm. */
export type ProductWithSellerRow = Prisma.ProductGetPayload<{
  include: { seller: { select: { fullName: true; avatarKey: true } } };
}>;
