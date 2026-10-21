import { ApiProperty } from "@nestjs/swagger";
import { AvatarUserDto } from "../student/avatar-user.dto";

export class MessageItemDto {
  @ApiProperty()
  messageCode: string;
  @ApiProperty()
  senderCode: string;
  @ApiProperty()
  receiverCode: string;
  @ApiProperty({ nullable: true })
  content: string | null;
  @ApiProperty()
  sentAt: Date;
  @ApiProperty()
  state: number;
  @ApiProperty({ type: AvatarUserDto })
  sender: AvatarUserDto;
}
