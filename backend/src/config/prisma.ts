import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import config from './config.js';

/**
 * Single shared Prisma client, connected to PostgreSQL through the pg driver
 * adapter (required since Prisma 7). Import this everywhere data access is needed.
 */
const adapter = new PrismaPg({ connectionString: config.database.url });

const prisma = new PrismaClient({ adapter });

export default prisma;
