import type { Prisma } from "@prisma/client";

/** Row order + product + seller select — đơn mình đã mua. */
export type OrderWithProductSellerRow = Prisma.OrderGetPayload<{
  include: { product: { include: { seller: { select: { fullName: true } } } } };
}>;
