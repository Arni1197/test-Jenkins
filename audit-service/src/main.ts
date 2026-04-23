import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create(AppModule);

  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port, '0.0.0.0');

  logger.log(`🚀 Audit Service started on http://0.0.0.0:${port}`);
}

bootstrap();