import { EventsService } from "@app-application/events";
import { Module } from "@nestjs/common";
import { EventsController } from "./events.controller";

@Module({
  controllers: [EventsController],
  providers: [EventsService],
})
export class EventsModule {}
