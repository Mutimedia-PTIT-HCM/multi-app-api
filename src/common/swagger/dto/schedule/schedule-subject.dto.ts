import { ApiProperty } from "@nestjs/swagger";

export class ScheduleSubjectDto {
  @ApiProperty()
  subjectCode: string;
  @ApiProperty()
  subjectName: string;
  @ApiProperty()
  credits: number;
  @ApiProperty({ example: "Thứ Hai" })
  dayOfWeek: string;
  @ApiProperty()
  lecturer: string;
  @ApiProperty()
  room: string;
  @ApiProperty()
  startPeriod: number;
  @ApiProperty()
  periodCount: number;
}
