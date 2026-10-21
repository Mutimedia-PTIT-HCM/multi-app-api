import { ProductsService } from "@app-application/products";
import { ApiResult, CurrentUser, PaginationQueryDto, rethrowError, StudentAuthGuard } from "@app-common";
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
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiParam, ApiQuery, ApiTags } from "@nestjs/swagger";
import { CreateOrderDto } from "./dto/create-order.dto";

@ApiTags("Products & Orders")
@ApiBearerAuth()
@Controller()
@UseGuards(StudentAuthGuard)
export class ProductsController {
  constructor(private readonly products: ProductsService) {}

  // ---------- Products ----------

  /** Đăng ấn phẩm (multipart: files[] ≤3 + name/price/stock/description). */
  @Post("products")
  @ApiOperation({ summary: "Đăng ấn phẩm (multipart: files[] ≤3 + name/price/stock/description)" })
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      required: ["name", "files"],
      properties: {
        name: { type: "string" },
        price: { type: "string", example: "50000" },
        stock: { type: "string", example: "5" },
        description: { type: "string" },
        files: { type: "array", items: { type: "string", format: "binary" } },
      },
    },
  })
  @UseInterceptors(FilesInterceptor("files", 3, { limits: { fileSize: 10 * 1024 * 1024 } }))
  async create(
    @CurrentUser("studentCode") code: string,
    @Body() body: Record<string, string>,
    @UploadedFiles() files: UploadedFilePayload[],
  ) {
    try {
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
    } catch (e) {
      rethrowError(e);
    }
  }

  /** Danh sách ấn phẩm — ?codes=a,b,c lọc theo mã. */
  @Get("products")
  @ApiOperation({ summary: "Danh sách ấn phẩm — phân trang" })
  @ApiQuery({ name: "codes", required: false, description: "Lọc theo mã, phân cách bởi dấu phẩy", example: "123,456" })
  async list(@Query("codes") codes: string | undefined, @Query() q: PaginationQueryDto) {
    try {
      const list = codes
        ?.split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      return new ApiResult("Lấy ấn phẩm thành công", await this.products.list(list, q));
    } catch (e) {
      rethrowError(e);
    }
  }

  @Get("products/:productCode")
  @ApiOperation({ summary: "Chi tiết 1 ấn phẩm" })
  @ApiParam({ name: "productCode" })
  async getOne(@Param("productCode") productCode: string) {
    try {
      return new ApiResult("Lấy ấn phẩm thành công", await this.products.getByCode(productCode));
    } catch (e) {
      rethrowError(e);
    }
  }

  // ---------- Orders ----------

  /** Đặt hàng: [{productCode, quantity, note}] */
  @Post("orders")
  @ApiOperation({ summary: "Đặt hàng nhiều ấn phẩm cùng lúc" })
  @ApiBody({ type: [CreateOrderDto] })
  async placeOrders(@CurrentUser("studentCode") code: string, @Body() items: CreateOrderDto[]) {
    try {
      await this.products.placeOrders(code, items);
      return new ApiResult(
        "Đặt mua thành công. Người bán ấn phẩm sẽ liên hệ với bạn sau khi thấy đơn hàng của bạn",
        null,
      );
    } catch (e) {
      rethrowError(e);
    }
  }

  /** Đơn mình đã mua. */
  @Get("orders/mine")
  @ApiOperation({ summary: "Đơn mình đã mua — phân trang" })
  async myOrders(@CurrentUser("studentCode") code: string, @Query() q: PaginationQueryDto) {
    try {
      return new ApiResult("Lấy đơn hàng thành công", await this.products.myOrders(code, q));
    } catch (e) {
      rethrowError(e);
    }
  }

  /** Đơn người khác mua ấn phẩm mình. */
  @Get("orders/received")
  @ApiOperation({ summary: "Đơn người khác mua ấn phẩm mình — phân trang" })
  async receivedOrders(@CurrentUser("studentCode") code: string, @Query() q: PaginationQueryDto) {
    try {
      return new ApiResult("Lấy đơn hàng thành công", await this.products.receivedOrders(code, q));
    } catch (e) {
      rethrowError(e);
    }
  }

  @Delete("orders/:orderCode")
  @ApiOperation({ summary: "Huỷ đơn (buyer hoặc seller)" })
  async cancel(@CurrentUser("studentCode") code: string, @Param("orderCode") orderCode: string) {
    try {
      await this.products.cancel(orderCode, code);
      return new ApiResult("Thành công", null);
    } catch (e) {
      rethrowError(e);
    }
  }

  @Post("orders/:orderCode/confirm")
  @ApiOperation({ summary: "Seller xác nhận đơn" })
  async confirm(@CurrentUser("studentCode") code: string, @Param("orderCode") orderCode: string) {
    try {
      await this.products.confirm(orderCode, code);
      return new ApiResult("Thành công", null);
    } catch (e) {
      rethrowError(e);
    }
  }

  @Post("orders/:orderCode/done")
  @ApiOperation({ summary: "Seller hoàn thành đơn" })
  async done(@CurrentUser("studentCode") code: string, @Param("orderCode") orderCode: string) {
    try {
      await this.products.done(orderCode, code);
      return new ApiResult("Thành công", null);
    } catch (e) {
      rethrowError(e);
    }
  }
}
