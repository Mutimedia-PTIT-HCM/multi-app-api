import { PUSH_PORT } from "@app-contracts";
import { Global, Module } from "@nestjs/common";
import { PushService } from "./push.service";

@Global()
@Module({
  providers: [{ provide: PUSH_PORT, useClass: PushService }],
  exports: [PUSH_PORT],
})
export class PushModule {}
