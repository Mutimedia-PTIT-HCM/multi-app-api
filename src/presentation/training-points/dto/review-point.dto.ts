import { IsNotEmpty, IsString } from "class-validator";
import { SelfAssessDto } from "./self-assess.dto";

export class ReviewPointDto extends SelfAssessDto {
  @IsString()
  @IsNotEmpty()
  studentCode!: string;
}
