import { IMessagesService, MESSAGES_PORT } from "@app-contracts";
import { Inject, Logger, UseGuards } from "@nestjs/common";
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { WsAuthGuard } from "./ws-auth.guard";
import { WsCurrentUser } from "./ws-current-user.decorator";

interface SendMessagePayload {
  receiver: string;
  content: string;
}

@WebSocketGateway({ cors: { origin: "*" } })
@UseGuards(WsAuthGuard)
export class MessagesGateway implements OnGatewayConnection {
  private readonly logger = new Logger(MessagesGateway.name);

  @WebSocketServer()
  server!: Server;

  constructor(@Inject(MESSAGES_PORT) private readonly messages: IMessagesService) {}

  handleConnection(client: Socket) {
    this.logger.log(`socket connected: ${client.id}`);
  }

  /** Client join room theo mssv của mình (giữ event name legacy). */
  @SubscribeMessage("LOGIN")
  handleLogin(@ConnectedSocket() client: Socket, @WsCurrentUser() user: { studentCode: string }) {
    client.join(user.studentCode);
    this.logger.log(`${user.studentCode} joined room`);
  }

  /** Gửi tin nhắn 1-1: lưu DB + FCM + emit tới room người nhận (event legacy). */
  @SubscribeMessage("SEND_MESSAGE_TO_RECEIVER")
  async handleSend(
    @MessageBody() payload: SendMessagePayload,
    @WsCurrentUser() user: { studentCode: string },
  ) {
    const message = await this.messages.send(user.studentCode, payload.receiver, payload.content);
    this.server.to(payload.receiver).emit("NEW_MESSAGE", {
      messageCode: message.messageCode,
      sender: user.studentCode,
      content: payload.content,
      receiver: payload.receiver,
      sentAt: message.sentAt,
      state: 1,
    });
    return message;
  }
}
