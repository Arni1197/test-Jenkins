// src/metrics/http-metrics.middleware.ts
import type { Request, Response, NextFunction } from 'express';
import { Counter, Histogram } from 'prom-client';
import type { Registry } from 'prom-client';

function normalizeRoute(req: Request): string {
  const path = (req.originalUrl || req.url || '').split('?')[0] || 'unknown';

  return path
    .replace(/\/\d+(?=\/|$)/g, '/:id')
    .replace(/\/[0-9a-f]{8,}(?=\/|$)/gi, '/:id');
}

export function createHttpMetricsMiddleware(registry: Registry) {
  const httpRequestsTotal = new Counter({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status', 'service'],
    registers: [registry],
  });

  const httpRequestDuration = new Histogram({
    name: 'http_request_duration_seconds',
    help: 'HTTP request duration in seconds',
    labelNames: ['method', 'route', 'status', 'service'],
    registers: [registry],
    buckets: [0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
  });

  return (req: Request, res: Response, next: NextFunction) => {
    const path = req.originalUrl || req.url || '';

    // ❌ не считаем служебные эндпоинты
    if (path.startsWith('/api/metrics') || path.startsWith('/api/health')) {
      return next();
    }

    const endTimer = httpRequestDuration.startTimer();

    res.on('finish', () => {
      const labels = {
        method: req.method,
        route: normalizeRoute(req),
        status: String(res.statusCode),
        service: 'api-gateway',
      };

      httpRequestsTotal.inc(labels);
      endTimer(labels);
    });

    next();
  };
}