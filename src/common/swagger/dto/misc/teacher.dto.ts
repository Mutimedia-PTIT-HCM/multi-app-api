import { ApiProperty } from "@nestjs/swagger";

export class TeacherDto {
  @ApiProperty()
  teacherCode: string;
  @ApiProperty({ type: "string", nullable: true })
  fullName: string | null;
  @ApiProperty({ type: "string", nullable: true })
  birthDate: string | null;
  @ApiProperty({ type: "string", nullable: true })
  zalo: string | null;
  @ApiProperty({ type: "string", nullable: true })
  phone: string | null;
  @ApiProperty({ type: "string", nullable: true })
  email: string | null;
  @ApiProperty({ type: "string", nullable: true })
  academicRank: string | null;
  @ApiProperty({ type: "string", nullable: true })
  degree: string | null;
}
