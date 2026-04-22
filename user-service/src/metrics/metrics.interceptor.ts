import {
    CallHandler,
    ExecutionContext,
    Injectable,
    NestInterceptor,
  } from '@nestjs/common';
  import { Observable } from 'rxjs';
  import { tap } from 'rxjs/operators';
  import { MetricsService } from './metrics.service';
  
  @Injectable()
  export class HttpMetricsInterceptor implements NestInterceptor {
    constructor(private readonly metricsService: MetricsService) {}
  
    intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
      const http = context.switchToHttp();
      const request = http.getRequest();
      const response = http.getResponse();
  
      const method = request.method;
      const route =
        request.route?.path ||
        request.originalUrl ||
        request.url ||
        'unknown';
  
      const endTimer = this.metricsService.startHttpRequestTimer({
        method,
        route,
      });
  
      return next.handle().pipe(
        tap({
          next: () => {
            endTimer({
              status: String(response.statusCode),
            });
          },
          error: (error) => {
            const status =
              String(error?.status) ||
              String(response?.statusCode) ||
              '500';
  
            endTimer({
              status,
            });
          },
        }),
      );
    }
  }