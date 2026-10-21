import { ApiProperty } from "@nestjs/swagger";
import { ScheduleSubjectDto } from "./schedule-subject.dto";

export class ScheduleDayDto {
  @ApiProperty({ example: "21/10/2026" })
  date: string;
  @ApiProperty({ type: [ScheduleSubjectDto] })
  subjects: ScheduleSubjectDto[];
}
