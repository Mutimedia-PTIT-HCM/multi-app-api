import { ApiProperty } from "@nestjs/swagger";
import { NotificationAttachmentDto } from "./notification-attachment.dto";
import { NotificationPosterDto } from "./notification-poster.dto";

export class NotificationItemDto {
  @ApiProperty()
  recipientId: number;
  @ApiProperty()
  notificationCode: string;
  @ApiProperty()
  seen: boolean;
  @ApiProperty()
  title: string;
  @ApiProperty()
  content: string;
  @ApiProperty()
  sentAt: Date;
  @ApiProperty({ example: "normal", description: "normal | schedule | ..." })
  type: string;
  @ApiProperty({ type: NotificationPosterDto })
  poster: NotificationPosterDto;
  @ApiProperty({ type: [NotificationAttachmentDto] })
  attachments: NotificationAttachmentDto[];
}
