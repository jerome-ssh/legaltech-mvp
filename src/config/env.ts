import { z } from 'zod';

const envSchema = z.object({
  // Clerk Configuration
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1),
  CLERK_SECRET_KEY: z.string().min(1),

  // Supabase Configuration
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional().default('http://localhost:54321'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional().default('dummy-anon-key'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional().default('dummy-service-role-key'),

  // Authentication
  AUTH_SECRET: z.string().min(32),
  AUTH_SESSION_EXPIRY: z.coerce.number().int().positive().default(3600),
  AUTH_REFRESH_TOKEN_EXPIRY: z.coerce.number().int().positive().default(604800),

  // Rate Limiting
  UPSTASH_REDIS_URL: z.string().url().optional(),
  UPSTASH_REDIS_TOKEN: z.string().optional(),

  // Email Configuration
  SMTP_HOST: z.string().min(1),
  SMTP_PORT: z.coerce.number().int().positive(),
  SMTP_USER: z.string().min(1),
  SMTP_PASSWORD: z.string().min(1),
  SMTP_FROM: z.string().email(),

  // Security
  CORS_ORIGINS: z.string().transform(val => val.split(',')),
  MAX_LOGIN_ATTEMPTS: z.coerce.number().int().positive().default(5),
  LOGIN_ATTEMPT_WINDOW: z.coerce.number().int().positive().default(300),
  PASSWORD_RESET_EXPIRY: z.coerce.number().int().positive().default(3600),

  // Monitoring
  SENTRY_DSN: z.string().url().optional(),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),

  // Redis
  REDIS_URL: z.string().url(),
  REDIS_TOKEN: z.string(),

  // Other
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

// Validate environment variables
const env = envSchema.parse({
  ...process.env,
  // Convert string environment variables to numbers where needed
  AUTH_SESSION_EXPIRY: process.env.AUTH_SESSION_EXPIRY,
  AUTH_REFRESH_TOKEN_EXPIRY: process.env.AUTH_REFRESH_TOKEN_EXPIRY,
  SMTP_PORT: process.env.SMTP_PORT,
  MAX_LOGIN_ATTEMPTS: process.env.MAX_LOGIN_ATTEMPTS,
  LOGIN_ATTEMPT_WINDOW: process.env.LOGIN_ATTEMPT_WINDOW,
  PASSWORD_RESET_EXPIRY: process.env.PASSWORD_RESET_EXPIRY,
});

export default env; 