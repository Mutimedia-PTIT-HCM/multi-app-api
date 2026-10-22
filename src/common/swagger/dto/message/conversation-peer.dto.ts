import { ApiProperty } from "@nestjs/swagger";

export class ConversationPeerDto {
  @ApiProperty()
  studentCode: string;
  @ApiProperty({ type: "string", nullable: true })
  fullName?: string | null;
  @ApiProperty({ type: "string", nullable: true })
  avatarKey?: string | null;
  @ApiProperty({ type: "string", nullable: true })
  avatarUrl?: string | null;
}
