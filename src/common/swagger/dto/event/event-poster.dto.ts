import { ApiProperty } from "@nestjs/swagger";

export class EventPosterDto {
  @ApiProperty({ type: "string", nullable: true, required: false })
  fullName?: string | null;
  @ApiProperty({ type: "string", nullable: true, required: false })
  avatarKey?: string | null;
  @ApiProperty({ type: "string", nullable: true, required: false })
  avatarUrl?: string | null;
}
