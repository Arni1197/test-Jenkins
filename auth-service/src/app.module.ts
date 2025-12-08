// src/app.module.ts
import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import {
  PrometheusModule,
  makeCounterProvider,
  makeHistogramProvider,
} from '@willsoto/nestjs-prometheus';

import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';

import { AuthModule } from './modules/auth/auth.module';
// ✅ УБРАЛ прямой импорт UsersModule отсюда:
// если он нужен AuthService — он должен приходить через AuthModule imports.
// Так AppModule остаётся “чистым” для auth-service.
import { RedisModule } from './modules/redis/redis.module';
import { envValidationSchema } from './config/env.validation';
import { ValidationExceptionFilter } from './common/filters/validation-exception.filter';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { PrismaModule } from './prisma/prisma.module';

import { HttpMetricsService } from './metrics/http-metrics.service';
import { HttpMetricsMiddleware } from './metrics/http-metrics.middleware';

@Module({
  imports: [
    // 1) ENV
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validationSchema: envValidationSchema,
    }),

    // 2) Metrics
    PrometheusModule.register({
      defaultMetrics: { enabled: true },
      path: '/metrics',
    }),

    // 3) Redis module (как клиент/utility)
    RedisModule,

    // 4) Prisma (auth schema)
    PrismaModule,

    // 5) BullMQ (очереди поверх Redis)
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => {
        const url = cfg.get<string>('REDIS_URL');
    
        return {
          connection: url
            ? { url }
            : {
                host: cfg.get('REDIS_HOST', 'localhost'),
                port: Number(cfg.get('REDIS_PORT', 6379)),
              },
        };
      },
    }),

    // очередь для событий пользователей
    BullModule.registerQueue({
      name: 'user-events',
    }),

    // 6) Domain module
    AuthModule,
  ],
  providers: [
    { provide: APP_FILTER, useClass: ValidationExceptionFilter },
    { provide: APP_FILTER, useClass: HttpExceptionFilter },

    HttpMetricsService,
    makeCounterProvider({
      name: 'http_requests_total',
      help: 'Total HTTP requests',
      labelNames: ['method', 'route', 'status'] as const,
    }),
    makeHistogramProvider({
      name: 'http_request_duration_seconds',
      help: 'HTTP request duration in seconds',
      labelNames: ['method', 'route', 'status'] as const,
      buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2, 5],
    }),
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(HttpMetricsMiddleware).forRoutes('*');
  }
}