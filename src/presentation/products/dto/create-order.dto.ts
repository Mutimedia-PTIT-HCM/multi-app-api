import { ApiProperty } from "@nestjs/swagger";
import { IsInt, IsNotEmpty, IsString, Min } from "class-validator";

export class CreateOrderDto {
  @ApiProperty({ example: "1729000000000" })
  @IsString()
  @IsNotEmpty()
  productCode!: string;

  @ApiProperty({ example: 1, minimum: 1 })
  @IsInt()
  @Min(1)
  quantity!: number;

  @ApiProperty({ example: "Giao tại cổng trường" })
  @IsString()
  note!: string;
}
