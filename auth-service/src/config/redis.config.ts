export function buildRedisUrl() {
    const url = process.env.REDIS_URL;
    if (url && url.startsWith('redis://')) return url;
  
    const host = process.env.REDIS_HOST ?? 'redis-service';
    const port = process.env.REDIS_PORT ?? '6379';
    const pwd  = (process.env.REDIS_PASSWORD ?? '').trim();
  
    return pwd ? `redis://:${pwd}@${host}:${port}` : `redis://${host}:${port}`;
  }