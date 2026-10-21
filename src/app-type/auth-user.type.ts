import { TokenScope } from "./token-scope.type";

export interface AuthUser {
  studentCode: string;
  scope: TokenScope;
  role: number;
}
