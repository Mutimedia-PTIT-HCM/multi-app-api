import {
  AppException,
  CIPHER_ALGORITHM,
  CIPHER_BINARY_ENCODING,
  CIPHER_IV_LEN,
  CIPHER_KEY_HEX_LEN,
  CIPHER_SEPARATOR,
  CIPHER_TAG_LEN,
  CIPHER_TEXT_ENCODING,
  SYS_ERRORS,
} from "@app-common";
import { ICredentialCipher } from "@app-contracts";
import { HttpStatus, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

/**
 * Mã hoá UIS tokens (access/refresh) lưu trong DB (AES-256-GCM).
 * Không thể hash 1 chiều vì cần giải mã để gọi UIS.
 * Format lưu: base64(iv).base64(tag).base64(ciphertext)
 */
@Injectable()
export class CredentialCipherService implements ICredentialCipher {
  private readonly key: Buffer;

  constructor(config: ConfigService) {
    const hex = config.get<string>("CREDENTIAL_KEY");
    const valid = new RegExp(`^[0-9a-f]{${CIPHER_KEY_HEX_LEN}}$`, "i").test(hex ?? "");
    if (!valid) {
      // Fail fast lúc boot — không cho app chạy với key sai format/yếu
      throw new AppException(
        HttpStatus.INTERNAL_SERVER_ERROR,
        SYS_ERRORS.CONFIG_MISSING,
        "CREDENTIAL_KEY must be a 64-char hex string (openssl rand -hex 32)",
      );
    }
    this.key = Buffer.from(hex as string, "hex");
  }

  encrypt(plain: string): string {
    const iv = randomBytes(CIPHER_IV_LEN);
    const cipher = createCipheriv(CIPHER_ALGORITHM, this.key, iv);
    const encrypted = Buffer.concat([cipher.update(plain, CIPHER_TEXT_ENCODING), cipher.final()]);
    return [iv, cipher.getAuthTag(), encrypted]
      .map((b) => b.toString(CIPHER_BINARY_ENCODING))
      .join(CIPHER_SEPARATOR);
  }

  decrypt(payload: string): string {
    const parts = payload.split(CIPHER_SEPARATOR).map((s) => Buffer.from(s, CIPHER_BINARY_ENCODING));
    const [iv, tag, data] = parts;
    if (parts.length !== 3 || iv.length !== CIPHER_IV_LEN || tag.length !== CIPHER_TAG_LEN) {
      throw new AppException(
        HttpStatus.INTERNAL_SERVER_ERROR,
        SYS_ERRORS.INTERNAL_ERROR,
        "Malformed credential payload",
      );
    }
    const decipher = createDecipheriv(CIPHER_ALGORITHM, this.key, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(data), decipher.final()]).toString(CIPHER_TEXT_ENCODING);
  }
}
