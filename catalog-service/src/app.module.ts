import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CatalogModule } from './catalog/catalog.module';
import { PrismaModule } from './prisma/prisma.module';
import { MetricsModule } from './metrics/metrics.module';
import { HealthController } from './health/health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    CatalogModule,
    MetricsModule
  ],
  controllers: [HealthController],
})
export class AppModule {}