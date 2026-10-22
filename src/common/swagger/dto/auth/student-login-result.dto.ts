import { ApiProperty } from "@nestjs/swagger";
import { PublicStudentDto } from "../student/public-student.dto";

export class StudentLoginResultDto {
  @ApiProperty()
  accessToken: string;
  @ApiProperty({ type: "string", nullable: true, description: "Có khi SV cũng là BCS (role 3/4/7)" })
  accessTokenChief: string | null;
  @ApiProperty({ type: PublicStudentDto })
  student: PublicStudentDto;
}
