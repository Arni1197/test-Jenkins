// src/modules/redis/redis.provider.ts
import { Provider } from '@nestjs/common';
import Redis, { Redis as RedisClient } from 'ioredis';
import { REDIS } from './redis.constants';
import { buildRedisUrl } from 'src/config/redis.config';

export const RedisProvider: Provider = {
  provide: REDIS,
  useFactory: () => {
    const url = buildRedisUrl();

    const client: RedisClient = new Redis(url, {
      lazyConnect: false,
      retryStrategy: (times) => Math.min(times * 500, 5000),
      reconnectOnError: () => true,
      maxRetriesPerRequest: null,
      enableReadyCheck: true,
    });

    client.on('error', (e) => console.error('[Redis] error:', e.message));
    client.on('connect', () => console.log('[Redis] connect'));
    client.on('ready', () => console.log('[Redis] ready'));
    client.on('end', () => console.log('[Redis] end'));

    // ✅ Грейсфул-шатдаун хак для factory provider
    // Nest вызовет onModuleDestroy, если метод есть на объекте.
    const close = async () => {
      try {
        await client.quit();
      } catch {
        try {
          client.disconnect();
        } catch {}
      }
    };

    // @ts-expect-error - добавляем lifecycle метод на инстанс
    client.onModuleDestroy = close;

    return client;
  },
};