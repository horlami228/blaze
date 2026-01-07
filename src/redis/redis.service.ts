import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';
import { PinoLogger } from 'nestjs-pino';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  public client: Redis;
  private readonly clients: Redis[] = [];

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
    this.client.on('error', (err) => {
      this.logger.error({ err }, 'Redis main client error');
    });
    this.clients.push(this.client);
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
      if (this.client.status === 'wait' || this.client.status === 'end') {
        await this.client.connect();
        this.logger.info('Redis connected successfully');
      } else {
        this.logger.debug(
          `Redis already in status: ${this.client.status}, skipping explicit connect`,
        );
      }
    } catch (error) {
      if (error.message.includes('already connected')) {
        this.logger.debug('Redis already connected, ignoring');
        return;
      }
      this.logger.error({ error }, 'Redis connection error');
      throw new Error(`Redis connection failed: ${error.message}`);
    }
  }

  // creates a twin of the client for the WebSocket Adapter to use
  getSubscriberClient(): Redis {
    const dupe = this.client.duplicate();
    dupe.on('error', (err) => {
      this.logger.error({ err }, 'Redis subscriber client error');
    });
    this.clients.push(dupe);
    return dupe;
  }

  async onModuleDestroy() {
    this.logger.debug(
      `Closing ${this.clients.length} Redis clients in onModuleDestroy`,
    );
    await Promise.all(
      this.clients.map(async (client) => {
        try {
          // If already disconnected or ended, do nothing
          if (client.status === 'end' || client.status === 'wait') {
            return;
          }
          // Attempt graceful shutdown
          await client.quit();
        } catch (err) {
          // Silence "Connection is closed" and other shutdown-related errors
          if (!err.message.includes('Connection is closed')) {
            this.logger.debug(
              { err },
              'Incidental error during redis shutdown',
            );
          }
          // Fallback to immediate disconnect
          try {
            client.disconnect();
          } catch (e) {
            // fully give up
          }
        }
      }),
    );
  }
}
