// Only load dotenv in development (Railway provides env vars in production)
if (process.env.NODE_ENV !== 'production') {
  require('dotenv/config');
}

import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';

import { validateEnv } from '@planday/config';

import { AppModule } from './app.module';

async function checkStartupHealth(env: ReturnType<typeof validateEnv>) {
  // eslint-disable-next-line no-console
  console.log('🔍 [Worker] Checking startup health...');

  // Check PostgreSQL connection
  try {
    // eslint-disable-next-line no-console
    console.log('🔗 [Worker] Checking PostgreSQL connection...');

    // Use dynamic imports to avoid module resolution issues at startup
    const { getDatabase } = await import('@planday/database');
    const { sql } = await import('drizzle-orm');

    const db = getDatabase();
    await db.execute(sql`SELECT 1`);
    // eslint-disable-next-line no-console
    console.log('✅ [Worker] PostgreSQL connection successful');
  } catch (error) {
    console.error(
      '❌ [Worker] PostgreSQL connection failed:',
      error instanceof Error ? error.message : 'Unknown error',
    );
    console.error('❌ [Worker] Cannot start without database connection');
    process.exit(1);
  }

  // Check Redis connection (required for BullMQ)
  if (env.REDIS_URL) {
    try {
      // eslint-disable-next-line no-console
      console.log('🔗 [Worker] Checking Redis connection...');

      // Use dynamic import to avoid module resolution issues at startup
      const Redis = (await import('ioredis')).default;

      const redis = new Redis(env.REDIS_URL, {
        connectTimeout: 5000,
        maxRetriesPerRequest: 1,
        retryStrategy: () => null,
      });

      const result = await Promise.race([
        redis.ping(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Redis ping timeout')), 5000),
        ),
      ]);

      if (result === 'PONG') {
        // eslint-disable-next-line no-console
        console.log('✅ [Worker] Redis connection successful');
      } else {
        console.error('❌ [Worker] Redis ping returned unexpected result');
        process.exit(1);
      }

      await redis.quit();
    } catch (error) {
      console.error(
        '❌ [Worker] Redis connection failed:',
        error instanceof Error ? error.message : 'Unknown error',
      );
      console.error(
        '❌ [Worker] Cannot start without Redis (required for job queue)',
      );
      process.exit(1);
    }
  } else {
    console.error('❌ [Worker] REDIS_URL not configured');
    console.error('❌ [Worker] Redis is required for job processing');
    process.exit(1);
  }

  // eslint-disable-next-line no-console
  console.log('✅ [Worker] Startup health check completed\n');
}

async function bootstrap() {
  // Validate environment variables
  const env = validateEnv();

  // Check startup health before starting worker
  await checkStartupHealth(env);

  // Create NestJS app with Fastify (minimal HTTP server for health checks)
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: env.NODE_ENV === 'development' }),
  );

  // API prefix for health endpoint
  app.setGlobalPrefix('api');

  const port = parseInt(env.PORT, 10) || 4001;
  await app.listen(port, '0.0.0.0');

  // eslint-disable-next-line no-console
  console.log(`
⚙️  Worker Service is running!
📍 Health: http://localhost:${port}/api/health
🔄 Processing jobs from Redis...
  `);
}

bootstrap().catch((error) => {
  console.error('Failed to start worker service:', error);
  process.exit(1);
});
