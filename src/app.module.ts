import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { UserModule } from './user/user.module';
import { PrismaModule } from './prisma/prisma.module';
import { BookModule } from './book/book.module';
import { AuthModule } from './auth/auth.module';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './auth/guard/auth.guard';
import { RolesGuard } from './auth/guard/role.guard';
import { CourseModule } from './course/course.module';
import * as Joi from 'joi';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env.${process.env.NODE_ENV || 'development'}`,
      validationSchema: Joi.object({
        DATABASE_URL: Joi.string().uri().required(),
        DIRECT_URL: Joi.string().uri().required(),
        JWT_SECRET: Joi.string().required(),
      }),
    }),
    ,
    UserModule,
    PrismaModule,
    BookModule,
    AuthModule,
    CourseModule,
  ],
  controllers: [AppController],
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
