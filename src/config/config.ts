import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { z } from 'zod';
import { validationMessages } from './messages.js';

const currentDir = path.dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: path.join(currentDir, '../../.env') });

const envVarsSchema = z.object({
  NODE_ENV: z.enum(['production', 'development', 'test']),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().min(1, `DATABASE_URL ${validationMessages.REQUIRED}`),
  REDIS_URL: z.string().min(1, `REDIS_URL ${validationMessages.REQUIRED}`),
  JWT_SECRET: z.string().min(1, `JWT_SECRET ${validationMessages.REQUIRED}`),
  JWT_ACCESS_EXPIRATION_MINUTES: z.coerce.number().int().positive().default(30),
});

const parsed = envVarsSchema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', ');
  throw new Error(`Config validation error: ${issues}`);
}

const envVars = parsed.data;

interface Config {
  env: 'production' | 'development' | 'test';
  port: number;
  database: {
    url: string;
  };
  redis: {
    url: string;
  };
  jwt: {
    secret: string;
    accessExpirationMinutes: number;
  };
}

const config: Config = {
  env: envVars.NODE_ENV,
  port: envVars.PORT,
  database: {
    url: envVars.DATABASE_URL,
  },
  redis: {
    url: envVars.REDIS_URL,
  },
  jwt: {
    secret: envVars.JWT_SECRET,
    accessExpirationMinutes: envVars.JWT_ACCESS_EXPIRATION_MINUTES,
  },
};

export default config;
