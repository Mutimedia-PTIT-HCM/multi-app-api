import { ApiProperty } from "@nestjs/swagger";

export class PresignedUploadDto {
  @ApiProperty({ description: "Object key — truyền vào API nghiệp vụ sau khi upload" })
  key: string;
  @ApiProperty({ description: "PUT binary file lên URL này" })
  uploadUrl: string;
  @ApiProperty({ example: "PUT" })
  method: string;
  @ApiProperty()
  contentType: string;
  @ApiProperty()
  publicUrl: string;
}
