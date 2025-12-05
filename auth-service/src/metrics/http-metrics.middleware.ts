// src/metrics/http-metrics.middleware.ts
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { HttpMetricsService } from './http-metrics.service';

@Injectable()
export class HttpMetricsMiddleware implements NestMiddleware {
  constructor(private readonly metricsService: HttpMetricsService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const start = process.hrtime.bigint(); // высокоточное время

    res.on('finish', () => {
      const end = process.hrtime.bigint();
      const diffNs = end - start;
      const durationSeconds = Number(diffNs) / 1e9;

      const method = req.method;
      const route =
        (req.route && req.route.path) || req.path || req.url || 'unknown';
      const statusCode = res.statusCode;

      this.metricsService.recordRequest(method, route, statusCode, durationSeconds);
    });

    next();
  }
}