import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';

import { PrismaModule } from './prisma/prisma.module';

import { AuthModule } from './auth/auth.module';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './auth/guard/auth.guard';
import { RolesGuard } from './auth/guard/role.guard';

import { RiderModule } from './rider/rider.module';
import * as Joi from 'joi';
import { RiderController } from './rider/rider.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env.${process.env.NODE_ENV || 'dev'}`,
      validationSchema: Joi.object({
        DATABASE_URL: Joi.string().uri().required(),
        DIRECT_URL: Joi.string().uri().required(),
        JWT_SECRET: Joi.string().required(),
      }),
    }),

    PrismaModule,

    AuthModule,

    RiderModule,
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
  ],
})
export class AppModule {}
