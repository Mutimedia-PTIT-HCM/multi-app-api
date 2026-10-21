import type {
  OrderItem,
  PaginatedResult,
  PaginationQuery,
  ProductItem,
  UploadedFilePayload,
} from "@app-type";

export interface IProductsService {
  create(
    sellerCode: string,
    input: { name: string; price?: string; stock: number; description?: string },
    files: UploadedFilePayload[],
  ): Promise<ProductItem>;
  list(productCodes: string[] | undefined, q: PaginationQuery): Promise<PaginatedResult<ProductItem>>;
  getByCode(productCode: string): Promise<ProductItem>;
  placeOrders(
    buyerCode: string,
    items: { productCode: string; quantity: number; note: string }[],
  ): Promise<void>;
  myOrders(buyerCode: string, q: PaginationQuery): Promise<PaginatedResult<OrderItem>>;
  receivedOrders(sellerCode: string, q: PaginationQuery): Promise<PaginatedResult<OrderItem>>;
  cancel(orderCode: string, studentCode: string): Promise<void>;
  confirm(orderCode: string, studentCode: string): Promise<void>;
  done(orderCode: string, studentCode: string): Promise<void>;
}
