import { ErrorEntry } from "./error-entry.type";

export const PRODUCT_ERRORS = {
  NOT_FOUND: { code: "PRD_001", message: "Product not found" },
  EMPTY_ORDER: { code: "ORD_001", message: "Order is empty" },
  CANNOT_BUY_OWN: { code: "ORD_002", message: "Cannot order your own product" },
  ORDER_NOT_FOUND: { code: "ORD_003", message: "Order not found" },
  ORDER_FORBIDDEN: { code: "ORD_004", message: "You are not part of this order" },
} satisfies Record<string, ErrorEntry>;
