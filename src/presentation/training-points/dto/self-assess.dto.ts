import { ApiProperty } from "@nestjs/swagger";
import { IsInt, Min } from "class-validator";

export class SelfAssessDto {
  @ApiProperty({ example: 1, description: "ID tiêu chí trong form" })
  @IsInt()
  formId!: number;

  @ApiProperty({ example: 10, minimum: 0 })
  @IsInt()
  @Min(0)
  point!: number;
}
