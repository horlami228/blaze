import { Body, Controller, Post, Request } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { RidesGateway } from './rides.gateway';
import { RideService } from './ride.service';
import { UpdateDriverLocationDto } from 'src/driver/dto/update-driver-location-dto';
import { RequestRideDto } from './dto/request-ride-dto';
@ApiTags('Ride')
@ApiBearerAuth()
@Controller('api/v1/ride')
export class RideController {
  constructor(
    private readonly ridesGateway: RidesGateway,
    private readonly rideService: RideService,
  ) {}
  @Post('test')
  @ApiOperation({ summary: 'Send a test WebSocket notification' })
  @ApiResponse({ status: 201, description: 'Notification sent successfully' })
  async sendTestNotification(@Request() req) {
    const userId = req.user.sub; // Current logged-in user

    // Send via WebSocket
    this.ridesGateway.sendNotification(userId, {
      title: 'testing',
      message: 'if this works, then the websocket is working',
    });

    return { success: true };
  }
  @Post('update-driver-location')
  @ApiOperation({ summary: 'Update driver location and track ride path' })
  @ApiResponse({
    status: 201,
    description: 'Driver location updated successfully',
    schema: {
      example: {
        message: 'Driver location updated successfully',
      },
    },
  })
  async updateDriverLocation(
    @Body() dto: UpdateDriverLocationDto,
    @Request() req,
  ) {
    const userId = req.user.sub; // Current logged-in user
    return await this.rideService.updateDriverLocation(userId, dto);
  }

  @Post('toggle-availability')
  @ApiOperation({ summary: 'Toggle driver availability' })
  @ApiResponse({
    status: 201,
    description: 'Driver is now online/offline',
    schema: {
      example: {
        message: 'Driver is now online/offline',
        data: {
          isOnline: true,
        },
      },
    },
  })
  async toggleAvailability(@Request() req) {
    const userId = req.user.sub;
    return await this.rideService.toggleDriverAvailability(userId);
  }

  @Post('request-ride')
  @ApiOperation({ summary: 'Request a ride' })
  @ApiResponse({
    status: 201,
    description: 'Ride requested successfully',
    schema: {
      example: {
        message: 'Ride requested successfully',
        data: {
          ride: {},
          estiamtedRoadDistance: 10,
          estimatedFare: 1000,
        },
      },
    },
  })
  async requestRide(@Body() dto: RequestRideDto, @Request() req) {
    const userId = req.user.sub;
    return await this.rideService.requestRide(userId, dto);
  }
}
