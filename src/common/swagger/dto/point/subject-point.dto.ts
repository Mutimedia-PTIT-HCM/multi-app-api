import { ApiProperty } from "@nestjs/swagger";

export class SubjectPointDto {
  @ApiProperty()
  subjectCode: string;
  @ApiProperty()
  subjectName: string;
  @ApiProperty()
  credits: number;
  @ApiProperty({ nullable: true })
  attendance: number | null;
  @ApiProperty({ nullable: true })
  midterm: number | null;
  @ApiProperty({ nullable: true })
  exercise: number | null;
  @ApiProperty({ nullable: true })
  practice: number | null;
  @ApiProperty({ nullable: true })
  exam: number | null;
  @ApiProperty({ nullable: true })
  final: number | null;
}
