import { UploadsService } from "@app-application/uploads";
import { StorageModule } from "@app-infra/storage";
import { Module } from "@nestjs/common";
import { UploadsController } from "./uploads.controller";

@Module({
  imports: [StorageModule],
  controllers: [UploadsController],
  providers: [UploadsService],
})
export class UploadsModule {}
