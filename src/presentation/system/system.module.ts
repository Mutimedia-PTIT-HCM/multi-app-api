import { SystemService } from "@app-application/system";
import { SYSTEM_PORT } from "@app-contracts";
import { Module } from "@nestjs/common";
import { SystemController } from "./system.controller";

@Module({
  controllers: [SystemController],
  providers: [{ provide: SYSTEM_PORT, useClass: SystemService }],
  exports: [SYSTEM_PORT],
})
export class SystemModule {}
