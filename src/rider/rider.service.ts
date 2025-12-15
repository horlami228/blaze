import { Injectable } from '@nestjs/common';
import { Rider } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class RiderService {
  constructor(private readonly prisma: PrismaService) {}

  async createRider(userId: string): Promise<Rider> {
    return this.prisma.rider.create({
      data: { userId },
      include: { user: true },
    });
  }
}
