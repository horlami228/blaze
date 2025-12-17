import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PrismaService } from '../prisma/prisma.service';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './strategy/jwt.strategy';
import { RiderService } from 'src/rider/rider.service';
import { GoogleStrategy } from './strategy/google.strategy';
import { DriverService } from 'src/driver/driver.service';
@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: { expiresIn: '4h' },
      }),
    }),
  ],
  providers: [
    AuthService,
    PrismaService,
    JwtStrategy,
    RiderService,
    GoogleStrategy,
    DriverService,
  ],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
