import { Injectable } from '@nestjs/common';
import { Driver } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
@Injectable()
export class DriverService {
  constructor(private prisma: PrismaService) {}

  async createDriver(userId: string): Promise<Driver> {
    return this.prisma.driver.create({
      data: { userId },
      include: { user: true },
    });
  }
}
