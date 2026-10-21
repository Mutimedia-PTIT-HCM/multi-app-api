import "reflect-metadata";
import { AllExceptionsFilter, AppException, ResponseInterceptor, SYS_ERRORS } from "@app-common";
import { HttpStatus, ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { json, raw, static as serveStatic, urlencoded } from "express";
import { existsSync, mkdirSync } from "fs";
import { join } from "path";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.setGlobalPrefix("api/v1", { exclude: ["/"] });
  // Raw binary cho PUT /uploads/local/:token (fallback upload khi không có R2)
  app.use("/api/v1/uploads/local", raw({ type: "*/*", limit: "20mb" }));
  app.use(json({ limit: "10mb" }));
  app.use(urlencoded({ extended: true }));
  app.enableCors({ origin: process.env.CORS_ORIGIN?.split(",") ?? true });

  // Local storage fallback khi chưa cấu hình R2
  const uploadsDir = process.env.LOCAL_UPLOAD_DIR ?? join(process.cwd(), "uploads");
  if (!existsSync(uploadsDir)) mkdirSync(uploadsDir, { recursive: true });
  app.use("/uploads", serveStatic(uploadsDir));

  // Giữ contract legacy: /app-ads.txt serve từ public/ads
  const adsDir = join(process.cwd(), "public", "ads");
  if (existsSync(adsDir)) app.use("/app-ads.txt", serveStatic(adsDir, { index: "app-ads.txt" }));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      exceptionFactory: () => new AppException(HttpStatus.BAD_REQUEST, SYS_ERRORS.VALIDATION_FAILED),
    }),
  );
  app.useGlobalInterceptors(new ResponseInterceptor());
  app.useGlobalFilters(new AllExceptionsFilter());

  const swaggerConfig = new DocumentBuilder()
    .setTitle("Multi-app API v2")
    .setVersion("2.0")
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup("api/docs", app, document);

  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port);
  console.log(`Listening on port: ${port}`);
}

bootstrap();
