import type { Buffer } from "buffer";

/** Port object storage (S3/MinIO/R2/local). */
export interface IStorageService {
  generateKey(prefix: string, originalName: string): string;
  upload(key: string, body: Buffer, contentType?: string): Promise<void>;
  delete(key: string): Promise<void>;
  isS3(): boolean;
  presign(key: string, contentType: string, expiresInSec?: number): Promise<string | null>;
  url(key: string | null | undefined): string | null;
  urls(spaceSeparatedKeys: string | null | undefined): string[];
}
