import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class LoginDto {
  @ApiProperty({ example: "N18DCPT064", description: "Mã số sinh viên" })
  @IsString()
  @IsNotEmpty()
  studentCode!: string;

  @ApiProperty({ example: "your-uis-password", description: "Mật khẩu cổng UIS" })
  @IsString()
  @IsNotEmpty()
  password!: string;
}
