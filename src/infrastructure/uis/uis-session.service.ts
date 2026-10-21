import { AppException, UIS_ERRORS, UisUnreachableError } from "@app-common";
import { CredentialCipherService } from "@app-infra/crypto";
import { PrismaService } from "@app-infra/prisma";
import { RefreshTokenRow, UisSession, UisTokenRow, UisTokens } from "@app-type";
import { HttpStatus, Injectable } from "@nestjs/common";
import { UisService } from "./uis.service";
/**
 * Cấp UIS session (access token) cho 1 sinh viên:
 *  1. Access token còn hạn trong DB → dùng lại.
 *  2. Hết hạn → refresh_token grant (rotate + lưu token mới ngay).
 *  3. Refresh token chết/mất → user phải đăng nhập lại app (KHÔNG lưu password).
 *
 * Race guard: mỗi mssv chỉ 1 luồng refresh tại 1 thời điểm — refresh token là
 * single-use (rotate), nếu 2 request refresh cùng lúc sẽ làm mất session.
 */
@Injectable()
export class UisSessionService {
  /** Lock in-process: dedupe concurrent refresh cho cùng 1 mssv. */
  private readonly inflight = new Map<string, Promise<UisSession>>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly uis: UisService,
    private readonly cipher: CredentialCipherService,
  ) {}

  async getSession(studentCode: string): Promise<UisSession> {
    const student: UisTokenRow | null = await this.prisma.student.findUnique({
      where: { studentCode },
      select: {
        uisAccessToken: true,
        uisRefreshToken: true,
        uisTokenExpiresAt: true,
      },
    });
    if (!student) throw new AppException(HttpStatus.UNAUTHORIZED, UIS_ERRORS.SESSION_EXPIRED);

    // 1. Access token còn hạn (>5 phút) → dùng luôn
    if (
      student.uisAccessToken &&
      student.uisTokenExpiresAt &&
      student.uisTokenExpiresAt.getTime() > Date.now() + 5 * 60_000
    ) {
      return { accessToken: this.cipher.decrypt(student.uisAccessToken) };
    }

    // 2. Refresh — dedupe theo mssv
    let p = this.inflight.get(studentCode);
    if (!p) {
      p = this.acquireSession(studentCode, student.uisRefreshToken).finally(() =>
        this.inflight.delete(studentCode),
      );
      this.inflight.set(studentCode, p);
    }
    return p;
  }

  private async acquireSession(studentCode: string, refreshToken: string | null): Promise<UisSession> {
    if (!refreshToken) {
      throw new AppException(HttpStatus.UNAUTHORIZED, UIS_ERRORS.SESSION_EXPIRED);
    }
    const tokens = await this.uis.refresh(studentCode, this.cipher.decrypt(refreshToken));
    if (tokens === "unreachable") throw new UisUnreachableError("UIS unreachable");
    if (!tokens) {
      // Refresh token chết (đổi password, revoke…) → xoá để khỏi retry vô ích
      await this.prisma.student.update({
        where: { studentCode },
        data: { uisRefreshToken: null, uisAccessToken: null, uisTokenExpiresAt: null },
      });
      throw new AppException(HttpStatus.UNAUTHORIZED, UIS_ERRORS.SESSION_EXPIRED);
    }
    await this.persistTokens(studentCode, tokens);
    return { accessToken: tokens.accessToken };
  }

  /** Cron dùng: ép renew token, bỏ qua cache access token. */
  async forceRenew(studentCode: string): Promise<boolean> {
    const student: RefreshTokenRow | null = await this.prisma.student.findUnique({
      where: { studentCode },
      select: { uisRefreshToken: true },
    });
    if (!student?.uisRefreshToken) return false;
    let p = this.inflight.get(studentCode);
    if (!p) {
      p = this.acquireSession(studentCode, student.uisRefreshToken).finally(() =>
        this.inflight.delete(studentCode),
      );
      this.inflight.set(studentCode, p);
    }
    try {
      await p;
      return true;
    } catch {
      return false;
    }
  }

  /** Lưu token mới ngay lập tức — refresh_token là single-use, mất là mất session. */
  async persistTokens(studentCode: string, tokens: UisTokens): Promise<void> {
    await this.prisma.student.update({
      where: { studentCode },
      data: {
        uisAccessToken: this.cipher.encrypt(tokens.accessToken),
        uisRefreshToken: this.cipher.encrypt(tokens.refreshToken),
        uisTokenExpiresAt: tokens.expiresAt,
      },
    });
  }
}
