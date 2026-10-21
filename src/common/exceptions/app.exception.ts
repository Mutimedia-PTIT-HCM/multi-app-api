import { HttpException, HttpStatus } from "@nestjs/common";
import { ErrorEntry } from "../errors/error-entry.type";

/**
 * Exception chuẩn của app: gắn ErrorEntry {code, message} vào response body.
 * `messageOverride` cho phép gắn chi tiết động (vd tên tài nguyên) thay message mặc định.
 */
export class AppException extends HttpException {
  constructor(status: HttpStatus, entry: ErrorEntry, messageOverride?: string) {
    super({ code: entry.code, message: messageOverride ?? entry.message }, status);
  }
}
