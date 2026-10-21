import type { Product } from "@prisma/client";
import { ProductSeller } from "./product-seller.type";

/** Ấn phẩm trả ra API — imageKeys đã resolve thành imageUrls. */
export type ProductItem = Product & {
  imageUrls: string[];
  seller: ProductSeller | null;
};
