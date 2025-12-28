import { Module } from '@nestjs/common';
import { RideController } from './ride.controller';
import { RideService } from './ride.service';
import { RedisModule } from 'src/redis/redis.module';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [RedisModule, PrismaModule],
  controllers: [RideController],
  providers: [RideService],
})
export class RideModule {}
