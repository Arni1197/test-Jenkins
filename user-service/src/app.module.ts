import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';

import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { HealthModule } from './health/health.module';
import { MetricsModule } from './metrics/metrics.module';
import { AppController } from './app.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    PrismaModule,
    MetricsModule,
    HealthModule,

    // ✅ BullMQ root
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        connection: {
          host: cfg.get('REDIS_HOST', 'redis'),
          port: Number(cfg.get('REDIS_PORT', 6379)),
          // или если используешь URL:
          // url: cfg.get('REDIS_URL'),
        },
      }),
    }),

    // ✅ очередь событий пользователей
    BullModule.registerQueue({
      name: 'user-events',
    }),

    UsersModule,
  ],
  controllers: [AppController],
})
export class AppModule {}