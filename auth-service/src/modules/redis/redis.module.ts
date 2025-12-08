// src/modules/redis/redis.module.ts
import { Global, Module } from '@nestjs/common';
import { RedisProvider } from './redis.provider';

@Global()
@Module({
  providers: [RedisProvider],
  exports: [RedisProvider],
})
export class RedisModule {}