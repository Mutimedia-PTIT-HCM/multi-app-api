import { ApiProperty } from "@nestjs/swagger";
import { EventPosterDto } from "./event-poster.dto";

export class EventItemDto {
  @ApiProperty()
  eventCode: string;
  @ApiProperty()
  title: string;
  @ApiProperty()
  content: string;
  @ApiProperty({ nullable: true })
  eventTime: string | null;
  @ApiProperty()
  isDone: boolean;
  @ApiProperty({ nullable: true })
  thumbnailKey: string | null;
  @ApiProperty({ nullable: true })
  thumbnailUrl: string | null;
  @ApiProperty()
  posterCode: string;
  @ApiProperty()
  createdAt: Date;
  @ApiProperty({ type: EventPosterDto, nullable: true, required: false })
  poster?: EventPosterDto | null;
}
