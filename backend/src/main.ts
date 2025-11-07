// main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import {
  BadRequestException,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // (опционально) глобальный префикс для REST
  app.setGlobalPrefix('api'); // тогда все ручки станут /api/...
  
  // (опционально) версионирование
  app.enableVersioning({ type: VersioningType.URI }); // /v1/..., /v2/...

  app.enableCors({
    origin: process.env.FRONTEND_URL ?? 'http://localhost:3002',
    credentials: true,
  });

  // Глобальная валидация
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    exceptionFactory: (validationErrors = []) => {
      const msgs = validationErrors.flatMap(e => Object.values(e.constraints ?? {}));
      return new BadRequestException(msgs.length ? msgs : 'Validation failed');
    },
  }));

  // Swagger включаем только в dev и локально
  const isDev = process.env.NODE_ENV !== 'production';
  if (isDev) {
    const config = new DocumentBuilder()
      .setTitle('Game API')
      .setDescription('API для игры с ресурсами, зданиями и боями')
      .setVersion('1.0')
      // JWT авторизация (кнопка Authorize)
      .addBearerAuth(
        { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', in: 'header', name: 'Authorization' },
        'access-token',
      )
      // (опционально) серверы (отобразятся в UI)
      .addServer('http://localhost:5001', 'Local (Docker host)')
      .addServer('http://localhost:3000', 'Local (inside container)')
      .build();

    const document = SwaggerModule.createDocument(app, config);

    // UI по адресу /docs (чтобы /api — оставался префиксом REST)
    SwaggerModule.setup('docs', app, document);

    // Отдаём openapi.json для фронта/генераторов
    // http://localhost:5001/openapi.json
    app.getHttpAdapter().get('/openapi.json', (req, res) => {
      res.type('application/json').send(document);
    });
  }

  const port = process.env.PORT ? Number(process.env.PORT) : 3000;
  await app.listen(port);
  console.log(`🚀 Server running on http://localhost:${port}`);
  if (isDev) {
    console.log(`📘 Swagger: http://localhost:${port}/docs`);
    console.log(`📄 OpenAPI JSON: http://localhost:${port}/openapi.json`);
  }
}
bootstrap();