import { Module } from '@nestjs/common';
import { MetricsModule } from '../metrics/metrics.module';
import { KafkaProducer } from './kafka.producer';

@Module({
  imports: [MetricsModule],
  providers: [KafkaProducer],
  exports: [KafkaProducer],
})
export class KafkaModule {}