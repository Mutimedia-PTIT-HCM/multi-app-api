import { ApiProperty } from "@nestjs/swagger";

export class OrderBuyerDto {
  @ApiProperty({ nullable: true })
  fullName: string | null;
  @ApiProperty({ nullable: true })
  phone: string | null;
}
