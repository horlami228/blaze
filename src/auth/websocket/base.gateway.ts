import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { PinoLogger } from 'nestjs-pino';

export abstract class BaseGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  constructor(
    protected readonly logger: PinoLogger,
    protected readonly context: string,
  ) {
    this.logger.setContext(this.context);
  }

  async handleConnection(client: Socket) {
    const user = client.data.user;

    if (!user) {
      this.logger.warn(`${this.context}: Connection denied - No user data`);
      client.disconnect();
      return;
    }

    const userId = user.sub || user.id;

    // 🚀 THE MAGIC: Join a room unique to the User ID
    // This removes the need for this.userSockets Map!
    await client.join(`user_${userId}`);

    this.logger.info(
      `${this.context}: User ${userId} connected and joined private room`,
    );
  }

  handleDisconnect(client: Socket) {
    const userId = client.data.user?.sub || client.data.user?.id;
    this.logger.info(`${this.context}: User ${userId} disconnected`);
  }

  // Helper to send to a specific user across any gateway
  protected emitToUser(userId: string, event: string, data: any) {
    this.server.to(`user_${userId}`).emit(event, data);
  }
}
