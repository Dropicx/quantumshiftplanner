import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { ValidationPipe } from '@nestjs/common';

import { AppModule } from './app.module';
import { validateEnv } from '@planday/config';

async function bootstrap() {
  // Validate environment variables
  const env = validateEnv();

  // Create NestJS app with Fastify
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: env.NODE_ENV === 'development' }),
  );

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
    }),
  );

  // API prefix
  app.setGlobalPrefix('api');

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

  console.log(`
🚀 API Server is running!
📍 URL: http://localhost:${port}
📚 Docs: http://localhost:${port}/api/docs
🏥 Health: http://localhost:${port}/api/health
  `);
}

bootstrap();
