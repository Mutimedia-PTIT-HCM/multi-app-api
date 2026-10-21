import { CryptoModule } from "@app-infra/crypto";
import { PrismaModule } from "@app-infra/prisma";
import { PushModule } from "@app-infra/push";
import { StorageModule } from "@app-infra/storage";
import { UisModule } from "@app-infra/uis";
import { JobsModule } from "@app-jobs";
import { AcademicPointsModule } from "@app-presentation/academic-points";
import { AuthModule } from "@app-presentation/auth";
import { ClassesModule } from "@app-presentation/classes";
import { EventsModule } from "@app-presentation/events";
import { MessagesModule } from "@app-presentation/messages";
import { NotificationsModule } from "@app-presentation/notifications";
import { ProductsModule } from "@app-presentation/products";
import { ScheduleModule } from "@app-presentation/schedule";
import { StudentsModule } from "@app-presentation/students";
import { SystemModule } from "@app-presentation/system";
import { TeachersModule } from "@app-presentation/teachers";
import { TrainingPointsModule } from "@app-presentation/training-points";
import { UploadsModule } from "@app-presentation/uploads";
import { BullModule } from "@nestjs/bullmq";
import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { RootController } from "./root.controller";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    CryptoModule,
    UisModule,
    StorageModule,
    PushModule,
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.get<string>("REDIS_HOST") ?? "localhost",
          port: Number(config.get<string>("REDIS_PORT") ?? 6379),
        },
      }),
    }),
    AuthModule,
    StudentsModule,
    ScheduleModule,
    AcademicPointsModule,
    TrainingPointsModule,
    EventsModule,
    NotificationsModule,
    MessagesModule,
    ProductsModule,
    TeachersModule,
    ClassesModule,
    UploadsModule,
    SystemModule,
    JobsModule,
  ],
  controllers: [RootController],
})
export class AppModule {}
