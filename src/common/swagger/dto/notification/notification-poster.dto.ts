import { ApiProperty } from "@nestjs/swagger";

export class NotificationPosterDto {
  @ApiProperty()
  studentCode: string;
  @ApiProperty({ nullable: true })
  fullName: string | null;
  @ApiProperty({ nullable: true })
  avatarUrl: string | null;
}
