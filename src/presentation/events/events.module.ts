import { EventsService } from "@app-application/events";
import { EVENTS_PORT } from "@app-contracts";
import { Module } from "@nestjs/common";
import { EventsController } from "./events.controller";

@Module({
  controllers: [EventsController],
  providers: [{ provide: EVENTS_PORT, useClass: EventsService }],
})
export class EventsModule {}
