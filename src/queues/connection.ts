import { Redis } from 'ioredis';
import config from '../config/config.js';

/**
 * Dedicated Redis connection for BullMQ. BullMQ requires
 * `maxRetriesPerRequest: null` on its connection, so this is kept separate from
 * the cache client in config/redis.ts.
 */
export const queueConnection = new Redis(config.redis.url, { maxRetriesPerRequest: null });
