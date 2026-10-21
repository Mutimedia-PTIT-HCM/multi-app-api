import { Module } from "@nestjs/common";
import { AcademicPointsController } from "./academic-points.controller";

@Module({
  controllers: [AcademicPointsController],
})
export class AcademicPointsModule {}
