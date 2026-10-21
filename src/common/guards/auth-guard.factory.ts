import { AuthUser, JwtClaims, TokenScope } from "@app-type";
import { CanActivate, ExecutionContext, HttpStatus, Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Request } from "express";
import { AUTH_ERRORS } from "../errors/auth.errors";
import { AppException } from "../exceptions/app.exception";
import { extractToken } from "./extract-token";

export function createAuthGuard(requiredScope: TokenScope) {
  @Injectable()
  class AuthGuard implements CanActivate {
    constructor(private readonly jwt: JwtService) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
      const req = context.switchToHttp().getRequest<Request & { user: AuthUser }>();
      const token = extractToken(req);
      let claims: JwtClaims;
      try {
        claims = await this.jwt.verifyAsync<JwtClaims>(token);
      } catch {
        throw new AppException(HttpStatus.UNAUTHORIZED, AUTH_ERRORS.INVALID_SESSION);
      }
      if (claims.scope !== requiredScope || !claims.sub) {
        throw new AppException(HttpStatus.UNAUTHORIZED, AUTH_ERRORS.INVALID_SESSION);
      }
      req.user = { studentCode: claims.sub, scope: claims.scope, role: claims.role };
      return true;
    }
  }
  return AuthGuard;
}
