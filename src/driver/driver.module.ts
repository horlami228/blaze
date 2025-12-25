import { Module } from '@nestjs/common';
import { DriverController } from './driver.controller';
import { DriverService } from './driver.service';

import { PrismaModule } from 'src/prisma/prisma.module';
import { CloudflareR2Module } from 'src/common/cloudflare/cloudflare-r2.module';

@Module({
  imports: [PrismaModule, CloudflareR2Module],
  controllers: [DriverController],
  providers: [DriverService],
  exports: [DriverService],
})
export class DriverModule {}
