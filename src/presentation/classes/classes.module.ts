import { ClassesService } from "@app-application/classes";
import { CLASS_SYNC_QUEUE } from "@app-common";
import { CLASSES_PORT } from "@app-contracts";
import { BullModule } from "@nestjs/bullmq";
import { Module } from "@nestjs/common";
import { ClassesController } from "./classes.controller";

@Module({
  imports: [BullModule.registerQueue({ name: CLASS_SYNC_QUEUE })],
  controllers: [ClassesController],
  providers: [{ provide: CLASSES_PORT, useClass: ClassesService }],
  exports: [CLASSES_PORT],
})
export class ClassesModule {}
