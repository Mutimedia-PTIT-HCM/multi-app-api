import { JwtClaims } from "@app-type";
import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { Socket } from "socket.io";

export const WsCurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): { studentCode: string } => {
    const client = ctx.switchToWs().getClient<Socket & { user?: JwtClaims }>();
    return { studentCode: client.user?.sub ?? "" };
  },
);
