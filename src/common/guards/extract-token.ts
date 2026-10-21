import { UnauthorizedException } from "@nestjs/common";
import { Request } from "express";

export function extractToken(req: Request): string {
  const header = req.headers.authorization;
  if (!header) throw new UnauthorizedException("Thiếu thông tin xác thực");
  const [type, token] = header.split(" ");
  if (type !== "Bearer" || !token) throw new UnauthorizedException("Thiếu thông tin xác thực");
  return token;
}
