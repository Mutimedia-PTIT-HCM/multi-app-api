import { ApiProperty } from "@nestjs/swagger";

/** Envelope lỗi chuẩn — AllExceptionsFilter normalize mọi lỗi thành shape này. */
export class ErrorResponseDto {
  @ApiProperty({ example: true })
  error: boolean;

  @ApiProperty({ example: "AUTH_001", description: "Mã lỗi theo module — client map sang chuỗi hiển thị" })
  code: string;

  @ApiProperty({ example: "Missing authentication credentials" })
  message: string;

  @ApiProperty({ example: null, nullable: true, type: String })
  data: null;
}
