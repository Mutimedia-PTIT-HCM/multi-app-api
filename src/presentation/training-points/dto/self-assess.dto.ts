import { Transform } from "class-transformer";
import { IsBoolean, IsInt, IsNotEmpty, IsString, Min } from "class-validator";

const toBool = ({ value }: { value: unknown }) =>
  value === true || value === "true" || value === "1" || value === 1;

export class SelfAssessDto {
  @IsInt()
  formId!: number;

  @IsInt()
  @Min(0)
  point!: number;
}

export class ReviewPointDto extends SelfAssessDto {
  @IsString()
  @IsNotEmpty()
  studentCode!: string;
}

export class ToggleStatusDto {
  @Transform(toBool)
  @IsBoolean()
  isOpen!: boolean;
}
