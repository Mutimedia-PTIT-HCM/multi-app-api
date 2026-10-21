import { ClassesService } from "@app-application/classes";
import { CLASS_SYNC_QUEUE } from "@app-common";
import { BullModule } from "@nestjs/bullmq";
import { Module } from "@nestjs/common";
import { ClassesController } from "./classes.controller";

@Module({
  imports: [BullModule.registerQueue({ name: CLASS_SYNC_QUEUE })],
  controllers: [ClassesController],
  providers: [ClassesService],
  exports: [ClassesService],
})
export class ClassesModule {}
