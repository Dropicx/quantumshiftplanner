// Only load dotenv in development (Railway provides env vars in production)
if (process.env.NODE_ENV !== 'production') {
  require('dotenv/config');
}

import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';

import { validateEnv } from '@planday/config';

import { AppModule } from './app.module';

async function bootstrap() {
  // Validate environment variables
  const env = validateEnv();

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
