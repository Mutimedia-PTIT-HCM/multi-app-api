import { IPushService } from "@app-contracts";
import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { cert, initializeApp } from "firebase-admin/app";
import { getMessaging, Messaging } from "firebase-admin/messaging";
import { existsSync, readFileSync } from "fs";
import { resolve } from "path";

/**
 * Gửi FCM theo topic-condition (giữ nguyên cơ chế legacy:
 * client subscribe topic = mssv / malop / 'all').
 */
@Injectable()
export class PushService implements IPushService {
  private readonly logger = new Logger(PushService.name);
  private readonly messaging?: Messaging;

  constructor(config: ConfigService) {
    const credPath = config.get<string>("FIREBASE_CREDENTIAL_PATH");
    const abs = credPath ? resolve(credPath) : null;
    if (abs && existsSync(abs)) {
      const app = initializeApp({
        credential: cert(JSON.parse(readFileSync(abs, "utf8"))),
      });
      this.messaging = getMessaging(app);
      this.logger.log("FCM: enabled");
    } else {
      this.logger.warn("FCM: disabled (không tìm thấy credential)");
    }
  }

  /** Gửi notification + data tới tập topics (OR condition). */
  async sendToTopics(
    title: string,
    body: string,
    topics: string[],
    data?: Record<string, string>,
  ): Promise<void> {
    if (!this.messaging || topics.length === 0) return;
    const condition = topics.map((t) => `'${t}' in topics`).join(" || ");
    try {
      const res = await this.messaging.send({
        notification: { title, body },
        data: data ?? {},
        condition,
      });
      this.logger.log(`FCM sent: ${res}`);
    } catch (e) {
      this.logger.error("FCM send failed", e instanceof Error ? e.message : e);
    }
  }
}
