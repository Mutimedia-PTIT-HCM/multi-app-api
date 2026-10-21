import { ProductsService } from "@app-application/products";
import { PRODUCTS_PORT } from "@app-contracts";
import { Module } from "@nestjs/common";
import { ProductsController } from "./products.controller";

@Module({
  controllers: [ProductsController],
  providers: [{ provide: PRODUCTS_PORT, useClass: ProductsService }],
})
export class ProductsModule {}
