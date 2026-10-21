import { MessagesService } from "@app-application/messages";
import { MESSAGES_PORT } from "@app-contracts";
import { Module } from "@nestjs/common";
import { MessagesController } from "./messages.controller";
import { MessagesGateway } from "./messages.gateway";
import { WsAuthGuard } from "./ws-auth.guard";

@Module({
  controllers: [MessagesController],
  providers: [{ provide: MESSAGES_PORT, useClass: MessagesService }, MessagesGateway, WsAuthGuard],
  exports: [MESSAGES_PORT],
})
export class MessagesModule {}
