import { ApiProperty } from "@nestjs/swagger";
import { OrderBuyerDto } from "./order-buyer.dto";
import { ProductItemDto } from "./product-item.dto";

export class OrderItemDto {
  @ApiProperty()
  orderCode: string;
  @ApiProperty()
  buyerCode: string;
  @ApiProperty()
  productCode: string;
  @ApiProperty()
  quantity: number;
  @ApiProperty({ example: -1, description: "-1 mới đặt, 0 đã xác nhận, 1 hoàn thành" })
  status: number;
  @ApiProperty()
  note: string;
  @ApiProperty()
  createdAt: Date;
  @ApiProperty({ type: ProductItemDto })
  product: ProductItemDto;
  @ApiProperty({ type: OrderBuyerDto, nullable: true, required: false })
  buyer?: OrderBuyerDto | null;
}
