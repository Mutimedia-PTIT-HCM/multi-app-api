import { StudentsService } from "@app-application/students";
import { STUDENTS_PORT } from "@app-contracts";
import { AuthModule } from "@app-presentation/auth";
import { Module } from "@nestjs/common";
import { StudentsController } from "./students.controller";

@Module({
  imports: [AuthModule],
  controllers: [StudentsController],
  providers: [{ provide: STUDENTS_PORT, useClass: StudentsService }],
  exports: [STUDENTS_PORT],
})
export class StudentsModule {}
