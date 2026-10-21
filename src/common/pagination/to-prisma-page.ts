import { PaginationQuery } from "@app-type";

/** Chuyển PaginationQuery → {skip, take} cho Prisma findMany. */
export function toPrismaPage(q: PaginationQuery): { skip: number; take: number } {
  return { skip: (q.page - 1) * q.limit, take: q.limit };
}
