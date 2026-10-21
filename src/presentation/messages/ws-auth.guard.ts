import { JwtClaims } from "@app-type";
import { CanActivate, createParamDecorator, ExecutionContext, Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { WsException } from "@nestjs/websockets";
import { Socket } from "socket.io";

/**
 * Guard socket: client gửi token qua `handshake.auth.token` (Bearer không bắt buộc).
 * Giữ tương thích: nếu không verify được → reject kết nối.
 */
@Injectable()
export class WsAuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client = context.switchToWs().getClient<Socket & { user?: JwtClaims }>();
    const token =
      (client.handshake.auth?.token as string | undefined)?.replace(/^Bearer /, "") ??
      client.handshake.headers.authorization?.replace(/^Bearer /, "");
    if (!token) throw new WsException("Unauthorized");
    try {
      client.user = await this.jwt.verifyAsync<JwtClaims>(token);
      return true;
    } catch {
      throw new WsException("Unauthorized");
    }
  }
}

export const WsCurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): { studentCode: string } => {
    const client = ctx.switchToWs().getClient<Socket & { user?: JwtClaims }>();
    return { studentCode: client.user?.sub ?? "" };
  },
);
