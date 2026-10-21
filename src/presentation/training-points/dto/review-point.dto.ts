import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";
import { SelfAssessDto } from "./self-assess.dto";

export class ReviewPointDto extends SelfAssessDto {
  @ApiProperty({ example: "N18DCPT064" })
  @IsString()
  @IsNotEmpty()
  studentCode!: string;
}
