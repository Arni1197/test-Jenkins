import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { attachUserIdFromJwt } from './auth/userid.middleware';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');
  app.use(cookieParser());

  const frontendUrls = (process.env.FRONTEND_URLS ?? 'http://localhost:3000')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (frontendUrls.includes(origin)) return callback(null, true);
      return callback(new Error(`CORS blocked for origin: ${origin}`), false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  const expressApp = app.getHttpAdapter().getInstance();

  const authTarget = process.env.AUTH_SERVICE_URL ?? 'http://localhost:3001';
  const userTarget = process.env.USER_SERVICE_URL ?? 'http://localhost:3002';
  const catalogTarget =
    process.env.CATALOG_SERVICE_URL ?? 'http://localhost:3003';

  // ---------- AUTH (без x-user-id) ----------
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

  // ---------- USERS (Вариант A: JWT -> x-user-id) ----------
  expressApp.use(
    '/api/users',
    attachUserIdFromJwt,
    createProxyMiddleware({
      target: userTarget,
      changeOrigin: true,
      preserveHeaderKeyCase: true,
      pathRewrite: (path) =>
        path.startsWith('/api/users') ? path : `/api/users${path}`,

      // ✅ правильный формат для твоей версии типов
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

  // ---------- CATALOG (пока без авторизации) ----------
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