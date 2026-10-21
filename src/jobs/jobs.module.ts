import { CLASS_SYNC_QUEUE } from "@app-application/classes";
import { SystemModule } from "@app-presentation/system";
import { BullModule } from "@nestjs/bullmq";
import { Module } from "@nestjs/common";
import { ScheduleModule } from "@nestjs/schedule";
import { ClassSyncProcessor } from "./class-sync.processor";
import { POINT_CRAWL_QUEUE, PointCrawlProcessor } from "./point-crawl.processor";
import { SemesterSyncService } from "./semester-sync.service";
import { TOKEN_REFRESH_QUEUE, TokenRefreshProcessor } from "./token-refresh.processor";

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
  providers: [PointCrawlProcessor, ClassSyncProcessor, SemesterSyncService, TokenRefreshProcessor],
})
export class JobsModule {}
