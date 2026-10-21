import { ApiProperty } from "@nestjs/swagger";
import { IsInt, IsNotEmpty, IsString, Max, Min } from "class-validator";

export class UpdateRoleDto {
  @ApiProperty({ example: "N18DCPT064" })
  @IsString()
  @IsNotEmpty()
  studentCode!: string;

  @ApiProperty({ example: 6, minimum: 0, maximum: 7 })
  @IsInt()
  @Min(0)
  @Max(7)
  role!: number;
}
