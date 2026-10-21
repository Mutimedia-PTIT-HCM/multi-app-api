import { ApiProperty } from "@nestjs/swagger";
import { ClassMemberDto } from "../student/class-member.dto";
import { FormWithPointsDto } from "./form-with-points.dto";

export class ClassMemberPointsDto extends ClassMemberDto {
  @ApiProperty({ type: [FormWithPointsDto] })
  points: FormWithPointsDto[];
}
