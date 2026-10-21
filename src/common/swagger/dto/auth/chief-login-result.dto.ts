import { ApiProperty } from "@nestjs/swagger";
import { PublicStudentDto } from "../student/public-student.dto";

export class ChiefLoginResultDto {
  @ApiProperty()
  accessToken: string;
  @ApiProperty({ type: PublicStudentDto })
  student: PublicStudentDto;
}
