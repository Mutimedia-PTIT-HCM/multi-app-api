import { ApiProperty } from "@nestjs/swagger";

export class UploadedKeyDto {
  @ApiProperty()
  key: string;
}
