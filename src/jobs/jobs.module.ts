import { CLASS_SYNC_QUEUE, POINT_CRAWL_QUEUE, TOKEN_REFRESH_QUEUE } from "@app-common";
import { SEMESTER_SYNC_PORT } from "@app-contracts";
import { SystemModule } from "@app-presentation/system";
import { BullModule } from "@nestjs/bullmq";
import { Module } from "@nestjs/common";
import { ScheduleModule } from "@nestjs/schedule";
import { ClassSyncProcessor } from "./class-sync";
import { PointCrawlProcessor } from "./point-crawl";
import { SemesterSyncService } from "./semester-sync";
import { TokenRefreshProcessor } from "./token-refresh";

@Module({
  imports: [
    ScheduleModule.forRoot(),
    SystemModule,
    BullModule.registerQueue(
      { name: POINT_CRAWL_QUEUE },
      { name: CLASS_SYNC_QUEUE },
      { name: TOKEN_REFRESH_QUEUE },
    ),
  ],
  providers: [
    { provide: SEMESTER_SYNC_PORT, useClass: SemesterSyncService },
    PointCrawlProcessor,
    ClassSyncProcessor,
    TokenRefreshProcessor,
  ],
})
export class JobsModule {}
