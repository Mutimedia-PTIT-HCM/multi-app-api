import { ApiProperty } from "@nestjs/swagger";

export class SubjectPointDto {
  @ApiProperty()
  subjectCode: string;
  @ApiProperty()
  subjectName: string;
  @ApiProperty()
  credits: number;
  @ApiProperty({ type: "number", nullable: true })
  attendance: number | null;
  @ApiProperty({ type: "number", nullable: true })
  midterm: number | null;
  @ApiProperty({ type: "number", nullable: true })
  exercise: number | null;
  @ApiProperty({ type: "number", nullable: true })
  practice: number | null;
  @ApiProperty({ type: "number", nullable: true })
  exam: number | null;
  @ApiProperty({ type: "number", nullable: true })
  final: number | null;
}
