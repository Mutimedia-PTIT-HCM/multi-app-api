import { CLASS_SYNC_QUEUE } from "@app-application/classes";
import { SystemModule } from "@app-presentation/system";
import { BullModule } from "@nestjs/bullmq";
import { Module } from "@nestjs/common";
import { ScheduleModule } from "@nestjs/schedule";
import { ClassSyncProcessor } from "./class-sync.processor";
import { PointCrawlProcessor } from "./point-crawl.processor";
import { POINT_CRAWL_QUEUE } from "./point-crawl.queue";
import { SemesterSyncService } from "./semester-sync.service";
import { TokenRefreshProcessor } from "./token-refresh.processor";
import { TOKEN_REFRESH_QUEUE } from "./token-refresh.queue";

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
