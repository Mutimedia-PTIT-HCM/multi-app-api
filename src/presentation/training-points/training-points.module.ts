import { TrainingPointsService } from "@app-application/training-points";
import { TRAINING_POINTS_PORT } from "@app-contracts";
import { Module } from "@nestjs/common";
import { TrainingPointsController } from "./training-points.controller";

@Module({
  controllers: [TrainingPointsController],
  providers: [{ provide: TRAINING_POINTS_PORT, useClass: TrainingPointsService }],
})
export class TrainingPointsModule {}
