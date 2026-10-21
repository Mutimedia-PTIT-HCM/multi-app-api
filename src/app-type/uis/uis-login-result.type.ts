import { UisSession } from "./uis-session.type";
import { UisTokens } from "./uis-tokens.type";

/** Kết quả login UIS */
export type UisLoginResult =
  | { status: "ok"; session: UisSession; tokens: UisTokens }
  | { status: "invalid" } // sai tài khoản
  | { status: "unsupported" } // MSSV không thuộc ngành hỗ trợ
  | { status: "unreachable" }; // UIS timeout/lỗi mạng
