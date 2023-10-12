import { Redis } from 'ioredis';

import { env } from '../env';

console.log(env.REDIS_URL);
export const redis = new Redis(env.REDIS_URL, { lazyConnect: true });
