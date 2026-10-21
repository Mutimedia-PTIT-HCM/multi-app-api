import { ProductsService } from "@app-application/products";
import { Module } from "@nestjs/common";
import { ProductsController } from "./products.controller";

@Module({
  controllers: [ProductsController],
  providers: [ProductsService],
})
export class ProductsModule {}
