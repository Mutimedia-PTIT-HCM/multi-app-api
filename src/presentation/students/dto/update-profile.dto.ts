import { Transform } from "class-transformer";
import { IsBoolean, IsEmail, IsOptional, IsString } from "class-validator";

const toBool = ({ value }: { value: unknown }) =>
  value === true || value === "true" || value === "1" || value === 1;

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  facebook?: string;

  @IsOptional()
  @IsEmail()
  personalEmail?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @Transform(toBool)
  @IsBoolean()
  hidePersonalEmail?: boolean;

  @IsOptional()
  @Transform(toBool)
  @IsBoolean()
  hideFacebook?: boolean;

  @IsOptional()
  @Transform(toBool)
  @IsBoolean()
  hidePhone?: boolean;
}
