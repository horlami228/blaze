import { Controller, Post, Request } from '@nestjs/common';
import { RidesGateway } from './rides.gateway';
@Controller('api/v1/ride')
export class RideController {
  constructor(private readonly ridesGateway: RidesGateway) {}
  @Post('test')
  async sendTestNotification(@Request() req) {
    const userId = req.user.sub; // Current logged-in user

    // Send via WebSocket
    this.ridesGateway.sendNotification(userId, {
      title: 'testing',
      message: 'if this works, then the websocket is working',
    });

    return { success: true };
  }
}
