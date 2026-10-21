import { NotificationsService } from "@app-application/notifications";
import { Module } from "@nestjs/common";
import { NotificationsController } from "./notifications.controller";

@Module({
  controllers: [NotificationsController],
  providers: [NotificationsService],
})
export class NotificationsModule {}
