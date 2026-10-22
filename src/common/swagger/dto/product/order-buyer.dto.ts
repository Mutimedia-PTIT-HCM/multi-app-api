import { ApiProperty } from "@nestjs/swagger";

export class OrderBuyerDto {
  @ApiProperty({ type: "string", nullable: true })
  fullName: string | null;
  @ApiProperty({ type: "string", nullable: true })
  phone: string | null;
}
