import { ApiProperty } from "@nestjs/swagger";

export class ClassMemberDto {
  @ApiProperty()
  studentCode: string;
  @ApiProperty()
  classCode: string;
  @ApiProperty({ type: "string", nullable: true })
  fullName: string | null;
  @ApiProperty({ type: "string", nullable: true })
  birthDate: string | null;
  @ApiProperty({ type: "string", nullable: true })
  avatarKey: string | null;
  @ApiProperty({ type: "string", nullable: true })
  avatarUrl: string | null;
}
