import { Injectable } from '@nestjs/common';
import { Rider } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { PinoLogger } from 'nestjs-pino';

@Injectable()
export class RiderService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: PinoLogger,
  ) {}

  async createRider(userId: string): Promise<Rider> {
    this.logger.info({ userId }, 'Creating new rider profile');
    return this.prisma.rider.create({
      data: { userId },
      include: { user: true },
    });
  }
}
