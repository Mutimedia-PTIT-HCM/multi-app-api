import { TokenScope } from "../auth/token-scope.type";

export interface JwtClaims {
  sub: string; // studentCode
  scope: TokenScope;
  role: number;
}
