import { NotificationsService } from "@app-application/notifications";
import { NOTIFICATIONS_PORT } from "@app-contracts";
import { Module } from "@nestjs/common";
import { NotificationsController } from "./notifications.controller";

@Module({
  controllers: [NotificationsController],
  providers: [{ provide: NOTIFICATIONS_PORT, useClass: NotificationsService }],
})
export class NotificationsModule {}
