import { z } from 'zod';

const envSchema = z.object({
  // Clerk Configuration
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1),
  CLERK_SECRET_KEY: z.string().min(1),

  // Supabase Configuration
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().default('https://ueqzjuclosoedybixqgs.supabase.co'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).default('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVlcXpqdWNsb3NvZWR5Yml4cWdzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc1OTY2MTQsImV4cCI6MjA2MzE3MjYxNH0.7a-bk5vsjxGbNYykbNo-qqh0eWZBkR0OCCNl0yAHkpk'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),

  // Authentication
  AUTH_SECRET: z.string().min(32),
  AUTH_SESSION_EXPIRY: z.coerce.number().int().positive().default(3600),
  AUTH_REFRESH_TOKEN_EXPIRY: z.coerce.number().int().positive().default(604800),

  // Security
  CORS_ORIGINS: z.string().transform(val => val.split(',')).optional().default('*'),
  MAX_LOGIN_ATTEMPTS: z.coerce.number().int().positive().default(5),
  LOGIN_ATTEMPT_WINDOW: z.coerce.number().int().positive().default(300),
  PASSWORD_RESET_EXPIRY: z.coerce.number().int().positive().default(3600),

  // Monitoring
  SENTRY_DSN: z.string().url().optional(),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),

  // Environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DEBUG: z.boolean().default(false),
});

// Parse and validate environment variables
const env = envSchema.parse(process.env);

// Export validated environment variables
export default env;

// Type for environment variables
export type Env = z.infer<typeof envSchema>;

// Helper to check if we're in production
export const isProduction = env.NODE_ENV === 'production';

// Helper to check if debug mode is enabled
export const isDebugEnabled = env.DEBUG || !isProduction; 