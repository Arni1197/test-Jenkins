import { Provider, OnModuleDestroy } from '@nestjs/common';
import Redis, { Redis as RedisClient } from 'ioredis';
import { REDIS } from './redis.constants';
import { buildRedisUrl } from 'src/config/redis.config';

export const RedisProvider: Provider & Partial<OnModuleDestroy> = {
  provide: REDIS,
  useFactory: () => {
    const url = buildRedisUrl();
    const client: RedisClient = new Redis(url, {
      lazyConnect: false,
      retryStrategy: (times) => Math.min(times * 500, 5000), // 0.5s → 5s
      reconnectOnError: () => true,
      maxRetriesPerRequest: null,
      enableReadyCheck: true,
    });

    client.on('error',   (e) => console.error('[Redis] error:', e.message));
    client.on('connect', () => console.log('[Redis] connect'));
    client.on('ready',   () => console.log('[Redis] ready'));
    client.on('end',     () => console.log('[Redis] end'));

    // Грейсфул-шатдаун для Nest
    const close = async () => { try { await client.quit(); } catch { await client.disconnect(); } };
    // @ts-ignore
    (client as any).onModuleDestroy = close;

    return client;
  },
};