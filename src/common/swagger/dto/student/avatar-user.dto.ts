import { ApiProperty } from "@nestjs/swagger";

export class AvatarUserDto {
  @ApiProperty({ nullable: true })
  fullName: string | null;
  @ApiProperty({ nullable: true })
  avatarKey: string | null;
  @ApiProperty({ nullable: true })
  avatarUrl: string | null;
}
