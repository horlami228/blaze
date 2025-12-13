import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    // Log environment variables
    console.log('=== Environment Variables Check ===');
    console.log(
      'DATABASE_URL:',
      process.env.DATABASE_URL ? '✓ Set' : '✗ Not set',
    );
    console.log('DIRECT_URL:', process.env.DIRECT_URL ? '✓ Set' : '✗ Not set');

    // Optional: Print first 20 characters to verify without exposing full credentials
    if (process.env.DATABASE_URL) {
      console.log(
        'DATABASE_URL preview:',
        process.env.DATABASE_URL.substring(0, 20) + '...',
      );
    }
    console.log('===================================');
    super({
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
    });
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
        console.log('Database connected');
        return;
      } catch (err) {
        console.warn(`DB connection failed. Retry ${i + 1}/${retries}...`);
        if (i === retries - 1) throw err; // final failure
        await new Promise((res) => setTimeout(res, delay));
      }
    }
  }
}
