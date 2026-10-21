import { SystemService } from "@app-application/system";
import { Module } from "@nestjs/common";
import { SystemController } from "./system.controller";

@Module({
  controllers: [SystemController],
  providers: [SystemService],
  exports: [SystemService],
})
export class SystemModule {}
