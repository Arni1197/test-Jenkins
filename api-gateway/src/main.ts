import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { attachUserIdFromJwt } from './auth/userid.middleware';

// ✅ METRICS
import { Registry } from 'prom-client';
import { createHttpMetricsMiddleware } from './metrics/http-metrics.middleware';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ✅ Единый префикс
  app.setGlobalPrefix('api');

  app.use(cookieParser());

  // =========================
  // ✅ CORS
  // =========================
  const frontendUrls = (process.env.FRONTEND_URLS ?? 'http://localhost:3000')
    .split(',')
    .map((s) => s.trim().replace(/\/$/, ''))
    .filter(Boolean);

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const ok = frontendUrls.includes(origin.replace(/\/$/, ''));
      return callback(null, ok);
    },
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  const expressApp = app.getHttpAdapter().getInstance();

  // =========================
  // ✅ HTTP METRICS
  // =========================
  const registry = app.get(Registry);
  expressApp.use(createHttpMetricsMiddleware(registry));

  // =========================
  // ✅ TARGETS
  // =========================
  const authTarget = process.env.AUTH_SERVICE_URL ?? 'http://localhost:3001';
  const userTarget = process.env.USER_SERVICE_URL ?? 'http://localhost:3002';
  const catalogTarget = process.env.CATALOG_SERVICE_URL ?? 'http://localhost:3003';

  // =========================
  // ✅ AUTH
  // =========================
  expressApp.use(
    '/api/auth',
    createProxyMiddleware({
      target: authTarget,
      changeOrigin: true,
      pathRewrite: (path) => `/api/auth${path.replace('/api/auth', '')}`,
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
      pathRewrite: (path) => `/api/users${path.replace('/api/users', '')}`,
      on: {
        proxyReq: (proxyReq, req) => {
          const userId = (req as any).userId;
          if (userId) {
            proxyReq.setHeader('x-user-id', userId);
          }
        },
      },
    }),
  );

  // =========================
  // ✅ CATALOG PRIVATE
  // =========================
  expressApp.use(
    [
      '/api/catalog/me',
      '/api/catalog/favorites',
      '/api/catalog/cart',
      '/api/catalog/recently-viewed',
    ],
    attachUserIdFromJwt,
    createProxyMiddleware({
      target: catalogTarget,
      changeOrigin: true,
      pathRewrite: (_path, req) => {
        return (req as any).originalUrl;
      },
      on: {
        proxyReq: (proxyReq, req) => {
          const userId = (req as any).userId;
          if (userId) {
            proxyReq.setHeader('x-user-id', userId);
          }
        },
      },
    }),
  );

  // =========================
  // ✅ CATALOG PUBLIC
  // =========================
  expressApp.use(
    '/api/catalog',
    createProxyMiddleware({
      target: catalogTarget,
      changeOrigin: true,
      pathRewrite: (_path, req) => {
        return (req as any).originalUrl;
      },
      on: {
        proxyReq: (proxyReq, req) => {
          try {
            const auth = req.headers.authorization;
            const tokenFromHeader =
              auth && auth.startsWith('Bearer ') ? auth.slice(7).trim() : null;

            const tokenFromCookie =
              (req as any).cookies?.accessToken ||
              (req as any).cookies?.jwt ||
              null;

            const token = tokenFromHeader || tokenFromCookie;
            if (!token) return;

            const secret = process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET;
            if (!secret) return;

            const payload = require('jsonwebtoken').verify(token, secret);
            const userId = payload.sub ?? payload.userId ?? payload.id;

            if (userId) {
              proxyReq.setHeader('x-user-id', userId);
            }
          } catch {
            // публичный маршрут остаётся публичным:
            // если токен отсутствует или битый, просто не прокидываем userId
          }
        },
      },
    }),
  );

  // =========================
  // ✅ HEALTH
  // =========================
  expressApp.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', service: 'api-gateway' });
  });

  const port = Number(process.env.PORT ?? 8081);
  await app.listen(port, '0.0.0.0');

  console.log(`🚀 API Gateway running on :${port}`);
}

bootstrap();