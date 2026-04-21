// src/main.ts
import { NestFactory } from '@nestjs/core';
import {
  BadRequestException,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { ValidationError } from 'class-validator';

import { AppModule } from './app.module';
import { logger } from './logger';
import { registerPrismaTracing } from './tracing/prisma';

registerPrismaTracing();

// 🔧 утилита для извлечения сообщений из вложенных ошибок валидации
function collectValidationMessages(errors: ValidationError[] = []): string[] {
  const messages: string[] = [];

  for (const error of errors) {
    if (error.constraints) {
      messages.push(...Object.values(error.constraints));
    }
    if (error.children && error.children.length > 0) {
      messages.push(...collectValidationMessages(error.children));
    }
  }

  return messages;
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { logger });

  // ✅ cookies для refresh/me
  app.use(cookieParser());

  // ✅ /api/*
  app.setGlobalPrefix('api');

  // ✅ (опционально) версионирование: /v1/...
  app.enableVersioning({ type: VersioningType.URI });

  // =========================
  // ✅ ВАЖНО: CORS УБРАН ИЗ AUTH-SERVICE
  // =========================
  // CORS должен быть только на edge (API Gateway / Ingress),
  // иначе микросервис начинает "видеть браузер" и может падать по Origin.
  // app.enableCors(...) — УДАЛЕНО

  // ✅ health-check (минимально и корректно для Express)
  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.get('/api/health', (_req, res) => {
    res.status(200).json({ status: 'ok', service: 'auth-service' });
  });

  // ✅ validation c логированием ошибок
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      exceptionFactory: (validationErrors: ValidationError[] = []) => {
        const messages = collectValidationMessages(validationErrors);

        // 📜 логируем полное содержимое ошибок
        logger.error('Validation failed', {
          context: 'ValidationPipe',
          messages,
          errors: validationErrors,
        });

        // На клиент уходит массив строк (или дефолтное сообщение)
        return new BadRequestException(
          messages.length ? messages : ['Validation failed'],
        );
      },
    }),
  );

  // ✅ swagger только не-prod
  const isDev = process.env.NODE_ENV !== 'production';
  if (isDev) {
    const portForDocs = process.env.PORT ? Number(process.env.PORT) : 3000;

    const config = new DocumentBuilder()
      .setTitle('Auth API')
      .setDescription(
        'Auth-service API (registration, login, 2FA, email confirm)',
      )
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
  console.log(`🚀 Auth-service running on port ${port}`);
}

bootstrap();