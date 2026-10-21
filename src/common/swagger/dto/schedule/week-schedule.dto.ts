import { ApiProperty } from "@nestjs/swagger";
import { ScheduleDayDto } from "./schedule-day.dto";

export class WeekScheduleDto {
  @ApiProperty()
  week: number;
  @ApiProperty({ example: "20252" })
  semesterCode: string;
  @ApiProperty({ type: [ScheduleDayDto] })
  days: ScheduleDayDto[];
}
