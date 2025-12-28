import { WebSocketGateway } from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import { BaseGateway } from 'src/auth/websocket/base.gateway';
import { PinoLogger } from 'nestjs-pino';
import { Server } from 'socket.io';
import { SocketAuthMiddleware } from 'src/auth/websocket/socket-auth-middleware';
@WebSocketGateway({
  cors: { origin: '*' },
  namespace: 'rides',
})
export class RidesGateway extends BaseGateway {
  constructor(
    protected readonly logger: PinoLogger,
    private readonly jwtService: JwtService,
  ) {
    super(logger, 'RidesGateway');
  }

  afterInit(server: Server) {
    // Attach the shared middleware
    server.use(SocketAuthMiddleware(this.jwtService));
  }

  sendNotification(
    userId: string,
    notification: { title: string; message: string },
  ) {
    this.emitToUser(userId, 'notification', notification);
  }
}
