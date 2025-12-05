// src/metrics/http-metrics.service.ts
import { Injectable } from '@nestjs/common';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import { Counter, Histogram } from 'prom-client';

@Injectable()
export class HttpMetricsService {
  constructor(
    @InjectMetric('http_requests_total')
    private readonly httpRequestsTotal: Counter<string>,

    @InjectMetric('http_request_duration_seconds')
    private readonly httpRequestDurationSeconds: Histogram<string>,
  ) {}

  recordRequest(method: string, route: string, statusCode: number, durationSeconds: number) {
    const labels = {
      method,
      route,
      status: statusCode.toString(),
    };

    // Кол-во запросов (для RPS и ошибок)
    this.httpRequestsTotal.inc(labels);

    // Длительность (для p50/p90/p99)
    this.httpRequestDurationSeconds.observe(labels, durationSeconds);
  }
}