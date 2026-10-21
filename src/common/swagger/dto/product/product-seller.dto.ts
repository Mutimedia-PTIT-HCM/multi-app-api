import { ApiProperty } from "@nestjs/swagger";

export class ProductSellerDto {
  @ApiProperty({ nullable: true })
  fullName: string | null;
  @ApiProperty({ nullable: true, required: false })
  avatarKey?: string | null;
  @ApiProperty({ nullable: true, required: false })
  avatarUrl?: string | null;
}
