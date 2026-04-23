import {
    CallHandler,
    ExecutionContext,
    Injectable,
    NestInterceptor,
  } from '@nestjs/common';
  import { Observable } from 'rxjs';
  import { catchError, tap } from 'rxjs/operators';
  import { MetricsService } from './metrics.service';
  
  @Injectable()
  export class HttpMetricsInterceptor implements NestInterceptor {
    constructor(private readonly metricsService: MetricsService) {}
  
    intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
      if (context.getType() !== 'http') {
        return next.handle();
      }
  
      const request = context.switchToHttp().getRequest();
      const response = context.switchToHttp().getResponse();
  
      const method = request.method as string;
      const route =
        request.route?.path ||
        request.baseUrl + (request.path || '') ||
        request.url ||
        'unknown';
  
      const endTimer =
        this.metricsService.httpRequestDurationSeconds.startTimer();
  
      return next.handle().pipe(
        tap(() => {
          const status = String(response.statusCode ?? 200);
  
          this.metricsService.httpRequestsTotal.inc({
            method,
            route,
            status,
          });
  
          endTimer({
            method,
            route,
            status,
          });
        }),
        catchError((error) => {
          const status = String(error?.status || response.statusCode || 500);
  
          this.metricsService.httpRequestsTotal.inc({
            method,
            route,
            status,
          });
  
          endTimer({
            method,
            route,
            status,
          });
  
          throw error;
        }),
      );
    }
  }