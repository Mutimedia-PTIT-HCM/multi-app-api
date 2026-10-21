import { HttpStatus } from "@nestjs/common";
import { Request } from "express";
import { AUTH_ERRORS } from "../errors/auth.errors";
import { AppException } from "../exceptions/app.exception";

export function extractToken(req: Request): string {
  const header = req.headers.authorization;
  if (!header) throw new AppException(HttpStatus.UNAUTHORIZED, AUTH_ERRORS.MISSING_CREDENTIALS);
  const [type, token] = header.split(" ");
  if (type !== "Bearer" || !token) {
    throw new AppException(HttpStatus.UNAUTHORIZED, AUTH_ERRORS.MISSING_CREDENTIALS);
  }
  return token;
}
