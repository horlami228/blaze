import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import { BaseGateway } from 'src/auth/websocket/base.gateway';
import { PinoLogger } from 'nestjs-pino';
import { Server, Socket } from 'socket.io';
import { SocketAuthMiddleware } from 'src/auth/websocket/socket-auth-middleware';
import { Ride } from '@prisma/client';
import { RideService } from './ride.service';
import { Inject, forwardRef } from '@nestjs/common';
import { UpdateDriverLocationDto } from 'src/driver/dto/update-driver-location-dto';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: 'rides',
})
export class RidesGateway extends BaseGateway {
  constructor(
    protected readonly logger: PinoLogger,
    private readonly jwtService: JwtService,
    @Inject(forwardRef(() => RideService))
    private readonly rideService: RideService,
  ) {
    super(logger, 'RidesGateway');
  }

  afterInit(server: Server) {
    // Attach the shared middleware
    server.use(SocketAuthMiddleware(this.jwtService));
  }

  @SubscribeMessage('update-location')
  async handleUpdateLocation(
    @MessageBody() payload: UpdateDriverLocationDto,
    @ConnectedSocket() client: Socket,
  ) {
    const userId = client.data.user.sub;
    this.logger.info({ userId }, 'Received location update via WebSocket');
    await this.rideService.updateDriverLocation(userId, payload);
  }

  @SubscribeMessage('join-ride')
  async handleJoinRide(
    @MessageBody() payload: { rideId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = client.data.user.sub;
    this.logger.info({ userId, rideId: payload.rideId }, 'Joining ride room');
    await client.join(`ride:${payload.rideId}`);
  }

  sendNotification(
    userId: string,
    notification: { title: string; message: string },
  ) {
    this.emitToUser(userId, 'notification', notification);
  }

  sendNewRideNotification(userId: string, ride: Ride) {
    this.emitToUser(userId, 'new-ride', ride);
  }

  emitRideStatusUpdate(ride: Ride) {
    // Notify both rider and driver
    this.emitToUser(ride.driverId, 'ride-status-update', ride);
    this.emitToUser(ride.riderId, 'ride-status-update', ride);

    // Also emit to the ride room if we're using rooms
    this.server.to(`ride:${ride.id}`).emit('ride-status-update', ride);
  }
  emitDriverLocationUpdate(
    rideId: string,
    location: {
      latitude: number;
      longitude: number;
      heading?: number;
      speed?: number;
    },
  ) {
    this.server.to(`ride:${rideId}`).emit('driver-location', location);
  }
}
