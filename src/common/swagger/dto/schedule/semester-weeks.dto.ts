import { ApiProperty } from "@nestjs/swagger";

export class SemesterWeeksDto {
  @ApiProperty()
  totalWeeks: number;
  @ApiProperty()
  currentWeek: number;
  @ApiProperty({ example: "20252" })
  semesterCode: string;
}
