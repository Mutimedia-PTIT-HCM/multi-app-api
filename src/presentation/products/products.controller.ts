import { ProductsService } from "@app-application/products";
import { ApiResult, CurrentUser, StudentAuthGuard } from "@app-common";
import { UploadedFilePayload } from "@app-type";
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FilesInterceptor } from "@nestjs/platform-express";
import { CreateOrderDto } from "./dto/create-order.dto";

@Controller()
@UseGuards(StudentAuthGuard)
export class ProductsController {
  constructor(private readonly products: ProductsService) {}

  // ---------- Products ----------

  /** Đăng ấn phẩm (multipart: files[] ≤3 + name/price/stock/description). */
  @Post("products")
  @UseInterceptors(FilesInterceptor("files", 3, { limits: { fileSize: 10 * 1024 * 1024 } }))
  async create(
    @CurrentUser("studentCode") code: string,
    @Body() body: Record<string, string>,
    @UploadedFiles() files: UploadedFilePayload[],
  ) {
    const product = await this.products.create(
      code,
      {
        name: body.name ?? "",
        price: body.price,
        stock: parseInt(body.stock ?? "0", 10) || 0,
        description: body.description,
      },
      files ?? [],
    );
    return new ApiResult("Đăng ấn phẩm thành công", product);
  }

  /** Danh sách ấn phẩm — ?codes=a,b,c lọc theo mã. */
  @Get("products")
  async list(@Query("codes") codes?: string) {
    const list = codes
      ?.split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    return new ApiResult("Lấy ấn phẩm thành công", await this.products.list(list));
  }

  @Get("products/:productCode")
  async getOne(@Param("productCode") productCode: string) {
    return new ApiResult("Lấy ấn phẩm thành công", await this.products.getByCode(productCode));
  }

  // ---------- Orders ----------

  /** Đặt hàng: [{productCode, quantity, note}] */
  @Post("orders")
  async placeOrders(@CurrentUser("studentCode") code: string, @Body() items: CreateOrderDto[]) {
    await this.products.placeOrders(code, items);
    return new ApiResult(
      "Đặt mua thành công. Người bán ấn phẩm sẽ liên hệ với bạn sau khi thấy đơn hàng của bạn",
      null,
    );
  }

  /** Đơn mình đã mua. */
  @Get("orders/mine")
  async myOrders(@CurrentUser("studentCode") code: string) {
    return new ApiResult("Lấy đơn hàng thành công", await this.products.myOrders(code));
  }

  /** Đơn người khác mua ấn phẩm mình. */
  @Get("orders/received")
  async receivedOrders(@CurrentUser("studentCode") code: string) {
    return new ApiResult("Lấy đơn hàng thành công", await this.products.receivedOrders(code));
  }

  @Delete("orders/:orderCode")
  async cancel(@CurrentUser("studentCode") code: string, @Param("orderCode") orderCode: string) {
    await this.products.cancel(orderCode, code);
    return new ApiResult("Thành công", null);
  }

  @Post("orders/:orderCode/confirm")
  async confirm(@CurrentUser("studentCode") code: string, @Param("orderCode") orderCode: string) {
    await this.products.confirm(orderCode, code);
    return new ApiResult("Thành công", null);
  }

  @Post("orders/:orderCode/done")
  async done(@CurrentUser("studentCode") code: string, @Param("orderCode") orderCode: string) {
    await this.products.done(orderCode, code);
    return new ApiResult("Thành công", null);
  }
}
