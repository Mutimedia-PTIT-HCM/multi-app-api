import { IsInt, Min } from "class-validator";

export class SelfAssessDto {
  @IsInt()
  formId!: number;

  @IsInt()
  @Min(0)
  point!: number;
}
