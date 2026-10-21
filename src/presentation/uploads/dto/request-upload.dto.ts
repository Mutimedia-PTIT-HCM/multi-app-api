import { ApiProperty } from "@nestjs/swagger";
import { IsIn, IsNotEmpty, IsString, Matches } from "class-validator";

export class RequestUploadDto {
  @ApiProperty({ enum: ["avatar", "product", "notification", "event", "cert", "misc"], example: "product" })
  @IsIn(["avatar", "product", "notification", "event", "cert", "misc"])
  purpose: string;

  @ApiProperty({ example: "ao-khoac.jpg", description: "Tên file gốc — chỉ dùng để lấy extension" })
  @IsString()
  @IsNotEmpty()
  fileName: string;

  @ApiProperty({ example: "image/jpeg", description: "MIME type — client phải gửi đúng type này khi PUT" })
  @Matches(/^[a-z]+\/[a-z0-9.+-]+$/i)
  contentType: string;
}
