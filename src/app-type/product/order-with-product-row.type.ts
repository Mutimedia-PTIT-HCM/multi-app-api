import type { Prisma } from "@prisma/client";

/** Row order + product đầy đủ. */
export type OrderWithProductRow = Prisma.OrderGetPayload<{ include: { product: true } }>;
