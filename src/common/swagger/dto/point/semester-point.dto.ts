import { ApiProperty } from "@nestjs/swagger";
import { SubjectPointDto } from "./subject-point.dto";

export class SemesterPointDto {
  @ApiProperty()
  year: number;
  @ApiProperty()
  semester: number;
  @ApiProperty()
  gpa: number;
  @ApiProperty({ type: [SubjectPointDto] })
  subjects: SubjectPointDto[];
}
