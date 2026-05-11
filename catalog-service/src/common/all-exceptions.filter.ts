import {
    ArgumentsHost,
    Catch,
    ExceptionFilter,
    HttpException,
    Logger,
  } from '@nestjs/common';
  import { Request, Response } from 'express';
  
  type RequestWithContext = Request & {
    requestId?: string;
    kongRequestId?: string;
    userId?: string;
  };
  
  @Catch()
  export class AllExceptionsFilter implements ExceptionFilter {
    private readonly logger = new Logger(AllExceptionsFilter.name);
  
    catch(exception: unknown, host: ArgumentsHost) {
      const ctx = host.switchToHttp();
      const req = ctx.getRequest<RequestWithContext>();
      const res = ctx.getResponse<Response>();
  
      const statusCode =
        exception instanceof HttpException ? exception.getStatus() : 500;
  
      const error = exception instanceof Error ? exception.name : 'UnknownError';
      const message =
        exception instanceof Error ? exception.message : String(exception);
      const stack = exception instanceof Error ? exception.stack : undefined;
  
      this.logger.error(
        JSON.stringify({
          type: 'request_failed',
          service: 'catalog-service',
          env: process.env.NODE_ENV ?? 'local',
  
          requestId: req.requestId ?? req.headers['x-request-id'],
          kongRequestId: req.kongRequestId ?? req.headers['x-kong-request-id'],
          userId: req.userId ?? req.headers['x-user-id'],
  
          method: req.method,
          url: req.originalUrl,
          statusCode,
  
          error,
          message,
          stack,
        }),
      );
  
      res.status(statusCode).json({
        statusCode,
        message,
      });
    }
  }