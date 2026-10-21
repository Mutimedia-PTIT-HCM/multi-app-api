import type { Prisma } from "@prisma/client";

/** Row product + seller select (chỉ fullName) — danh sách ấn phẩm. */
export type ProductListRow = Prisma.ProductGetPayload<{
  include: { seller: { select: { fullName: true } } };
}>;
