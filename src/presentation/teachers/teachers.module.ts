import { TeachersService } from "@app-application/teachers";
import { Module } from "@nestjs/common";
import { TeachersController } from "./teachers.controller";

@Module({
  controllers: [TeachersController],
  providers: [TeachersService],
})
export class TeachersModule {}
