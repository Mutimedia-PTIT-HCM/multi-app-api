import { ApiPropertyOptional } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsBoolean, IsEmail, IsOptional, IsString } from "class-validator";

const toBool = ({ value }: { value: unknown }) =>
  value === true || value === "true" || value === "1" || value === 1;

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: "https://facebook.com/user" })
  @IsOptional()
  @IsString()
  facebook?: string;

  @ApiPropertyOptional({ example: "user@gmail.com" })
  @IsOptional()
  @IsEmail()
  personalEmail?: string;

  @ApiPropertyOptional({ example: "0901234567" })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @Transform(toBool)
  @IsBoolean()
  hidePersonalEmail?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @Transform(toBool)
  @IsBoolean()
  hideFacebook?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @Transform(toBool)
  @IsBoolean()
  hidePhone?: boolean;
}
