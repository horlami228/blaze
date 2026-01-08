import {
  Body,
  Controller,
  Param,
  Post,
  Patch,
  Request,
  Get,
} from '@nestjs/common';
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

  @Patch('toggle-availability')
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

  @Get('active')
  @ApiOperation({ summary: 'Get active ride' })
  @ApiResponse({
    status: 201,
    description: 'Active ride found',
    schema: {
      example: {
        message: 'Active ride found',
        data: {
          ride: {
            id: '56128cc7-5583-42bf-8889-29e85f824a56',
            riderId: 'a1a5c43c-957b-40a8-a0d7-e615d99fe7ad',
            driverId: '40678f34-cd79-4397-9203-47389f1e6243',
            vehicleId: 'c365d7a5-a714-40e6-859c-c319c30f0cd5',
            pickupLatitude: '6.514656',
            pickupLongitude: '3.490738',
            pickupAddress: 'Third Mainland Bridge',
            dropoffLatitude: '6.460058',
            dropoffLongitude: '3.459315',
            dropoffAddress: 'Banana Island, Eti Osa, Nigeria',
            startDateTime: '2026-01-04T20:52:50.000Z',
            endDateTime: null,
            status: 'PENDING',
            fare: 1810.63,
            distance: '8.74',
            path_json: [],
            createdAt: '2026-01-04T20:52:50.001Z',
            updatedAt: '2026-01-04T20:52:50.001Z',
            driver: {
              id: '40678f34-cd79-4397-9203-47389f1e6243',
              userId: 'ee56f65c-c345-4472-81aa-b73ea82f84f7',
              licenseNumber: null,
              licensePhoto: null,
              profilePhoto: null,
              onboardingCompleted: true,
              onboardingStep: 3,
              lastKnownLatitude: '6.49',
              lastKnownLongitude: '3.4',
              lastLocationUpdate: '2026-01-04T19:50:51.721Z',
              lastHeading: null,
              lastSpeed: null,
              isOnline: true,
              createdAt: '2026-01-03T05:43:37.185Z',
              updatedAt: '2026-01-04T19:50:51.722Z',
              deletedAt: null,
              user: {
                id: 'ee56f65c-c345-4472-81aa-b73ea82f84f7',
                email: 'tunde.driver@example.com',
                password:
                  '$argon2id$v=19$m=65536,t=3,p=1$KfBMypTAymIgSUdPLtMQQQ$c8zJf/tF6uStEg6e1h+9RtKN4S8kq1ArjPPu7Wkcl/Y',
                role: 'DRIVER',
                isVerified: true,
                phone: '+2348022222222',
                avatar: null,
                googleId: null,
                firstName: 'Tunde',
                dateOfBirth: '2026-01-03T05:43:37.180Z',
                gender: 'MALE',
                lastName: 'Bakare',
                createdAt: '2026-01-03T05:43:37.180Z',
                updatedAt: '2026-01-04T19:50:51.716Z',
                deletedAt: null,
              },
              vehicle: {
                id: 'c365d7a5-a714-40e6-859c-c319c30f0cd5',
                driverId: '40678f34-cd79-4397-9203-47389f1e6243',
                modelId: 'abcca413-b6ba-4d2d-a987-fcb454a314d6',
                color: 'SILVER',
                plateNumber: 'ABC-456-XY',
                year: 2020,
                insuranceNumber: 'INS-ABC-456-XY',
                insuranceCompany: null,
                exteriorPhoto: 'https://placehold.co/600x400',
                interiorPhoto: 'https://placehold.co/600x400',
                isActive: true,
                createdAt: '2026-01-03T05:43:37.193Z',
                updatedAt: '2026-01-04T19:50:51.729Z',
                deletedAt: null,
                model: {
                  id: 'abcca413-b6ba-4d2d-a987-fcb454a314d6',
                  manufacturerId: 'e64941b5-9202-48b5-b6d0-6cda53851317',
                  name: 'Corolla',
                  type: 'SEDAN',
                  seats: 4,
                  createdAt: '2025-12-19T18:42:18.114Z',
                  manufacturer: {
                    id: 'e64941b5-9202-48b5-b6d0-6cda53851317',
                    name: 'Toyota',
                    createdAt: '2025-12-19T18:42:18.104Z',
                  },
                },
              },
            },
            rider: {
              id: 'a1a5c43c-957b-40a8-a0d7-e615d99fe7ad',
              userId: 'deba9200-439a-456d-86f7-960e1e4103a4',
              createdAt: '2025-12-14T12:03:19.314Z',
              updatedAt: '2025-12-14T12:03:19.314Z',
              deletedAt: null,
              user: {
                id: 'deba9200-439a-456d-86f7-960e1e4103a4',
                email: 'test_rider@example.com',
                password:
                  '$argon2id$v=19$m=65536,t=3,p=1$5P/OX6h0HGpQky1IKpq4rw$WkoiKkpw9lRjnSLFLHQe/7ByfdqaJBbtccCZZaEr/gM',
                role: 'RIDER',
                isVerified: false,
                phone: '+12345678897',
                avatar: null,
                googleId: null,
                firstName: 'Jeremy',
                dateOfBirth: '2025-12-19T20:36:49.209Z',
                gender: 'MALE',
                lastName: 'Doku',
                createdAt: '2025-12-14T12:03:19.305Z',
                updatedAt: '2025-12-14T12:03:19.305Z',
                deletedAt: null,
              },
            },
          },
          estiamtedRoadDistance: 10,
          estimatedFare: 1000,
        },
      },
    },
  })
  async getOngoingRide(@Request() req) {
    const userId = req.user.sub;
    return this.rideService.getOngoingRide(userId);
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
          ride: {
            id: '56128cc7-5583-42bf-8889-29e85f824a56',
            riderId: 'a1a5c43c-957b-40a8-a0d7-e615d99fe7ad',
            driverId: '40678f34-cd79-4397-9203-47389f1e6243',
            vehicleId: 'c365d7a5-a714-40e6-859c-c319c30f0cd5',
            pickupLatitude: '6.514656',
            pickupLongitude: '3.490738',
            pickupAddress: 'Third Mainland Bridge',
            dropoffLatitude: '6.460058',
            dropoffLongitude: '3.459315',
            dropoffAddress: 'Banana Island, Eti Osa, Nigeria',
            startDateTime: '2026-01-04T20:52:50.000Z',
            endDateTime: null,
            status: 'PENDING',
            fare: 1810.63,
            distance: '8.74',
            path_json: [],
            createdAt: '2026-01-04T20:52:50.001Z',
            updatedAt: '2026-01-04T20:52:50.001Z',
            driver: {
              id: '40678f34-cd79-4397-9203-47389f1e6243',
              userId: 'ee56f65c-c345-4472-81aa-b73ea82f84f7',
              licenseNumber: null,
              licensePhoto: null,
              profilePhoto: null,
              onboardingCompleted: true,
              onboardingStep: 3,
              lastKnownLatitude: '6.49',
              lastKnownLongitude: '3.4',
              lastLocationUpdate: '2026-01-04T19:50:51.721Z',
              lastHeading: null,
              lastSpeed: null,
              isOnline: true,
              createdAt: '2026-01-03T05:43:37.185Z',
              updatedAt: '2026-01-04T19:50:51.722Z',
              deletedAt: null,
              user: {
                id: 'ee56f65c-c345-4472-81aa-b73ea82f84f7',
                email: 'tunde.driver@example.com',
                password:
                  '$argon2id$v=19$m=65536,t=3,p=1$KfBMypTAymIgSUdPLtMQQQ$c8zJf/tF6uStEg6e1h+9RtKN4S8kq1ArjPPu7Wkcl/Y',
                role: 'DRIVER',
                isVerified: true,
                phone: '+2348022222222',
                avatar: null,
                googleId: null,
                firstName: 'Tunde',
                dateOfBirth: '2026-01-03T05:43:37.180Z',
                gender: 'MALE',
                lastName: 'Bakare',
                createdAt: '2026-01-03T05:43:37.180Z',
                updatedAt: '2026-01-04T19:50:51.716Z',
                deletedAt: null,
              },
              vehicle: {
                id: 'c365d7a5-a714-40e6-859c-c319c30f0cd5',
                driverId: '40678f34-cd79-4397-9203-47389f1e6243',
                modelId: 'abcca413-b6ba-4d2d-a987-fcb454a314d6',
                color: 'SILVER',
                plateNumber: 'ABC-456-XY',
                year: 2020,
                insuranceNumber: 'INS-ABC-456-XY',
                insuranceCompany: null,
                exteriorPhoto: 'https://placehold.co/600x400',
                interiorPhoto: 'https://placehold.co/600x400',
                isActive: true,
                createdAt: '2026-01-03T05:43:37.193Z',
                updatedAt: '2026-01-04T19:50:51.729Z',
                deletedAt: null,
                model: {
                  id: 'abcca413-b6ba-4d2d-a987-fcb454a314d6',
                  manufacturerId: 'e64941b5-9202-48b5-b6d0-6cda53851317',
                  name: 'Corolla',
                  type: 'SEDAN',
                  seats: 4,
                  createdAt: '2025-12-19T18:42:18.114Z',
                  manufacturer: {
                    id: 'e64941b5-9202-48b5-b6d0-6cda53851317',
                    name: 'Toyota',
                    createdAt: '2025-12-19T18:42:18.104Z',
                  },
                },
              },
            },
            rider: {
              id: 'a1a5c43c-957b-40a8-a0d7-e615d99fe7ad',
              userId: 'deba9200-439a-456d-86f7-960e1e4103a4',
              createdAt: '2025-12-14T12:03:19.314Z',
              updatedAt: '2025-12-14T12:03:19.314Z',
              deletedAt: null,
              user: {
                id: 'deba9200-439a-456d-86f7-960e1e4103a4',
                email: 'test_rider@example.com',
                password:
                  '$argon2id$v=19$m=65536,t=3,p=1$5P/OX6h0HGpQky1IKpq4rw$WkoiKkpw9lRjnSLFLHQe/7ByfdqaJBbtccCZZaEr/gM',
                role: 'RIDER',
                isVerified: false,
                phone: '+12345678897',
                avatar: null,
                googleId: null,
                firstName: 'Jeremy',
                dateOfBirth: '2025-12-19T20:36:49.209Z',
                gender: 'MALE',
                lastName: 'Doku',
                createdAt: '2025-12-14T12:03:19.305Z',
                updatedAt: '2025-12-14T12:03:19.305Z',
                deletedAt: null,
              },
            },
          },
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

  @Patch('accept-ride/:rideId')
  @ApiOperation({ summary: 'Accept a ride' })
  @ApiResponse({
    status: 201,
    description: 'Ride accepted successfully',
    schema: {
      example: {
        message: 'Ride accepted successfully',
        data: {
          id: 'b85f6594-3a20-4b11-8edf-32078051e79c',
          riderId: 'a1a5c43c-957b-40a8-a0d7-e615d99fe7ad',
          driverId: '40678f34-cd79-4397-9203-47389f1e6243',
          vehicleId: 'c365d7a5-a714-40e6-859c-c319c30f0cd5',
          pickupLatitude: '6.514656',
          pickupLongitude: '3.490738',
          pickupAddress: 'Third Mainland Bridge',
          dropoffLatitude: '6.460058',
          dropoffLongitude: '3.459315',
          dropoffAddress: 'Banana Island, Eti Osa, Nigeria',
          startDateTime: '2026-01-04T19:31:55.723Z',
          endDateTime: null,
          status: 'ACCEPTED',
          fare: 1810.63,
          distance: '8.74',
          path_json: [],
          createdAt: '2026-01-04T19:31:55.724Z',
          updatedAt: '2026-01-04T20:29:38.580Z',
          driver: {
            id: '40678f34-cd79-4397-9203-47389f1e6243',
            userId: 'ee56f65c-c345-4472-81aa-b73ea82f84f7',
            licenseNumber: null,
            licensePhoto: null,
            profilePhoto: null,
            onboardingCompleted: true,
            onboardingStep: 3,
            lastKnownLatitude: '6.49',
            lastKnownLongitude: '3.4',
            lastLocationUpdate: '2026-01-04T19:50:51.721Z',
            lastHeading: null,
            lastSpeed: null,
            isOnline: true,
            createdAt: '2026-01-03T05:43:37.185Z',
            updatedAt: '2026-01-04T19:50:51.722Z',
            deletedAt: null,
            user: {
              id: 'ee56f65c-c345-4472-81aa-b73ea82f84f7',
              email: 'tunde.driver@example.com',
              password:
                '$argon2id$v=19$m=65536,t=3,p=1$KfBMypTAymIgSUdPLtMQQQ$c8zJf/tF6uStEg6e1h+9RtKN4S8kq1ArjPPu7Wkcl/Y',
              role: 'DRIVER',
              isVerified: true,
              phone: '+2348022222222',
              avatar: null,
              googleId: null,
              firstName: 'Tunde',
              dateOfBirth: '2026-01-03T05:43:37.180Z',
              gender: 'MALE',
              lastName: 'Bakare',
              createdAt: '2026-01-03T05:43:37.180Z',
              updatedAt: '2026-01-04T19:50:51.716Z',
              deletedAt: null,
            },
            vehicle: {
              id: 'c365d7a5-a714-40e6-859c-c319c30f0cd5',
              driverId: '40678f34-cd79-4397-9203-47389f1e6243',
              modelId: 'abcca413-b6ba-4d2d-a987-fcb454a314d6',
              color: 'SILVER',
              plateNumber: 'ABC-456-XY',
              year: 2020,
              insuranceNumber: 'INS-ABC-456-XY',
              insuranceCompany: null,
              exteriorPhoto: 'https://placehold.co/600x400',
              interiorPhoto: 'https://placehold.co/600x400',
              isActive: true,
              createdAt: '2026-01-03T05:43:37.193Z',
              updatedAt: '2026-01-04T19:50:51.729Z',
              deletedAt: null,
            },
          },
          rider: {
            id: 'a1a5c43c-957b-40a8-a0d7-e615d99fe7ad',
            userId: 'deba9200-439a-456d-86f7-960e1e4103a4',
            createdAt: '2025-12-14T12:03:19.314Z',
            updatedAt: '2025-12-14T12:03:19.314Z',
            deletedAt: null,
            user: {
              id: 'deba9200-439a-456d-86f7-960e1e4103a4',
              email: 'test_rider@example.com',
              password:
                '$argon2id$v=19$m=65536,t=3,p=1$5P/OX6h0HGpQky1IKpq4rw$WkoiKkpw9lRjnSLFLHQe/7ByfdqaJBbtccCZZaEr/gM',
              role: 'RIDER',
              isVerified: false,
              phone: '+12345678897',
              avatar: null,
              googleId: null,
              firstName: 'Jeremy',
              dateOfBirth: '2025-12-19T20:36:49.209Z',
              gender: 'MALE',
              lastName: 'Doku',
              createdAt: '2025-12-14T12:03:19.305Z',
              updatedAt: '2025-12-14T12:03:19.305Z',
              deletedAt: null,
            },
          },
        },
      },
    },
  })
  async acceptRide(@Param('rideId') rideId: string, @Request() req) {
    const userId = req.user.sub;

    return await this.rideService.acceptRide(userId, rideId);
  }

  @Patch('start-ride/:rideId')
  @ApiOperation({ summary: 'Start a ride' })
  @ApiResponse({
    status: 201,
    description: 'Ride started successfully',
    schema: {
      example: {
        message: 'Ride started',
        data: {
          id: 'bd114316-0f52-4cff-952c-1dfa7440813b',
          riderId: 'a1a5c43c-957b-40a8-a0d7-e615d99fe7ad',
          driverId: '40678f34-cd79-4397-9203-47389f1e6243',
          vehicleId: 'c365d7a5-a714-40e6-859c-c319c30f0cd5',
          pickupLatitude: '6.514656',
          pickupLongitude: '3.490738',
          pickupAddress: 'Third Mainland Bridge',
          dropoffLatitude: '6.460058',
          dropoffLongitude: '3.459315',
          dropoffAddress: 'Banana Island, Eti Osa, Nigeria',
          startDateTime: '2026-01-04T21:27:34.827Z',
          endDateTime: null,
          status: 'ONGOING',
          fare: 1810.63,
          distance: '8.74',
          path_json: [],
          createdAt: '2026-01-04T21:18:45.873Z',
          updatedAt: '2026-01-04T21:27:34.830Z',
          driver: {
            id: '40678f34-cd79-4397-9203-47389f1e6243',
            user: {
              firstName: 'Tunde',
              lastName: 'Bakare',
              phone: '+2348022222222',
              avatar: null,
            },
            vehicle: {
              plateNumber: 'ABC-456-XY',
              model: {
                id: 'abcca413-b6ba-4d2d-a987-fcb454a314d6',
                manufacturerId: 'e64941b5-9202-48b5-b6d0-6cda53851317',
                name: 'Corolla',
                type: 'SEDAN',
                seats: 4,
                createdAt: '2025-12-19T18:42:18.114Z',
              },
              color: 'SILVER',
            },
          },
          rider: {
            id: 'a1a5c43c-957b-40a8-a0d7-e615d99fe7ad',
            user: {
              firstName: 'Jeremy',
              lastName: 'Doku',
              phone: '+12345678897',
              avatar: null,
            },
          },
        },
      },
    },
  })
  async startRide(@Param('rideId') rideId: string, @Request() req) {
    const userId = req.user.sub;

    return await this.rideService.startRide(userId, rideId);
  }

  @Patch('cancel-ride/:rideId')
  @ApiOperation({ summary: 'Cancel a ride' })
  @ApiResponse({
    status: 201,
    description: 'Ride canceled successfully',
    schema: {
      example: {
        message: 'Ride canceled',
        data: {
          id: '49c5345c-70d9-4f4c-a4b0-b41aef8f7b81',
          riderId: 'a1a5c43c-957b-40a8-a0d7-e615d99fe7ad',
          driverId: '40678f34-cd79-4397-9203-47389f1e6243',
          vehicleId: 'c365d7a5-a714-40e6-859c-c319c30f0cd5',
          pickupLatitude: '6.514656',
          pickupLongitude: '3.490738',
          pickupAddress: 'Third Mainland Bridge',
          dropoffLatitude: '6.460058',
          dropoffLongitude: '3.459315',
          dropoffAddress: 'Banana Island, Eti Osa, Nigeria',
          startDateTime: '2026-01-05T09:32:08.367Z',
          endDateTime: null,
          status: 'CANCELLED',
          fare: 1810.63,
          distance: '8.74',
          path_json: [],
          createdAt: '2026-01-05T09:31:21.969Z',
          updatedAt: '2026-01-05T09:33:40.345Z',
        },
      },
    },
  })
  async cancelRide(@Param('rideId') rideId: string, @Request() req) {
    const userId = req.user.sub;

    return await this.rideService.cancelRide(userId, rideId);
  }

  @Patch('complete-ride/:rideId')
  @ApiOperation({ summary: 'Complete a ride' })
  @ApiResponse({
    status: 201,
    description: 'Ride completed successfully',
    schema: {
      example: {
        message: 'Ride completed',
        data: {},
      },
    },
  })
  async completeRide(@Param('rideId') rideId: string, @Request() req) {
    const userId = req.user.sub;

    return await this.rideService.completeRide(userId, rideId);
  }
}
