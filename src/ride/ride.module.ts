import { Module } from '@nestjs/common';
import { RideController } from './ride.controller';
import { RideService } from './ride.service';
import { RedisModule } from 'src/redis/redis.module';
import { PrismaModule } from 'src/prisma/prisma.module';
import { RidesGateway } from './rides.gateway';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [RedisModule, PrismaModule, AuthModule],
  controllers: [RideController],
  providers: [RideService, RidesGateway],
  exports: [RideService],
})
export class RideModule {}
