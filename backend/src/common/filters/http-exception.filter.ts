import { ExceptionFilter, Catch, ArgumentsHost, HttpException } from '@nestjs/common';
import { Request, Response } from 'express';
import { Logger } from '@nestjs/common';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const req = ctx.getRequest<Request>();
    const res = ctx.getResponse<Response>();

    const status = exception.getStatus();
    const body = exception.getResponse();

    let message = 'Error occurred';
    let errors: string[] | undefined;

    if (typeof body === 'string') {
      message = body;
    } else if (body && typeof body === 'object') {
      const m = (body as any).message;
      if (Array.isArray(m)) {
        message = 'Validation failed';
        errors = m.map(String);
      } else if (typeof m === 'string') {
        message = m;
      } else {
        message = (body as any).error || exception.message || 'Error occurred';
      }
    } else {
      message = exception.message || 'Error occurred';
    }

    // лог (с requestId, если есть)
    const requestId = (req.headers['x-request-id'] as string) || (req.headers['x-correlation-id'] as string);
    this.logger.error(
      JSON.stringify({ status, message, method: req.method, path: req.originalUrl, requestId }),
      exception instanceof Error ? exception.stack : undefined,
    );

    res.status(status).json({
      success: false,
      statusCode: status,
      message,
      errors,
      timestamp: new Date().toISOString(),
      path: req.originalUrl,
      requestId,
    });
  }
}