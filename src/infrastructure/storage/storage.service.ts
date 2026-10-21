import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createHash } from "crypto";
import { mkdirSync, unlinkSync, writeFileSync } from "fs";
import { extname, join } from "path";

/**
 * Lưu file lên Cloudflare R2 (S3-compatible).
 * Nếu chưa cấu hình R2_* → fallback ghi local ./uploads (chạy thử dev).
 */
@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly s3?: S3Client;
  private readonly bucket?: string;
  private readonly publicUrl?: string;
  private readonly localDir: string;
  private readonly localBaseUrl: string;

  constructor(config: ConfigService) {
    const accountId = config.get<string>("R2_ACCOUNT_ID");
    const accessKeyId = config.get<string>("R2_ACCESS_KEY_ID");
    const secretAccessKey = config.get<string>("R2_SECRET_ACCESS_KEY");
    this.bucket = config.get<string>("R2_BUCKET");
    this.publicUrl = config.get<string>("R2_PUBLIC_URL")?.replace(/\/$/, "");
    this.localDir = config.get<string>("LOCAL_UPLOAD_DIR") ?? join(process.cwd(), "uploads");
    this.localBaseUrl = (config.get<string>("BASE_URL") ?? "").replace(/\/$/, "");

    if (accountId && accessKeyId && secretAccessKey && this.bucket) {
      this.s3 = new S3Client({
        region: "auto",
        endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
        credentials: { accessKeyId, secretAccessKey },
      });
      this.logger.log("Storage: Cloudflare R2");
    } else {
      this.logger.warn("Storage: local ./uploads (chưa cấu hình R2_*)");
    }
  }

  /** Sinh key an toàn — không dùng tên file gốc (tránh path traversal). */
  generateKey(prefix: string, originalName: string): string {
    const ext =
      extname(originalName)
        .toLowerCase()
        .replace(/[^a-z0-9.]/g, "")
        .slice(0, 10) || ".bin";
    const rand = createHash("sha256").update(`${Date.now()}-${Math.random()}`).digest("hex").slice(0, 16);
    const safePrefix = prefix.replace(/[^a-zA-Z0-9/_-]/g, "");
    return `${safePrefix}/${rand}${ext}`;
  }

  async upload(key: string, body: Buffer, contentType?: string): Promise<void> {
    if (this.s3 && this.bucket) {
      await this.s3.send(
        new PutObjectCommand({ Bucket: this.bucket, Key: key, Body: body, ContentType: contentType }),
      );
      return;
    }
    const filePath = join(this.localDir, key);
    mkdirSync(join(filePath, ".."), { recursive: true });
    writeFileSync(filePath, body);
  }

  async delete(key: string): Promise<void> {
    if (this.s3 && this.bucket) {
      const { DeleteObjectCommand } = await import("@aws-sdk/client-s3");
      await this.s3.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
      return;
    }
    try {
      unlinkSync(join(this.localDir, key));
    } catch {
      // file không tồn tại — bỏ qua
    }
  }

  /** URL public của object theo key. */
  url(key: string | null | undefined): string | null {
    if (!key) return null;
    if (this.publicUrl) return `${this.publicUrl}/${key}`;
    return `${this.localBaseUrl}/uploads/${key}`;
  }

  /** Map chuỗi keys space-separated (legacy format) → mảng URL. */
  urls(spaceSeparatedKeys: string | null | undefined): string[] {
    if (!spaceSeparatedKeys) return [];
    return spaceSeparatedKeys
      .split(" ")
      .filter(Boolean)
      .map((k) => this.url(k))
      .filter((u): u is string => u != null);
  }
}
