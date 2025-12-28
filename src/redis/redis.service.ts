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

    const redisUrl = this.configService.get<string>('REDIS_URL');
    this.client = new Redis(redisUrl, {
      //   host: this.configService.get('REDIS_HOST'),
      //   port: this.configService.get<number>('REDIS_PORT'),
      //   password: this.configService.get('REDIS_PASSWORD'),

      retryStrategy: (times) => {
        if (times > 20) {
          this.logger.error(
            'Redis retry limit reached. Stopping reconnection attempts.',
          );
          return null;
        }
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      connectTimeout: 5000,
      lazyConnect: true,
    });

    try {
      await this.client.connect();
      this.logger.info('Redis connected successfully');
    } catch (error) {
      this.logger.error({ error }, 'Redis connection error');
      throw new Error(`Redis connection failed: ${error.message}`);
    }
  }

  onModuleDestroy() {
    this.client.quit();
  }
}
