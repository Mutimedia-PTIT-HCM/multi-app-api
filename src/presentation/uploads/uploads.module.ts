import { UploadsService } from "@app-application/uploads";
import { UPLOADS_PORT } from "@app-contracts";
import { Module } from "@nestjs/common";
import { UploadsController } from "./uploads.controller";

@Module({
  controllers: [UploadsController],
  providers: [{ provide: UPLOADS_PORT, useClass: UploadsService }],
})
export class UploadsModule {}
