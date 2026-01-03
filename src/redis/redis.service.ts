import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';
import { PinoLogger } from 'nestjs-pino';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  public client: Redis;

  constructor(
    private readonly configService: ConfigService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(RedisService.name);

    const redisUrl = this.configService.get<string>('REDIS_URL');
    this.client = new Redis(redisUrl, {
      lazyConnect: true, // Crucial: don't connect yet
      retryStrategy: (times) => {
        if (times > 20) return null;
        return Math.min(times * 50, 2000);
      },
    });
  }

  async onModuleInit() {
    this.logger.debug('=== Environment Variables Check ===');
    this.logger.debug(
      `REDIS_URL: ${this.configService.get<string>('REDIS_URL') ? '✓ Set' : '✗ Not set'}`,
    );
    this.logger.debug(
      `REDIS_URL preview: ${this.configService.get<string>('REDIS_URL').substring(0, 20)}...`,
    );
    this.logger.debug('===================================');

    try {
      await this.client.connect();
      this.logger.info('Redis connected successfully');
    } catch (error) {
      this.logger.error({ error }, 'Redis connection error');
      throw new Error(`Redis connection failed: ${error.message}`);
    }
  }

  // creates a twin of the client for the WebSocket Adapter to use
  getSubscriberClient(): Redis {
    return this.client.duplicate();
  }

  onModuleDestroy() {
    this.client.quit();
  }
}
