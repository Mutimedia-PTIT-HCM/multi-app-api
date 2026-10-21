import { ApiProperty } from "@nestjs/swagger";

export class PublicStudentDto {
  @ApiProperty({ example: "B21DCCN001" })
  studentCode: string;
  @ApiProperty({ example: "D21CQCN01-B" })
  classCode: string;
  @ApiProperty({ nullable: true, example: "Nguyễn Văn A" })
  fullName: string | null;
  @ApiProperty({ nullable: true })
  phone: string | null;
  @ApiProperty({ nullable: true })
  personalEmail: string | null;
  @ApiProperty({ nullable: true })
  facebook: string | null;
  @ApiProperty({ example: 0, description: "0 Nam, 1 Nữ" })
  gender: number;
  @ApiProperty({ nullable: true, example: "01/01/2003" })
  birthDate: string | null;
  @ApiProperty({ nullable: true })
  avatarKey: string | null;
  @ApiProperty({ nullable: true })
  avatarUrl: string | null;
  @ApiProperty({ example: 6 })
  role: number;
  @ApiProperty()
  isCollaborator: boolean;
  @ApiProperty()
  hidePersonalEmail: boolean;
  @ApiProperty()
  hideFacebook: boolean;
  @ApiProperty()
  hidePhone: boolean;
  @ApiProperty()
  createdAt: Date;
  @ApiProperty()
  updatedAt: Date;
}
