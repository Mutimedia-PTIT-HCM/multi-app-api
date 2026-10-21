import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { map, Observable } from "rxjs";

/** Trả về từ controller khi muốn custom message trong envelope. */
export class ApiResult<T = unknown> {
  constructor(
    public readonly message: string,
    public readonly data: T,
  ) {}
}

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      map((result) => {
        if (result instanceof ApiResult) {
          return { error: false, message: result.message, data: result.data };
        }
        return { error: false, message: "Thành công", data: result ?? null };
      }),
    );
  }
}
