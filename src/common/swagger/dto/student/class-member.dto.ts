import { ApiProperty } from "@nestjs/swagger";

export class ClassMemberDto {
  @ApiProperty()
  studentCode: string;
  @ApiProperty()
  classCode: string;
  @ApiProperty({ nullable: true })
  fullName: string | null;
  @ApiProperty({ nullable: true })
  birthDate: string | null;
  @ApiProperty({ nullable: true })
  avatarKey: string | null;
  @ApiProperty({ nullable: true })
  avatarUrl: string | null;
}
