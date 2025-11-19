// main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { logger } from './logger';

import {
  BadRequestException,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { logger });

  // (опционально) глобальный префикс для REST
  app.setGlobalPrefix('api'); // тогда все ручки станут /api/...

  // (опционально) версионирование
  app.enableVersioning({ type: VersioningType.URI }); // /v1/..., /v2/...

  app.enableCors({
    origin: process.env.FRONTEND_URL ?? 'http://localhost:3002',
    credentials: true,
  });

  // 🔹 Глобальный health-check для Kubernetes: GET /api/health
  const httpAdapter = app.getHttpAdapter();
  httpAdapter.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  // Глобальная валидация
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      exceptionFactory: (validationErrors = []) => {
        const msgs = validationErrors.flatMap(e =>
          Object.values(e.constraints ?? {}),
        );
        return new BadRequestException(msgs.length ? msgs : 'Validation failed');
      },
    }),
  );

  // Swagger включаем только в dev и локально
  const isDev = process.env.NODE_ENV !== 'production';
  if (isDev) {
    const config = new DocumentBuilder()
      .setTitle('Game API')
      .setDescription('API для игры с ресурсами, зданиями и боями')
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
      .addServer('http://localhost:5001', 'Local (Docker host)')
      .addServer('http://localhost:3000', 'Local (inside container)')
      .build();

    const document = SwaggerModule.createDocument(app, config);

    SwaggerModule.setup('docs', app, document);

    app.getHttpAdapter().get('/openapi.json', (req, res) => {
      res.type('application/json').send(document);
    });
  }

  const port = process.env.PORT ? Number(process.env.PORT) : 3000;
  await app.listen(port, '0.0.0.0');
  console.log(`🚀 Server running on http://localhost:${port}`);
  if (isDev) {
    console.log(`📘 Swagger: http://localhost:${port}/docs`);
    console.log(`📄 OpenAPI JSON: http://localhost:${port}/openapi.json`);
  }
}
bootstrap();