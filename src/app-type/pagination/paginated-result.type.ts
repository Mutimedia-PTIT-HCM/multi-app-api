import { PaginationMeta } from "./pagination-meta.type";

/** Envelope phân trang chuẩn: data.items + data.meta. */
export interface PaginatedResult<T> {
  items: T[];
  meta: PaginationMeta;
}
