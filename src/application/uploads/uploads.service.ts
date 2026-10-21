import { AppException, UPLOAD_ERRORS } from "@app-common";
import { StorageService } from "@app-infra/storage";
import { PresignedUpload, UploadPurpose } from "@app-type";
import { HttpStatus, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";

const PURPOSE_PREFIX: Record<UploadPurpose, string> = {
  avatar: "avt",
  product: "products",
  notification: "notification",
  event: "event/thumb",
  cert: "cert",
  misc: "misc",
};

/** Scope claim phân biệt token upload với token auth. */
const UPLOAD_SCOPE = "upload";

@Injectable()
export class UploadsService {
  private readonly apiBaseUrl: string;

  constructor(
    private readonly storage: StorageService,
    private readonly jwt: JwtService,
    config: ConfigService,
  ) {
    this.apiBaseUrl = (config.get<string>("BASE_URL") ?? "").replace(/\/$/, "");
  }

  /**
   * Cấp quyền upload: trả presigned URL (R2) hoặc URL local kèm token ký JWT.
   * Client PUT binary lên uploadUrl rồi dùng `key` trong API nghiệp vụ.
   */
  async requestUpload(
    purpose: UploadPurpose,
    fileName: string,
    contentType: string,
  ): Promise<PresignedUpload> {
    const key = this.storage.generateKey(PURPOSE_PREFIX[purpose], fileName);
    const publicUrl = this.storage.url(key) ?? key;

    const presigned = await this.storage.presign(key, contentType);
    if (presigned) {
      return { key, uploadUrl: presigned, method: "PUT", contentType, publicUrl };
    }

    // Local mode: ký token ngắn hạn chứa key, client PUT lên endpoint nội bộ.
    const token = await this.jwt.signAsync({ key, purpose, scope: UPLOAD_SCOPE }, { expiresIn: "15m" });
    return {
      key,
      uploadUrl: `${this.apiBaseUrl}/api/v1/uploads/local/${token}`,
      method: "PUT",
      contentType,
      publicUrl,
    };
  }

  /** Endpoint local-only: nhận binary body theo token đã ký và ghi vào storage. */
  async receiveLocalUpload(token: string, body: Buffer | undefined): Promise<{ key: string }> {
    if (this.storage.isS3()) {
      throw new AppException(HttpStatus.NOT_FOUND, UPLOAD_ERRORS.STORAGE_NOT_CONFIGURED);
    }
    let key: string;
    try {
      const payload = await this.jwt.verifyAsync<{ key: string; scope?: string }>(token);
      if (payload.scope !== UPLOAD_SCOPE) throw new Error("bad scope");
      key = payload.key;
    } catch {
      throw new AppException(HttpStatus.UNAUTHORIZED, UPLOAD_ERRORS.INVALID_TOKEN);
    }
    if (!body || body.length === 0) {
      throw new AppException(HttpStatus.BAD_REQUEST, UPLOAD_ERRORS.EMPTY_BODY);
    }
    await this.storage.upload(key, body);
    return { key };
  }
}
