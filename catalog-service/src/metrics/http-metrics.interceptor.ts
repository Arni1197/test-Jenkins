import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { MetricsService } from './metrics.service';

@Injectable()
export class HttpMetricsInterceptor implements NestInterceptor {
  constructor(private readonly metricsService: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    const method = request.method as string;

    const route =
      request.baseUrl && request.route?.path
        ? `${request.baseUrl}${request.route.path}`.replace(/\/+/g, '/')
        : request.route?.path || request.originalUrl || request.url || 'unknown';

    const endTimer = this.metricsService.httpRequestDurationSeconds.startTimer();

    return next.handle().pipe(
      finalize(() => {
        const status = String(response.statusCode ?? 500);

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
    );
  }
}