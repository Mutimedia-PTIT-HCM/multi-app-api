import { PrismaService } from "@app-infra/prisma";
import { PushService } from "@app-infra/push";
import { StorageService } from "@app-infra/storage";
import { UploadedFilePayload } from "@app-type";
import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";

@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly push: PushService,
  ) {}

  async create(
    sellerCode: string,
    input: { name: string; price?: string; stock: number; description?: string },
    files: UploadedFilePayload[],
  ) {
    const keys: string[] = [];
    for (const f of files) {
      const key = this.storage.generateKey("products", f.originalname);
      await this.storage.upload(key, f.buffer, f.mimetype);
      keys.push(key);
    }
    const product = await this.prisma.product.create({
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

  async list(productCodes?: string[]) {
    const products = await this.prisma.product.findMany({
      where: productCodes ? { productCode: { in: productCodes } } : undefined,
      orderBy: { createdAt: "desc" },
      include: { seller: { select: { fullName: true } } },
    });
    return products.map((p) => this.withUrls(p));
  }

  async getByCode(productCode: string) {
    const product = await this.prisma.product.findUnique({
      where: { productCode },
      include: { seller: { select: { fullName: true, avatarKey: true } } },
    });
    if (!product) throw new NotFoundException("Không tìm thấy ấn phẩm này");
    return this.withUrls(product);
  }

  async placeOrders(buyerCode: string, items: { productCode: string; quantity: number; note: string }[]) {
    if (items.length === 0) throw new BadRequestException("Đơn hàng trống");
    const products = await this.prisma.product.findMany({
      where: { productCode: { in: items.map((i) => i.productCode) } },
      select: { productCode: true, sellerCode: true },
    });
    const productMap = new Map(products.map((p) => [p.productCode, p]));
    for (const item of items) {
      const product = productMap.get(item.productCode);
      if (!product) throw new BadRequestException(`Ấn phẩm ${item.productCode} không tồn tại`);
      if (product.sellerCode === buyerCode) {
        throw new BadRequestException("Không thể đặt mua ấn phẩm của chính mình");
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
  async myOrders(buyerCode: string) {
    const orders = await this.prisma.order.findMany({
      where: { buyerCode },
      orderBy: { createdAt: "desc" },
      include: {
        product: { include: { seller: { select: { fullName: true } } } },
      },
    });
    return orders.map((o) => this.orderWithUrls(o));
  }

  /** Đơn người khác đặt ấn phẩm mình. */
  async receivedOrders(sellerCode: string) {
    const orders = await this.prisma.order.findMany({
      where: { product: { sellerCode } },
      orderBy: { createdAt: "desc" },
      include: {
        buyer: { select: { fullName: true, phone: true } },
        product: true,
      },
    });
    return orders.map((o) => this.orderWithUrls(o));
  }

  async cancel(orderCode: string, studentCode: string) {
    const order = await this.getOrderOr404(orderCode);
    const isBuyer = order.buyerCode === studentCode;
    const isSeller = order.product.sellerCode === studentCode;
    if (!isBuyer && !isSeller) throw new ForbiddenException("Không có quyền huỷ đơn này");
    await this.prisma.order.delete({ where: { orderCode } });
  }

  /** Seller xác nhận đơn (state -1 → 0). */
  async confirm(orderCode: string, studentCode: string) {
    await this.assertSeller(orderCode, studentCode);
    await this.prisma.order.update({ where: { orderCode }, data: { status: 0 } });
  }

  /** Seller hoàn thành đơn (→ 1). */
  async done(orderCode: string, studentCode: string) {
    await this.assertSeller(orderCode, studentCode);
    await this.prisma.order.update({ where: { orderCode }, data: { status: 1 } });
  }

  private async getOrderOr404(orderCode: string) {
    const order = await this.prisma.order.findUnique({
      where: { orderCode },
      include: { product: true },
    });
    if (!order) throw new NotFoundException("Không tìm thấy đơn hàng này");
    return order;
  }

  private async assertSeller(orderCode: string, studentCode: string) {
    const order = await this.getOrderOr404(orderCode);
    if (order.product.sellerCode !== studentCode) {
      throw new ForbiddenException("Không có quyền với đơn hàng này");
    }
  }

  private withUrls<T extends { imageKeys: string; seller?: object | null }>(p: T) {
    const seller = p.seller as { avatarKey?: string | null } | null | undefined;
    return {
      ...p,
      imageUrls: this.storage.urls(p.imageKeys),
      seller:
        seller && "avatarKey" in seller
          ? { ...seller, avatarUrl: this.storage.url(seller.avatarKey ?? null) }
          : p.seller,
    };
  }

  private orderWithUrls<T extends { product: { imageKeys: string } }>(o: T) {
    return {
      ...o,
      product: { ...o.product, imageUrls: this.storage.urls(o.product.imageKeys) },
    };
  }
}
