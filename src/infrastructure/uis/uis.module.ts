import { Global, Module } from "@nestjs/common";
import { UisService } from "./uis.service";
import { UisSessionService } from "./uis-session.service";

@Global()
@Module({
  providers: [UisService, UisSessionService],
  exports: [UisService, UisSessionService],
})
export class UisModule {}
