import { TeachersService } from "@app-application/teachers";
import { TEACHERS_PORT } from "@app-contracts";
import { Module } from "@nestjs/common";
import { TeachersController } from "./teachers.controller";

@Module({
  controllers: [TeachersController],
  providers: [{ provide: TEACHERS_PORT, useClass: TeachersService }],
})
export class TeachersModule {}
