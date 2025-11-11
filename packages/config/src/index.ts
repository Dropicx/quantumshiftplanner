import { z } from 'zod';

// Environment variable schema
export const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  PORT: z.string().default('4000'),
  DATABASE_URL: z.string(),
  REDIS_URL: z.string().optional(),
  CLERK_SECRET_KEY: z.string(),
  CLERK_PUBLISHABLE_KEY: z.string(),
});

export type Env = z.infer<typeof envSchema>;

// App configuration
export const config = {
  app: {
    name: 'Planday Clone',
    version: '1.0.0',
  },
  pagination: {
    defaultLimit: 20,
    maxLimit: 100,
  },
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
  },
  jwt: {
    expiresIn: '7d',
  },
} as const;

export function validateEnv(): Env {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    console.error('❌ Invalid environment variables:', error);
    throw new Error('Invalid environment variables');
  }
}
