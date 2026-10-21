import { ApiProperty } from "@nestjs/swagger";

export class ConversationPeerDto {
  @ApiProperty()
  studentCode: string;
  @ApiProperty({ nullable: true })
  fullName?: string | null;
  @ApiProperty({ nullable: true })
  avatarKey?: string | null;
  @ApiProperty({ nullable: true })
  avatarUrl?: string | null;
}
