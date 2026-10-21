import { PaginatedResult, PaginationQuery } from "@app-type";

/** Gói items + total thành PaginatedResult chuẩn. */
export function toPaginated<T>(items: T[], total: number, q: PaginationQuery): PaginatedResult<T> {
  return {
    items,
    meta: {
      page: q.page,
      limit: q.limit,
      total,
      totalPages: Math.ceil(total / q.limit),
    },
  };
}
