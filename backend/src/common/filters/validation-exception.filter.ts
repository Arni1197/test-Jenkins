import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  BadRequestException,
} from '@nestjs/common';
import { Response } from 'express';

@Catch(BadRequestException)
export class ValidationExceptionFilter implements ExceptionFilter {
  catch(exception: BadRequestException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const res = exception.getResponse();
    const validationErrors =
      typeof res === 'object' && (res as any).message
        ? (res as any).message
        : 'Validation failed';

    response.status(400).json({
      success: false,
      statusCode: 400,
      message: 'Validation failed',
      errors: Array.isArray(validationErrors)
        ? validationErrors
        : [String(validationErrors)],
      timestamp: new Date().toISOString(),
    });
  }
}
