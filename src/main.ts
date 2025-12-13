import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Swagger setup
  const config = new DocumentBuilder()
    .setTitle('School Portal')
    .setDescription('API documentation for Fortis Nexarion School Portal')
    .setVersion('1.0')
    .build();

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.enableCors();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  console.log(`NODE_ENV: ${process.env.NODE_ENV}`);

  await app.listen(process.env.PORT ?? 9000);
}
bootstrap();
