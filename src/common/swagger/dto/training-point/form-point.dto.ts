import { ApiProperty } from "@nestjs/swagger";

export class FormPointDto {
  @ApiProperty()
  id: number;
  @ApiProperty()
  selfPoint: number;
  @ApiProperty()
  finalPoint: number;
}
