import type { Prisma } from "@prisma/client";

/** Row order + buyer select + product đầy đủ — đơn người khác đặt ấn phẩm mình. */
export type OrderWithBuyerProductRow = Prisma.OrderGetPayload<{
  include: { buyer: { select: { fullName: true; phone: true } }; product: true };
}>;
