import { ApiProperty } from "@nestjs/swagger";

export class CertificateItemDto {
  @ApiProperty()
  id: number;
  @ApiProperty()
  studentCode: string;
  @ApiProperty()
  title: string;
  @ApiProperty({ type: [String] })
  imageUrls: string[];
  @ApiProperty()
  createdAt: Date;
}
