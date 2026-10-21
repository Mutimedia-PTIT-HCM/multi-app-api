import { IsInt, IsNotEmpty, IsString, Min } from "class-validator";

export class CreateOrderDto {
  @IsString()
  @IsNotEmpty()
  productCode!: string;

  @IsInt()
  @Min(1)
  quantity!: number;

  @IsString()
  note!: string;
}
