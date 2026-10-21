import { SystemModule } from "@app-presentation/system";
import { Module } from "@nestjs/common";
import { ScheduleController } from "./schedule.controller";

@Module({
  imports: [SystemModule],
  controllers: [ScheduleController],
})
export class ScheduleModule {}
