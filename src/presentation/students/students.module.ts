import { StudentsService } from "@app-application/students";
import { AuthModule } from "@app-presentation/auth";
import { Module } from "@nestjs/common";
import { StudentsController } from "./students.controller";

@Module({
  imports: [AuthModule],
  controllers: [StudentsController],
  providers: [StudentsService],
  exports: [StudentsService],
})
export class StudentsModule {}
