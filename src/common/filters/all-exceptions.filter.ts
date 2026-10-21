import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from "@nestjs/common";
import { Response } from "express";
import { SYS_ERRORS } from "../errors/system.errors";

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = SYS_ERRORS.INTERNAL_ERROR.code;
    let message = SYS_ERRORS.INTERNAL_ERROR.message;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      code = `HTTP_${status}`;
      const body = exception.getResponse();
      if (typeof body === "string") {
        message = body;
      } else if (body && typeof body === "object") {
        const b = body as Record<string, unknown>;
        if (typeof b.code === "string") code = b.code;
        const msg = b.message;
        message = Array.isArray(msg) ? msg.join(". ") : String(msg ?? exception.message);
      } else {
        message = exception.message;
      }
    } else {
      this.logger.error(
        "Unhandled exception",
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    res.status(status).json({ error: true, code, message, data: null });
  }
}
