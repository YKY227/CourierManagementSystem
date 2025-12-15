import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { Request, Response } from "express";

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const req = ctx.getRequest<Request>();
    const res = ctx.getResponse<Response>();

    const requestId =
      (req.headers["x-request-id"] as string) || (res.getHeader("x-request-id") as string) || null;

    const isHttp = exception instanceof HttpException;
    const status = isHttp ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    const message = isHttp
      ? (exception.getResponse() as any)?.message ?? exception.message
      : (exception as any)?.message ?? "Internal server error";

    res.status(status).json({
      ok: false,
      requestId,
      statusCode: status,
      path: req.originalUrl,
      method: req.method,
      message,
      timestamp: new Date().toISOString(),
    });
  }
}
