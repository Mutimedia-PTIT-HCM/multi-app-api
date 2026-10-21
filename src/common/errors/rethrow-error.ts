import { HttpException, HttpStatus } from "@nestjs/common";
import { AppException } from "../exceptions/app.exception";
import { SYS_ERRORS } from "./system.errors";
import { UIS_ERRORS } from "./uis.errors";
import { UisUnreachableError } from "./uis-unreachable.error";

/**
 * Boundary handler ở controller: chuyển mọi lỗi không phải HttpException
 * (UisUnreachableError, Prisma error, Error thường) thành AppException có code chuẩn.
 */
export function rethrowError(e: unknown): never {
  if (e instanceof HttpException) throw e;
  if (e instanceof UisUnreachableError) {
    throw new AppException(HttpStatus.SERVICE_UNAVAILABLE, UIS_ERRORS.UNREACHABLE);
  }
  throw new AppException(HttpStatus.INTERNAL_SERVER_ERROR, SYS_ERRORS.INTERNAL_ERROR);
}
