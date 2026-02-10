// src/metrics/http-metrics.interceptor.ts
import {
    CallHandler,
    ExecutionContext,
    Injectable,
    NestInterceptor,
  } from '@nestjs/common';
  import { Observable } from 'rxjs';
  import { finalize } from 'rxjs/operators';
  import { Counter, Gauge, Histogram, register } from 'prom-client';
  
  const httpRequestsTotal =
    (register.getSingleMetric('http_requests_total') as Counter<string>) ??
    new Counter({
      name: 'http_requests_total',
      help: 'Total HTTP requests',
      labelNames: ['method', 'route', 'status'],
    });
  
  const httpRequestDurationSeconds =
    (register.getSingleMetric('http_request_duration_seconds') as Histogram<string>) ??
    new Histogram({
      name: 'http_request_duration_seconds',
      help: 'HTTP request duration in seconds',
      labelNames: ['method', 'route', 'status'],
      buckets: [0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
    });
  
  const httpInFlight =
    (register.getSingleMetric('http_in_flight_requests') as Gauge<string>) ??
    new Gauge({
      name: 'http_in_flight_requests',
      help: 'In-flight HTTP requests',
      labelNames: ['method', 'route'],
    });
  
  @Injectable()
  export class HttpMetricsInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
      const started = process.hrtime.bigint();
      const req = context.switchToHttp().getRequest();
      const res = context.switchToHttp().getResponse();
  
      const method = req.method ?? 'UNKNOWN';
      const route =
        (req.route?.path as string) ||
        req.originalUrl?.split('?')[0] ||
        'unknown';
  
      httpInFlight.labels(method, route).inc();
  
      return next.handle().pipe(
        finalize(() => {
          const status = String(res.statusCode ?? 0);
          const ended = process.hrtime.bigint();
          const seconds = Number(ended - started) / 1e9;
  
          httpInFlight.labels(method, route).dec();
          httpRequestsTotal.labels(method, route, status).inc();
          httpRequestDurationSeconds.labels(method, route, status).observe(seconds);
        }),
      );
    }
  }