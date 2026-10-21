import { STORAGE_PORT } from "@app-contracts";
import { Global, Module } from "@nestjs/common";
import { StorageService } from "./storage.service";

@Global()
@Module({
  providers: [{ provide: STORAGE_PORT, useClass: StorageService }],
  exports: [STORAGE_PORT],
})
export class StorageModule {}
