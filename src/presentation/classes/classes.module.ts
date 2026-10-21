import { CLASS_SYNC_QUEUE, ClassesService } from "@app-application/classes";
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
