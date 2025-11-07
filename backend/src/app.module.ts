import { Module } from '@nestjs/common';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ResourcesModule } from './modules/resources/resources.module';
import { BuildingsModule } from './modules/buildings/buildings.module';
import { BattleModule } from './modules/battle/battle.module';
import { GameModule } from './modules/game/game.module';
import { HealthController } from './modules/health/health.controller';
import { RedisModule } from './modules/redis/redis.module';
import { envValidationSchema } from './config/env.validation';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // Явно читаем .env в контейнере (/app/.env) и валидируем
      envFilePath: '.env',
      validationSchema: envValidationSchema,
    }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        uri: cfg.get<string>('MONGO_URI') || 'mongodb://mongo:27017/game-db', // compose-friendly default
      }),
    }),
    PrometheusModule.register(),
    RedisModule,
    AuthModule,
    UsersModule,
    ResourcesModule,
    BuildingsModule,
    BattleModule,
    GameModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}