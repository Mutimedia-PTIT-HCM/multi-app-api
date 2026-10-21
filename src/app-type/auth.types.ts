export type TokenScope = "student" | "chief";

export interface JwtClaims {
  sub: string; // studentCode
  scope: TokenScope;
  role: number;
}

export interface AuthUser {
  studentCode: string;
  scope: TokenScope;
  role: number;
}
