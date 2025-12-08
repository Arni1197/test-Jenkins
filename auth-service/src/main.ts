// src/main.ts
import { NestFactory } from '@nestjs/core';
import { BadRequestException, ValidationPipe, VersioningType } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';

import { AppModule } from './app.module';
import { logger } from './logger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { logger });

  // ✅ cookies для refresh/me
  app.use(cookieParser());

  // ✅ /api/*
  app.setGlobalPrefix('api');

  // ✅ (опционально) версионирование: /v1/...
  app.enableVersioning({ type: VersioningType.URI });

  // ✅ CORS multi-env
  const fallbackFrontend = 'http://localhost:3002';
  const frontendUrl = process.env.FRONTEND_URL ?? fallbackFrontend;

  // Можно передавать список:
  // FRONTEND_URLS="http://localhost:3002,https://staging.gameproject.com"
  const frontendUrls = (process.env.FRONTEND_URLS ?? frontendUrl)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  app.enableCors({
    origin: (origin, callback) => {
      // ✅ запросы без Origin (health/curl)
      if (!origin) return callback(null, true);

      if (frontendUrls.includes(origin)) return callback(null, true);

      return callback(new Error(`CORS blocked for origin: ${origin}`), false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // ✅ health-check (минимально и корректно для Express)
  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.get('/api/health', (_req, res) => {
    res.status(200).json({ status: 'ok', service: 'auth-service' });
  });

  // ✅ validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      exceptionFactory: (validationErrors = []) => {
        const msgs = validationErrors.flatMap((e) =>
          Object.values(e.constraints ?? {}),
        );
        return new BadRequestException(msgs.length ? msgs : 'Validation failed');
      },
    }),
  );

  // ✅ swagger только не-prod
  const isDev = process.env.NODE_ENV !== 'production';
  if (isDev) {
    const portForDocs = process.env.PORT ? Number(process.env.PORT) : 3000;

    const config = new DocumentBuilder()
      .setTitle('Auth API')
      .setDescription('Auth-service API (registration, login, 2FA, email confirm)')
      .setVersion('1.0')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          in: 'header',
          name: 'Authorization',
        },
        'access-token',
      )
      .addServer(`http://localhost:${portForDocs}`, 'Local')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document);

    expressApp.get('/openapi.json', (_req, res) => {
      res.type('application/json').send(document);
    });
  }

  app.enableShutdownHooks();

  const port = process.env.PORT ? Number(process.env.PORT) : 3000;
  await app.listen(port, '0.0.0.0');

  // eslint-disable-next-line no-console
  console.log(`🚀 Auth-service running on http://localhost:${port}`);
}

bootstrap();