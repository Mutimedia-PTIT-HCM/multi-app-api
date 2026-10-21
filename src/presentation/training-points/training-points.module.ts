import { TrainingPointsService } from "@app-application/training-points";
import { Module } from "@nestjs/common";
import { TrainingPointsController } from "./training-points.controller";

@Module({
  controllers: [TrainingPointsController],
  providers: [TrainingPointsService],
})
export class TrainingPointsModule {}
