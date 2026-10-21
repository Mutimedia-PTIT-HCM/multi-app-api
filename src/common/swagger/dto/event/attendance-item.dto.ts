import { ApiProperty } from "@nestjs/swagger";
import { AttendanceStudentDto } from "./attendance-student.dto";

export class AttendanceItemDto {
  @ApiProperty()
  id: number;
  @ApiProperty()
  eventCode: string;
  @ApiProperty()
  studentCode: string;
  @ApiProperty()
  checkInAt: Date;
  @ApiProperty({ nullable: true })
  location: string | null;
  @ApiProperty({ type: AttendanceStudentDto })
  student: AttendanceStudentDto;
}
