import { ApiProperty } from "@nestjs/swagger";
import { ConversationPeerDto } from "./conversation-peer.dto";
import { MessageItemDto } from "./message-item.dto";

export class ConversationItemDto {
  @ApiProperty({ type: ConversationPeerDto })
  peer: ConversationPeerDto;
  @ApiProperty({ type: MessageItemDto, nullable: true })
  lastMessage: MessageItemDto | null;
}
