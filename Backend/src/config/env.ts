import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().url(),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  JWT_SECRET: z.string().min(32).default('dev-only-secret-change-me-0123456789abcdef'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  SESSION_TTL_DAYS: z.coerce.number().default(7),
  BOOTSTRAP_ADMIN_EMAIL: z.string().email().default('admin@thedailyedit.local'),
  BOOTSTRAP_ADMIN_USERNAME: z.string().default('admin'),
  BOOTSTRAP_ADMIN_PASSWORD: z.string().min(8).default('ChangeMe!2026'),
  SITE_URL: z.string().url().default('http://localhost:5173'),
  UPLOAD_DIR: z.string().default('uploads'),
  MAX_UPLOAD_MB: z.coerce.number().default(10),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // eslint-disable-next-line no-console
  console.error('Invalid environment configuration:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
export const isProd = env.NODE_ENV === 'production';
