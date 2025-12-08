import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { createProxyMiddleware } from 'http-proxy-middleware';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Единый префикс для gateway
  app.setGlobalPrefix('api');

  // Cookies нужны, если auth читает jwt из cookie
  app.use(cookieParser());

  // ✅ CORS только на Gateway
  const frontendUrls = (process.env.FRONTEND_URLS ?? 'http://localhost:3000')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

  app.enableCors({
    origin: (origin, callback) => {
      // запросы без Origin (curl/health)
      if (!origin) return callback(null, true);

      if (frontendUrls.includes(origin)) return callback(null, true);

      return callback(new Error(`CORS blocked for origin: ${origin}`), false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // На будущее, если добавишь ручки прямо в gateway
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  // ====== ПРОКСИ В СЕРВИСЫ ======
  const expressApp = app.getHttpAdapter().getInstance();

  const authTarget = process.env.AUTH_SERVICE_URL ?? 'http://localhost:3001';
  const userTarget = process.env.USER_SERVICE_URL ?? 'http://localhost:3002';
  const catalogTarget =
    process.env.CATALOG_SERVICE_URL ?? 'http://localhost:3003';

  // ✅ ВАЖНО:
  // Из-за mount '/api/auth' Express отдаёт в прокси путь без префикса
  // (например '/register'), поэтому мы возвращаем '/api/auth' обратно.
  // Добавил защиту от двойного префикса на всякий случай.

  expressApp.use(
    '/api/auth',
    createProxyMiddleware({
      target: authTarget,
      changeOrigin: true,
      preserveHeaderKeyCase: true,
      pathRewrite: (path) =>
        path.startsWith('/api/auth') ? path : `/api/auth${path}`,
      // logLevel: 'debug', // включи при необходимости
    }),
  );

  expressApp.use(
    '/api/users',
    createProxyMiddleware({
      target: userTarget,
      changeOrigin: true,
      preserveHeaderKeyCase: true,
      pathRewrite: (path) =>
        path.startsWith('/api/users') ? path : `/api/users${path}`,
    }),
  );

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

  // Health-check самого gateway
  expressApp.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok', service: 'api-gateway' });
  });

  // ⚠️ 8081 по умолчанию, чтобы не конфликтовать с Jenkins на 8080
  const port = Number(process.env.PORT ?? 8081);
  await app.listen(port, '0.0.0.0');

  console.log(`🚀 API Gateway running on http://localhost:${port}`);
  console.log('Allowed frontend URLs:', frontendUrls);
  console.log('Targets:', { authTarget, userTarget, catalogTarget });
}

bootstrap();