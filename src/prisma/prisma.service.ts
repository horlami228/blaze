import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { Logger } from 'nestjs-pino';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor(private readonly logger: Logger) {
    super({
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
    });

    // Log environment variables via Pino
    this.logger.debug('=== Environment Variables Check ===');
    this.logger.debug(
      `DATABASE_URL: ${process.env.DATABASE_URL ? '✓ Set' : '✗ Not set'}`,
    );
    this.logger.debug(
      `DIRECT_URL: ${process.env.DIRECT_URL ? '✓ Set' : '✗ Not set'}`,
    );

    if (process.env.DATABASE_URL) {
      this.logger.debug(
        `DATABASE_URL preview: ${process.env.DATABASE_URL.substring(0, 20)}...`,
      );
    }
    this.logger.debug('===================================');
  }

  async onModuleInit() {
    await this.connectWithRetry();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  private async connectWithRetry(retries = 5, delay = 2000) {
    for (let i = 0; i < retries; i++) {
      try {
        await this.$connect();
        this.logger.log('Database connected');
        return;
      } catch (err) {
        this.logger.warn(`DB connection failed. Retry ${i + 1}/${retries}...`);
        if (i === retries - 1) throw err; // final failure
        await new Promise((res) => setTimeout(res, delay));
      }
    }
  }
}
