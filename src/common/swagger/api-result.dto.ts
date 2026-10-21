import { ApiProperty } from "@nestjs/swagger";

/** Envelope thành công chuẩn — ResponseInterceptor wrap mọi response thành shape này. */
export class ApiResultDto {
  @ApiProperty({ example: false })
  error: boolean;

  @ApiProperty({ example: "Thành công" })
  message: string;
}
