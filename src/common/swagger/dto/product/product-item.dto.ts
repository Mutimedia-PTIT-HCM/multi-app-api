import { ApiProperty } from "@nestjs/swagger";
import { ProductSellerDto } from "./product-seller.dto";

export class ProductItemDto {
  @ApiProperty()
  productCode: string;
  @ApiProperty()
  sellerCode: string;
  @ApiProperty()
  name: string;
  @ApiProperty({ type: "string", nullable: true })
  price: string | null;
  @ApiProperty()
  stock: number;
  @ApiProperty({ type: "string", nullable: true })
  description: string | null;
  @ApiProperty({ type: [String] })
  imageUrls: string[];
  @ApiProperty()
  createdAt: Date;
  @ApiProperty({ type: ProductSellerDto, nullable: true })
  seller: ProductSellerDto | null;
}
