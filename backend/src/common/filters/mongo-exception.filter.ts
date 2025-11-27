import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
// В твоей версии драйвера может быть MongoServerError
type AnyMongoError = { code?: number; message?: string; [k: string]: any };

@Catch()
export class MongoExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(MongoExceptionFilter.name);

  catch(exception: AnyMongoError, host: ArgumentsHost) {
    // пропускаем, если это вообще не Монго-ошибка
    if (exception?.code === undefined) throw exception;

    const ctx = host.switchToHttp();
    const req = ctx.getRequest<Request>();
    const res = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Database error';
    let errors: string[] | undefined;

    if (exception.code === 11000) {
      status = HttpStatus.CONFLICT; // 409
      message = 'Duplicate key error';
      errors = ['Resource with unique field already exists'];
    }

    const requestId =
      (req.headers['x-request-id'] as string) ||
      (req.headers['x-correlation-id'] as string);
    this.logger.error(
      JSON.stringify({
        status,
        message,
        code: exception.code,
        method: req.method,
        path: req.originalUrl,
        requestId,
      }),
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
