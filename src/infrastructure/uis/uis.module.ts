import { UIS_PORT, UIS_SESSION_PORT } from "@app-contracts";
import { Global, Module } from "@nestjs/common";
import { UisService } from "./uis.service";
import { UisSessionService } from "./uis-session.service";

@Global()
@Module({
  providers: [
    { provide: UIS_PORT, useClass: UisService },
    { provide: UIS_SESSION_PORT, useClass: UisSessionService },
  ],
  exports: [UIS_PORT, UIS_SESSION_PORT],
})
export class UisModule {}
