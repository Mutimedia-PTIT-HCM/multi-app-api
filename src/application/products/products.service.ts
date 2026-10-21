import { AppException, PRODUCT_ERRORS, toPaginated, toPrismaPage } from "@app-common";
import {
  IProductsService,
  IPushService,
  IStorageService,
  PRISMA_PORT,
  PrismaPort,
  PUSH_PORT,
  STORAGE_PORT,
} from "@app-contracts";
import {
  OrderItem,
  OrderWithBuyerProductRow,
  OrderWithProductRow,
  OrderWithProductSellerRow,
  PaginatedResult,
  PaginationQuery,
  ProductItem,
  ProductListRow,
  ProductSeller,
  ProductSellerRefRow,
  ProductWithSellerRow,
  UploadedFilePayload,
} from "@app-type";
import { HttpStatus, Inject, Injectable } from "@nestjs/common";
import type { Product } from "@prisma/client";

@Injectable()
export class ProductsService implements IProductsService {
  constructor(
    @Inject(PRISMA_PORT) private readonly prisma: PrismaPort,
    @Inject(STORAGE_PORT) private readonly storage: IStorageService,
    @Inject(PUSH_PORT) private readonly push: IPushService,
  ) {}

  async create(
    sellerCode: string,
    input: { name: string; price?: string; stock: number; description?: string },
    files: UploadedFilePayload[],
  ): Promise<ProductItem> {
    const keys: string[] = [];
    for (const f of files) {
      const key = this.storage.generateKey("products", f.originalname);
      await this.storage.upload(key, f.buffer, f.mimetype);
      keys.push(key);
    }
    const product: Product = await this.prisma.product.create({
      data: {
        productCode: Date.now().toString(),
        sellerCode,
        name: input.name,
        price: input.price,
        stock: input.stock,
        description: input.description,
        imageKeys: keys.join(" "),
      },
    });
    return this.withUrls(product);
  }

  async list(productCodes: string[] | undefined, q: PaginationQuery): Promise<PaginatedResult<ProductItem>> {
    const where = productCodes ? { productCode: { in: productCodes } } : {};
    const [total, products]: [number, ProductListRow[]] = await Promise.all([
      this.prisma.product.count({ where }),
      this.prisma.product.findMany({
        where,
        orderBy: { createdAt: "desc" },
        include: { seller: { select: { fullName: true } } },
        ...toPrismaPage(q),
      }),
    ]);
    return toPaginated(
      products.map((p) => this.withUrls(p)),
      total,
      q,
    );
  }

  async getByCode(productCode: string): Promise<ProductItem> {
    const product: ProductWithSellerRow | null = await this.prisma.product.findUnique({
      where: { productCode },
      include: { seller: { select: { fullName: true, avatarKey: true } } },
    });
    if (!product) throw new AppException(HttpStatus.NOT_FOUND, PRODUCT_ERRORS.NOT_FOUND);
    return this.withUrls(product);
  }

  async placeOrders(
    buyerCode: string,
    items: { productCode: string; quantity: number; note: string }[],
  ): Promise<void> {
    if (items.length === 0) throw new AppException(HttpStatus.BAD_REQUEST, PRODUCT_ERRORS.EMPTY_ORDER);
    const products: ProductSellerRefRow[] = await this.prisma.product.findMany({
      where: { productCode: { in: items.map((i) => i.productCode) } },
      select: { productCode: true, sellerCode: true },
    });
    const productMap = new Map<string, ProductSellerRefRow>(products.map((p) => [p.productCode, p]));
    for (const item of items) {
      const product = productMap.get(item.productCode);
      if (!product) {
        throw new AppException(
          HttpStatus.BAD_REQUEST,
          PRODUCT_ERRORS.NOT_FOUND,
          `Product ${item.productCode} not found`,
        );
      }
      if (product.sellerCode === buyerCode) {
        throw new AppException(HttpStatus.BAD_REQUEST, PRODUCT_ERRORS.CANNOT_BUY_OWN);
      }
    }
    const base = Date.now();
    await this.prisma.order.createMany({
      data: items.map((item, i) => ({
        orderCode: (base + i).toString(),
        buyerCode,
        productCode: item.productCode,
        quantity: item.quantity,
        status: -1,
        note: item.note,
      })),
    });
    const sellers = [...new Set(products.map((p) => p.sellerCode))];
    this.push.sendToTopics(
      "Thông báo ấn phẩm",
      "Vừa có người đặt mua ấn phẩm của bạn, hãy vào ứng dụng để xem chi tiết",
      sellers,
      {
        fcm_type: "notification",
        notification_type: "product",
        title: "Thông báo ấn phẩm",
        body: "Vừa có người đặt mua ấn phẩm của bạn, hãy vào ứng dụng để xem chi tiết",
        click_action: "Trigger",
        fragment_opened: "shopping",
      },
    );
  }

  /** Đơn mình đã mua. */
  async myOrders(buyerCode: string, q: PaginationQuery): Promise<PaginatedResult<OrderItem>> {
    const [total, orders]: [number, OrderWithProductSellerRow[]] = await Promise.all([
      this.prisma.order.count({ where: { buyerCode } }),
      this.prisma.order.findMany({
        where: { buyerCode },
        orderBy: { createdAt: "desc" },
        include: {
          product: { include: { seller: { select: { fullName: true } } } },
        },
        ...toPrismaPage(q),
      }),
    ]);
    return toPaginated(
      orders.map((o) => this.orderWithUrls(o)),
      total,
      q,
    );
  }

  /** Đơn người khác đặt ấn phẩm mình. */
  async receivedOrders(sellerCode: string, q: PaginationQuery): Promise<PaginatedResult<OrderItem>> {
    const where = { product: { sellerCode } };
    const [total, orders]: [number, OrderWithBuyerProductRow[]] = await Promise.all([
      this.prisma.order.count({ where }),
      this.prisma.order.findMany({
        where,
        orderBy: { createdAt: "desc" },
        include: {
          buyer: { select: { fullName: true, phone: true } },
          product: true,
        },
        ...toPrismaPage(q),
      }),
    ]);
    return toPaginated(
      orders.map((o) => this.orderWithUrls(o)),
      total,
      q,
    );
  }

  async cancel(orderCode: string, studentCode: string): Promise<void> {
    const order = await this.getOrderOr404(orderCode);
    const isBuyer = order.buyerCode === studentCode;
    const isSeller = order.product.sellerCode === studentCode;
    if (!isBuyer && !isSeller) throw new AppException(HttpStatus.FORBIDDEN, PRODUCT_ERRORS.ORDER_FORBIDDEN);
    await this.prisma.order.delete({ where: { orderCode } });
  }

  /** Seller xác nhận đơn (state -1 → 0). */
  async confirm(orderCode: string, studentCode: string): Promise<void> {
    await this.assertSeller(orderCode, studentCode);
    await this.prisma.order.update({ where: { orderCode }, data: { status: 0 } });
  }

  /** Seller hoàn thành đơn (→ 1). */
  async done(orderCode: string, studentCode: string): Promise<void> {
    await this.assertSeller(orderCode, studentCode);
    await this.prisma.order.update({ where: { orderCode }, data: { status: 1 } });
  }

  private async getOrderOr404(orderCode: string): Promise<OrderWithProductRow> {
    const order: OrderWithProductRow | null = await this.prisma.order.findUnique({
      where: { orderCode },
      include: { product: true },
    });
    if (!order) throw new AppException(HttpStatus.NOT_FOUND, PRODUCT_ERRORS.ORDER_NOT_FOUND);
    return order;
  }

  private async assertSeller(orderCode: string, studentCode: string): Promise<void> {
    const order = await this.getOrderOr404(orderCode);
    if (order.product.sellerCode !== studentCode) {
      throw new AppException(HttpStatus.FORBIDDEN, PRODUCT_ERRORS.ORDER_FORBIDDEN);
    }
  }

  private withUrls<T extends { imageKeys: string; seller?: object | null }>(
    p: T,
  ): T & { imageUrls: string[]; seller: ProductSeller | null } {
    const seller = p.seller as { avatarKey?: string | null } | null | undefined;
    return {
      ...p,
      imageUrls: this.storage.urls(p.imageKeys),
      seller: (seller && "avatarKey" in seller
        ? { ...seller, avatarUrl: this.storage.url(seller.avatarKey ?? null) }
        : p.seller) as ProductSeller | null,
    };
  }

  private orderWithUrls<T extends { product: { imageKeys: string } }>(
    o: T,
  ): T & { product: T["product"] & { imageUrls: string[] } } {
    return {
      ...o,
      product: { ...o.product, imageUrls: this.storage.urls(o.product.imageKeys) },
    };
  }
}
