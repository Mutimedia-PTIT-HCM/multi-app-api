import { ApiProperty } from "@nestjs/swagger";

export class BooleanResultDto {
  @ApiProperty({ example: true })
  value: boolean;
}
