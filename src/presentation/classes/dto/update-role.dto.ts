import { IsInt, IsNotEmpty, IsString, Max, Min } from "class-validator";

export class UpdateRoleDto {
  @IsString()
  @IsNotEmpty()
  studentCode!: string;

  @IsInt()
  @Min(0)
  @Max(7)
  role!: number;
}
