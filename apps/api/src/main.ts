// Only load dotenv in development (Railway provides env vars in production)
if (process.env.NODE_ENV !== 'production') {
  require('dotenv/config');
}

import { ValidationPipe, HttpException, HttpStatus } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { validateEnv } from '@planday/config';

import { AppModule } from './app.module';
import { AppLoggerService } from './common/logger/logger.service';

async function checkStartupHealth(env: ReturnType<typeof validateEnv>) {
  // eslint-disable-next-line no-console
  console.log('🔍 [API] Checking startup health...');

  // Check PostgreSQL connection
  try {
    // eslint-disable-next-line no-console
    console.log('🔗 [API] Checking PostgreSQL connection...');

    // Use dynamic imports to avoid module resolution issues at startup
    const { getDatabase } = await import('@planday/database');
    const { sql } = await import('drizzle-orm');

    const db = getDatabase();
    await db.execute(sql`SELECT 1`);
    // eslint-disable-next-line no-console
    console.log('✅ [API] PostgreSQL connection successful');
  } catch (error) {
    console.error(
      '❌ [API] PostgreSQL connection failed:',
      error instanceof Error ? error.message : 'Unknown error',
    );
    console.error('❌ [API] Cannot start without database connection');
    process.exit(1);
  }

  // Check Redis connection (optional service)
  if (env.REDIS_URL) {
    try {
      // eslint-disable-next-line no-console
      console.log('🔗 [API] Checking Redis connection...');

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
        console.log('✅ [API] Redis connection successful');
      } else {
        console.warn('⚠️  [API] Redis ping returned unexpected result');
      }

      await redis.quit();
    } catch (error) {
      console.warn(
        '⚠️  [API] Redis connection failed:',
        error instanceof Error ? error.message : 'Unknown error',
      );
      console.warn(
        '⚠️  [API] Server will continue without Redis (caching disabled)',
      );
    }
  } else {
    // eslint-disable-next-line no-console
    console.log('ℹ️  [API] Redis not configured (optional service)');
  }

  // eslint-disable-next-line no-console
  console.log('✅ [API] Startup health check completed\n');
}

async function bootstrap() {
  // Validate environment variables
  const env = validateEnv();

  // Check startup health before starting server
  await checkStartupHealth(env);

  // Create NestJS app with Fastify
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: false }), // Disable Fastify logger, use Winston instead
  );

  // Get logger service from app context
  const logger = app.get(AppLoggerService);

  // Enable CORS (simplified for now)
  app.enableCors({
    origin: true,
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      exceptionFactory: (errors) => {
        logger.warn(
          `Validation failed: ${JSON.stringify(errors)}`,
          'ValidationPipe',
        );
        return new HttpException(
          {
            statusCode: HttpStatus.BAD_REQUEST,
            message: 'Validation failed',
            errors: errors,
          },
          HttpStatus.BAD_REQUEST,
        );
      },
    }),
  );

  // Global exception filter and interceptor are registered via APP_FILTER and APP_INTERCEPTOR in AppModule

  // API prefix (exclude root path for health checks)
  app.setGlobalPrefix('api', {
    exclude: ['/'],
  });

  // Swagger documentation
  const swaggerConfig = new DocumentBuilder()
    .setTitle('QuantumShift Planner API')
    .setDescription('Workforce Management System REST API')
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth', // This name here is important for matching up with @ApiBearerAuth() in your controller!
    )
    .addTag('Health', 'Health check endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'QuantumShift API Docs',
    customfavIcon: '/favicon.ico',
    customCss: '.swagger-ui .topbar { display: none }',
  });

  const port = parseInt(env.PORT, 10) || 4000;
  await app.listen(port, '0.0.0.0');

  logger.log(
    `🚀 API Server is running!
📍 URL: http://localhost:${port}
📚 Docs: http://localhost:${port}/api/docs
🏥 Health: http://localhost:${port}/api/health`,
    'Bootstrap',
  );
}

bootstrap().catch((error) => {
  // Use console.error as fallback if logger is not available
  console.error('Failed to start application:', error);
  process.exit(1);
});
