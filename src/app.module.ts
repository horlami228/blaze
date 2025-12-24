import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { PrismaModule } from './prisma/prisma.module';

import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/guard/auth.guard';
import { RolesGuard } from './auth/guard/role.guard';

import { RiderModule } from './rider/rider.module';
import * as Joi from 'joi';
import { RiderController } from './rider/rider.controller';
import { DriverModule } from './driver/driver.module';
import { RequestIdMiddleware } from './common/middleware/request-id.middleware';
import { SanitizeInputMiddleware } from './common/middleware/sanitize-input.middleware';
import { loggerConfigFactory } from './common/config/logger.config';
import { LoggerModule } from 'nestjs-pino';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env.${process.env.NODE_ENV || 'dev'}`,
      validationSchema: Joi.object({
        DATABASE_URL: Joi.string().uri().required(),
        DIRECT_URL: Joi.string().uri().required(),
        JWT_SECRET: Joi.string().required(),
        GOOGLE_CLIENT_ID: Joi.string().required(),
        LOG_LEVEL: Joi.string().default('info'),
        BETTERSTACK_ENABLED: Joi.boolean().default(false),
        BETTERSTACK_TOKEN: Joi.string().optional(),
        BETTERSTACK_ENDPOINT: Joi.string().optional(),
      }),
    }),
    LoggerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        loggerConfigFactory(configService),
    }),
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000,
        limit: 10,
      },
      {
        name: 'medium',
        ttl: 60000,
        limit: 100,
      },
      {
        name: 'long',
        ttl: 600000,
        limit: 1000,
      },
    ]),

    PrismaModule,

    AuthModule,

    RiderModule,

    DriverModule,
  ],
  controllers: [AppController, RiderController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestIdMiddleware, SanitizeInputMiddleware).forRoutes('*');
  }
}
