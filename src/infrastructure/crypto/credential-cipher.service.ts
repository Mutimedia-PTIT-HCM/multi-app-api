import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

/**
 * Mã hoá UIS tokens (access/refresh) lưu trong DB (AES-256-GCM).
 * Không thể hash 1 chiều vì cần giải mã để gọi UIS.
 * Format lưu: base64(iv).base64(tag).base64(ciphertext)
 */
@Injectable()
export class CredentialCipherService {
  private readonly key: Buffer;

  constructor(config: ConfigService) {
    const hex = config.get<string>("CREDENTIAL_KEY") ?? "";
    this.key = Buffer.from(hex.padEnd(64, "0").slice(0, 64), "hex");
  }

  encrypt(plain: string): string {
    const iv = randomBytes(12);
    const cipher = createCipheriv("aes-256-gcm", this.key, iv);
    const encrypted = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
    const tag = cipher.getAuthTag();
    return `${iv.toString("base64")}.${tag.toString("base64")}.${encrypted.toString("base64")}`;
  }

  decrypt(payload: string): string {
    const [iv, tag, data] = payload.split(".").map((s) => Buffer.from(s, "base64"));
    const decipher = createDecipheriv("aes-256-gcm", this.key, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
  }
}
