import 'dotenv/config';
import path from 'node:path';
import { defineConfig } from 'prisma/config';

/**
 * Prisma CLI configuration (Prisma 7+).
 * The datasource URL lives here now instead of in schema.prisma; it is used by
 * migration / introspection commands. The runtime client connects via the
 * pg driver adapter (see src/config/prisma.ts).
 */
export default defineConfig({
  schema: path.join('prisma', 'schema.prisma'),
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
