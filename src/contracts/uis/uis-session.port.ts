import type { UisSession, UisTokens } from "@app-type";

/** Port quản lý phiên UIS của SV (reuse/refresh/persist token). */
export interface IUisSessionService {
  getSession(studentCode: string): Promise<UisSession>;
  forceRenew(studentCode: string): Promise<boolean>;
  persistTokens(studentCode: string, tokens: UisTokens): Promise<void>;
}
