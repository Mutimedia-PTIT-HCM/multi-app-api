import { AuthUser, JwtClaims, TokenScope } from "@app-type";
import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Request } from "express";

function extractToken(req: Request): string {
  const header = req.headers.authorization;
  if (!header) throw new UnauthorizedException("Thiếu thông tin xác thực");
  const [type, token] = header.split(" ");
  if (type !== "Bearer" || !token) throw new UnauthorizedException("Thiếu thông tin xác thực");
  return token;
}

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
        throw new UnauthorizedException("Phiên đăng nhập không hợp lệ hoặc đã hết hạn");
      }
      if (claims.scope !== requiredScope || !claims.sub) {
        throw new UnauthorizedException("Phiên đăng nhập không hợp lệ hoặc đã hết hạn");
      }
      req.user = { studentCode: claims.sub, scope: claims.scope, role: claims.role };
      return true;
    }
  }
  return AuthGuard;
}

@Injectable()
export class StudentAuthGuard extends createAuthGuard("student") {}

@Injectable()
export class ChiefAuthGuard extends createAuthGuard("chief") {}
