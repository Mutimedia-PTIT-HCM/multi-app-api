import { ApiProperty } from "@nestjs/swagger";

export class TeacherDto {
  @ApiProperty()
  teacherCode: string;
  @ApiProperty({ nullable: true })
  fullName: string | null;
  @ApiProperty({ nullable: true })
  birthDate: string | null;
  @ApiProperty({ nullable: true })
  zalo: string | null;
  @ApiProperty({ nullable: true })
  phone: string | null;
  @ApiProperty({ nullable: true })
  email: string | null;
  @ApiProperty({ nullable: true })
  academicRank: string | null;
  @ApiProperty({ nullable: true })
  degree: string | null;
}
