import { ApiProperty } from "@nestjs/swagger";

export class NotificationAttachmentDto {
  @ApiProperty()
  url: string;
  @ApiProperty()
  name: string;
}
