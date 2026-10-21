import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createHash } from "crypto";
import { mkdirSync, unlinkSync, writeFileSync } from "fs";
import { extname, join } from "path";

/**
 * Lưu file lên S3-compatible storage (MinIO dev / Cloudflare R2 / AWS S3)
 * qua biến S3_*. Để trống → fallback ghi local ./uploads.
 *
 * S3_ENDPOINT là endpoint server gọi trực tiếp; S3_PRESIGN_ENDPOINT là
 * endpoint public client dùng cho presigned URL — host nằm trong chữ ký
 * SigV4 nên không thể đổi host sau khi ký (vd MinIO trong docker:
 * server gọi minio:9000 nhưng client presign phải là localhost:9000).
 * Cloudflare R2: S3_ENDPOINT=https://<account>.r2.cloudflarestorage.com, S3_REGION=auto.
 */
@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly s3?: S3Client;
  private readonly s3Presign?: S3Client;
  private readonly bucket?: string;
  private readonly publicUrl?: string;
  private readonly localDir: string;
  private readonly localBaseUrl: string;

  constructor(config: ConfigService) {
    this.localDir = config.get<string>("LOCAL_UPLOAD_DIR") ?? join(process.cwd(), "uploads");
    this.localBaseUrl = (config.get<string>("BASE_URL") ?? "").replace(/\/$/, "");

    const endpoint = config.get<string>("S3_ENDPOINT");
    const accessKeyId = config.get<string>("S3_ACCESS_KEY_ID");
    const secretAccessKey = config.get<string>("S3_SECRET_ACCESS_KEY");
    this.bucket = config.get<string>("S3_BUCKET");
    this.publicUrl = config.get<string>("S3_PUBLIC_URL")?.replace(/\/$/, "");

    if (endpoint && accessKeyId && secretAccessKey && this.bucket) {
      const credentials = { accessKeyId, secretAccessKey };
      const region = config.get<string>("S3_REGION") ?? "us-east-1";
      // Path-style: endpoint/bucket/key — hoạt động cả MinIO lẫn R2
      this.s3 = new S3Client({ region, endpoint, credentials, forcePathStyle: true });
      const presignEndpoint = config.get<string>("S3_PRESIGN_ENDPOINT") ?? endpoint;
      this.s3Presign =
        presignEndpoint === endpoint
          ? this.s3
          : new S3Client({ region, endpoint: presignEndpoint, credentials, forcePathStyle: true });
      this.logger.log(`Storage: S3 ${endpoint} (presign: ${presignEndpoint})`);
    } else {
      this.logger.warn("Storage: local ./uploads (chưa cấu hình S3_*)");
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

  /** Đang dùng S3 storage (R2/MinIO) hay local filesystem. */
  isS3(): boolean {
    return this.s3 != null;
  }

  /**
   * Presigned PUT URL cho upload trực tiếp lên storage (R2/MinIO).
   * Dùng client trỏ endpoint public — host nằm trong chữ ký SigV4.
   * Trả null khi chạy local — dùng endpoint /uploads/local thay thế.
   */
  async presign(key: string, contentType: string, expiresInSec = 900): Promise<string | null> {
    if (!this.s3Presign || !this.bucket) return null;
    return getSignedUrl(
      this.s3Presign,
      new PutObjectCommand({ Bucket: this.bucket, Key: key, ContentType: contentType }),
      { expiresIn: expiresInSec },
    );
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
