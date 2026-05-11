import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { PrismaService } from './prisma/prisma.service';
import { requestContextMiddleware } from './common/request-context.middleware';
import { httpLoggerMiddleware } from './common/http-logger.middleware';
import { AllExceptionsFilter } from './common/all-exceptions.filter';

export let isShuttingDown = false;

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalFilters(new AllExceptionsFilter());
  app.use(requestContextMiddleware);
  app.use(httpLoggerMiddleware('catalog-service'));

  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );

  app.enableShutdownHooks();

  const prismaService = app.get(PrismaService);
  prismaService.enableShutdownHooks(app);

  process.on('SIGTERM', async () => {
    console.log('SIGTERM received. Catalog Service is shutting down...');
    isShuttingDown = true;

    setTimeout(async () => {
      await app.close();
      process.exit(0);
    }, 5000);
  });

  const port = Number(process.env.PORT ?? 3003);

  await app.listen(port, '0.0.0.0');

  console.log(`🚀 Catalog Service running on http://localhost:${port}`);
  console.log(`📊 Metrics available at http://localhost:${port}/api/metrics`);
}

void bootstrap();