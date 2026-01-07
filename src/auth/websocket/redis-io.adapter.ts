import { IoAdapter } from '@nestjs/platform-socket.io';
import { ServerOptions } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { RedisService } from 'src/redis/redis.service';

export class RedisIoAdapter extends IoAdapter {
  private adapterConstructor: ReturnType<typeof createAdapter>;

  constructor(
    appOrHttpServer: any,
    private readonly redisService: RedisService,
  ) {
    super(appOrHttpServer);
  }

  async connectToRedis(): Promise<void> {
    const pubClient = this.redisService.client;
    const subClient = this.redisService.getSubscriberClient();

    // Ensure the subscriber is also connected
    await subClient.connect();

    this.adapterConstructor = createAdapter(pubClient, subClient);
  }

  createIOServer(port: number, options?: ServerOptions): any {
    const server = super.createIOServer(port, options);
    server.adapter(this.adapterConstructor);
    return server;
  }
}
