import type { Order, Product } from "@prisma/client";

/** Đơn hàng trả ra API — product kèm imageUrls (+seller/buyer tuỳ endpoint). */
export type OrderItem = Order & {
  product: Product & { imageUrls: string[]; seller?: { fullName: string | null } | null };
  buyer?: { fullName: string | null; phone: string | null } | null;
};
