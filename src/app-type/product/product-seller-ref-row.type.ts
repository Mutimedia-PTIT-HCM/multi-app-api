import type { Prisma } from "@prisma/client";

/** Row productCode + sellerCode — dùng khi đặt hàng. */
export type ProductSellerRefRow = Prisma.ProductGetPayload<{
  select: { productCode: true; sellerCode: true };
}>;
