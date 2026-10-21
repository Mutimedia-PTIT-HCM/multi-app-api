import { IsOptional, IsString } from "class-validator";

export class UpdateTeacherDto {
  @IsOptional()
  @IsString()
  birthDate?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  academicRank?: string;

  @IsOptional()
  @IsString()
  degree?: string;
}
