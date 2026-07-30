import { Redis } from 'ioredis';
import config from './config.js';
import logger from './logger.js';

/**
 * Shared Redis client used for caching. Cache keys that hold tenant data always
 * include the businessId so tenants never share a cache entry.
 */
const redis = new Redis(config.redis.url);

redis.on('error', (err: Error) => {
  logger.error(`Redis connection error: ${err.message}`);
});

redis.on('connect', () => {
  logger.info('Connected to Redis');
});

export default redis;
