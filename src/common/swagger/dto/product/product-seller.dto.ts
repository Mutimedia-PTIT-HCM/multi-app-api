import { ApiProperty } from "@nestjs/swagger";

export class ProductSellerDto {
  @ApiProperty({ type: "string", nullable: true })
  fullName: string | null;
  @ApiProperty({ type: "string", nullable: true, required: false })
  avatarKey?: string | null;
  @ApiProperty({ type: "string", nullable: true, required: false })
  avatarUrl?: string | null;
}
