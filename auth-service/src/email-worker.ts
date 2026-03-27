import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { EmailWorkerModule } from './email-worker.module';
import { logger } from './logger';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(EmailWorkerModule, {
    logger,
  });

  app.enableShutdownHooks();

  // eslint-disable-next-line no-console
  console.log('📨 Email worker started');
}

bootstrap();