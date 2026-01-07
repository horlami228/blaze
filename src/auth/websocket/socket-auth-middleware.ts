import { JwtService } from '@nestjs/jwt';
import { Socket } from 'socket.io';

export type SocketMiddleware = (
  socket: Socket,
  next: (err?: Error) => void,
) => void;

export const SocketAuthMiddleware = (
  jwtService: JwtService,
): SocketMiddleware => {
  return (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.split(' ')[1];

      if (!token) {
        return next(new Error('Unauthorized: No token provided'));
      }

      const payload = jwtService.verify(token);
      socket.data.user = payload; // Attach user to socket
      next();
    } catch (error) {
      next(new Error('Unauthorized: Invalid token'));
    }
  };
};
