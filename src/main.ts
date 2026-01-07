import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import { ZodValidationPipe } from 'nestjs-zod';

import helmet from 'helmet';
import { RedisService } from './redis/redis.service';
import { RedisIoAdapter } from './auth/websocket/redis-io.adapter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });
  // Swagger setup
  const config = new DocumentBuilder()
    .setTitle('School Portal')
    .setDescription('API documentation for Fortis Nexarion School Portal')
    .setVersion('1.0')
    .build();

  const logger = app.get(Logger);
  app.useLogger(logger);

  app.use(
    helmet({
      contentSecurityPolicy: process.env.NODE_ENV === 'production',
      crossOriginEmbedderPolicy: process.env.NODE_ENV === 'production',
      crossOriginResourcePolicy: process.env.NODE_ENV === 'production',
    }),
  );

  // WebSocket setup for redis pub/sub
  const redisService = app.get(RedisService);
  const redisIoAdapter = new RedisIoAdapter(app, redisService);
  await redisIoAdapter.connectToRedis();

  // Use adapter for all websocket gateway
  app.useWebSocketAdapter(redisIoAdapter);

  // app.setGlobalPrefix('api/v1');

  // app.useGlobalPipes(
  //   new ValidationPipe({
  //     whitelist: true,
  //     forbidNonWhitelisted: true,
  //     transform: true,
  //     transformOptions: {
  //       enableImplicitConversion: true,
  //     },
  //     exceptionFactory: (errors) => {
  //       if (process.env.NODE_ENV === 'production') {
  //         // Don't leak validation details in production
  //         throw new BadRequestException('Invalid request data');
  //       }
  //       // In development, return detailed validation errors
  //       const messages = errors.map((error) => ({
  //         field: error.property,
  //         errors: Object.values(error.constraints || {}),
  //       }));
  //       throw new BadRequestException({
  //         message: 'Validation failed',
  //         errors: messages,
  //       });
  //     },
  //   }),
  // );

  app.useGlobalPipes(new ZodValidationPipe());

  app.enableCors();
  // Disable Express fingerprinting
  app.getHttpAdapter().getInstance().disable('x-powered-by');

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
  const port = process.env.PORT ?? 9000;
  await app.listen(port);
  logger.log(`🚀 Application is running on: http://localhost:${port}`);
  logger.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.log(`🔒 Security: Helmet enabled, Rate limiting active`);
}
bootstrap();
