import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";

export class UpdateTeacherDto {
  @ApiPropertyOptional({ example: "1980-01-15" })
  @IsOptional()
  @IsString()
  birthDate?: string;

  @ApiPropertyOptional({ example: "0901234567" })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: "gv@ptithcm.edu.vn" })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({ example: "Thạc sĩ" })
  @IsOptional()
  @IsString()
  academicRank?: string;

  @ApiPropertyOptional({ example: "Tiến sĩ" })
  @IsOptional()
  @IsString()
  degree?: string;
}
