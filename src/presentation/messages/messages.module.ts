import { MessagesService } from "@app-application/messages";
import { Module } from "@nestjs/common";
import { MessagesController } from "./messages.controller";
import { MessagesGateway } from "./messages.gateway";
import { WsAuthGuard } from "./ws-auth.guard";

@Module({
  controllers: [MessagesController],
  providers: [MessagesService, MessagesGateway, WsAuthGuard],
  exports: [MessagesService],
})
export class MessagesModule {}
