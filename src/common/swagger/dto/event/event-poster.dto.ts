import { ApiProperty } from "@nestjs/swagger";

export class EventPosterDto {
  @ApiProperty({ nullable: true, required: false })
  fullName?: string | null;
  @ApiProperty({ nullable: true, required: false })
  avatarKey?: string | null;
  @ApiProperty({ nullable: true, required: false })
  avatarUrl?: string | null;
}
