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

import { validateEnv } from '@planday/config';

import { AppModule } from './app.module';
import { AppLoggerService } from './common/logger/logger.service';

async function bootstrap() {
  // Validate environment variables
  const env = validateEnv();

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

  // Swagger documentation (disabled temporarily)
  // if (env.NODE_ENV === 'development') {
  //   const config = new DocumentBuilder()
  //     .setTitle('Planday Clone API')
  //     .setDescription('Workforce Management System REST API')
  //     .setVersion('1.0')
  //     .addBearerAuth()
  //     .build();

  //   const document = SwaggerModule.createDocument(app, config);
  //   SwaggerModule.setup('api/docs', app, document);
  // }

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
