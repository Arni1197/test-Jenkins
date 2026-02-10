// src/main.ts
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { attachUserIdFromJwt } from './auth/userid.middleware';

// ✅ метрики
import { Registry } from 'prom-client';
import type { RegistryContentType } from 'prom-client';
import { createHttpMetricsMiddleware } from './metrics/http-metrics.middleware';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ✅ Единый префикс
  app.setGlobalPrefix('api');

  // ✅ cookie нужны, если auth пишет jwt/refresh в cookie
  app.use(cookieParser());

  // =========================
  // ✅ CORS ТОЛЬКО НА GATEWAY
  // =========================
  const frontendUrls = (process.env.FRONTEND_URLS ?? 'http://localhost:3000')
    .split(',')
    .map((s) => s.trim().replace(/\/$/, ''))
    .filter(Boolean);

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);

      const normalizedOrigin = origin.trim().replace(/\/$/, '');
      const ok = frontendUrls.includes(normalizedOrigin);

      return callback(null, ok);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Cache-Control',
      'Pragma',
      'X-Requested-With',
    ],
  });

  // ✅ Валидация
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  const expressApp = app.getHttpAdapter().getInstance();

  // =========================
  // ✅ HTTP METRICS (middleware)
  // =========================
  const registry = app.get(Registry) as Registry<RegistryContentType>;
  expressApp.use(createHttpMetricsMiddleware(registry));

  // =========================
  // ✅ TARGETS
  // =========================
  const authTarget = process.env.AUTH_SERVICE_URL ?? 'http://localhost:3001';
  const userTarget = process.env.USER_SERVICE_URL ?? 'http://localhost:3002';
  const catalogTarget =
    process.env.CATALOG_SERVICE_URL ?? 'http://localhost:3003';

  // =========================
  // ✅ AUTH (просто прокси)
  // =========================
  expressApp.use(
    '/api/auth',
    createProxyMiddleware({
      target: authTarget,
      changeOrigin: true,
      preserveHeaderKeyCase: true,
      pathRewrite: (path) =>
        path.startsWith('/api/auth') ? path : `/api/auth${path}`,
    }),
  );

  // =========================
  // ✅ USERS
  // =========================
  expressApp.use(
    '/api/users',
    attachUserIdFromJwt,
    createProxyMiddleware({
      target: userTarget,
      changeOrigin: true,
      preserveHeaderKeyCase: true,
      pathRewrite: (path) =>
        path.startsWith('/api/users') ? path : `/api/users${path}`,
      on: {
        proxyReq: (proxyReq, req) => {
          const userId = (req as any).userId;
          if (userId) proxyReq.setHeader('x-user-id', userId);
        },
      },
    }),
  );

  // =========================
  // ✅ CATALOG
  // =========================
  expressApp.use(
    '/api/catalog',
    createProxyMiddleware({
      target: catalogTarget,
      changeOrigin: true,
      preserveHeaderKeyCase: true,
      pathRewrite: (path) =>
        path.startsWith('/api/catalog') ? path : `/api/catalog${path}`,
    }),
  );

  // =========================
  // ✅ Health-check gateway
  // =========================
  expressApp.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok', service: 'api-gateway' });
  });

  const port = Number(process.env.PORT ?? 8081);
  await app.listen(port, '0.0.0.0');

  console.log(`🚀 API Gateway running on http://localhost:${port}`);
  console.log('Allowed frontend URLs:', frontendUrls);
  console.log('Targets:', { authTarget, userTarget, catalogTarget });
}

bootstrap();