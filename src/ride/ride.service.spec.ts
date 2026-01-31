import { Test, TestingModule } from '@nestjs/testing';
import { RideService } from './ride.service';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { RidesGateway } from './rides.gateway';
import { PinoLogger } from 'nestjs-pino';
import {
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { RideStatus, VehicleColor, Gender } from '@prisma/client';
import { UpdateDriverLocationDto } from 'src/driver/dto/update-driver-location-dto';
import { RequestRideDto } from './dto/request-ride-dto';

describe('RideService', () => {
  let service: RideService;
  let prismaService: any;
  let redisService: any;
  let ridesGateway: any;

  const mockLogger = {
    setContext: jest.fn(),
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  };

  const mockPipeline = {
    hset: jest.fn().mockReturnThis(),
    expire: jest.fn().mockReturnThis(),
    zrem: jest.fn().mockReturnThis(),
    del: jest.fn().mockReturnThis(),
    exists: jest.fn().mockReturnThis(),
    exec: jest.fn(),
  };

  const mockRedisClient = {
    geoadd: jest.fn(),
    pipeline: jest.fn().mockReturnValue(mockPipeline),
    get: jest.fn(),
    setex: jest.fn(),
    zadd: jest.fn(),
    zrem: jest.fn(),
    del: jest.fn(),
    zremrangebyrank: jest.fn(),
    zcount: jest.fn(),
    zrangebyscore: jest.fn(),
    set: jest.fn(),
    georadius: jest.fn(),
    expire: jest.fn(),
  };

  const mockPrismaService = {
    driver: {
      findFirst: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
    ride: {
      findFirst: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    rider: {
      findFirst: jest.fn(),
    },
    $executeRaw: jest.fn(),
  };

  const mockRidesGateway = {
    sendNewRideNotification: jest.fn(),
    emitDriverLocationUpdate: jest.fn(),
    emitRideStatusUpdate: jest.fn(),
  };

  const mockDriver = {
    id: 'driver-1',
    userId: 'user-1',
    isOnline: false,
    onboardingCompleted: true,
    lastLocationUpdate: new Date(),
    lastKnownLatitude: 6.5,
    lastKnownLongitude: 3.5,
    walletBalance: 0,
    vehicle: {
      id: 'vehicle-1',
      model: {
        manufacturer: {
          name: 'Toyota',
        },
      },
    },
    user: {
      id: 'user-1',
      firstName: 'John',
      lastName: 'Doe',
    },
  };

  const mockRider = {
    id: 'rider-1',
    userId: 'user-2',
    user: {
      firstName: 'Jane',
      lastName: 'Doe',
    },
  };

  const mockRide = {
    id: 'ride-1',
    driverId: 'driver-1',
    riderId: 'rider-1',
    status: RideStatus.PENDING,
    driver: mockDriver,
    rider: mockRider,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RideService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: RedisService, useValue: { client: mockRedisClient } },
        { provide: PinoLogger, useValue: mockLogger },
        { provide: RidesGateway, useValue: mockRidesGateway },
      ],
    }).compile();

    service = module.get<RideService>(RideService);
    prismaService = module.get(PrismaService);
    redisService = module.get(RedisService);
    ridesGateway = module.get(RidesGateway);

    jest.clearAllMocks();
    mockPipeline.exec.mockResolvedValue([]);
  });

  describe('updateDriverLocation', () => {
    const dto: UpdateDriverLocationDto = {
      latitude: 6.52,
      longitude: 3.52,
      heading: 90,
      speed: 10,
    };

    it('should update driver location successfully', async () => {
      mockPrismaService.driver.findFirst.mockResolvedValue(mockDriver);
      mockRedisClient.get.mockResolvedValue(null); // Lock key check

      const result = await service.updateDriverLocation('user-1', dto);

      expect(result.message).toBe('Driver location updated successfully');
      expect(mockRedisClient.geoadd).toHaveBeenCalledWith(
        'available_drivers',
        dto.longitude,
        dto.latitude,
        mockDriver.id,
      );
      expect(mockPipeline.hset).toHaveBeenCalled();
      expect(mockPrismaService.driver.update).toHaveBeenCalled();
    });

    it('should throw NotFoundException if driver not found', async () => {
      mockPrismaService.driver.findFirst.mockResolvedValue(null);

      await expect(service.updateDriverLocation('user-1', dto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should update ride path if active ride exists', async () => {
      mockPrismaService.driver.findFirst.mockResolvedValue(mockDriver);
      mockPrismaService.ride.findFirst.mockResolvedValue({
        ...mockRide,
        status: RideStatus.ONGOING,
      });
      mockRedisClient.get.mockResolvedValue(null); // Lock key
      mockRedisClient.zcount.mockResolvedValue(25); // Enough points to save
      mockRedisClient.zrangebyscore.mockResolvedValue([
        JSON.stringify({ latitude: 1, longitude: 1, timestamp: 123456789 }),
      ]);

      await service.updateDriverLocation('user-1', dto);

      expect(mockRedisClient.zadd).toHaveBeenCalled(); // Adding point
      expect(mockPrismaService.$executeRaw).toHaveBeenCalled(); // Saving to DB
    });
  });

  describe('toggleDriverAvailability', () => {
    it('should toggle driver to online', async () => {
      mockPrismaService.driver.findFirst.mockResolvedValue({
        ...mockDriver,
        isOnline: false,
        lastKnownLatitude: 6.5,
        lastKnownLongitude: 3.5,
      });
      mockPrismaService.driver.update.mockResolvedValue({
        ...mockDriver,
        isOnline: true,
      });
      mockRedisClient.geoadd.mockResolvedValue(1);

      const result = await service.toggleDriverAvailability('user-1');

      expect(result.data.isOnline).toBe(true);
      expect(mockRedisClient.geoadd).toHaveBeenCalled();
      expect(mockPrismaService.driver.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockDriver.id },
          data: { isOnline: true },
        }),
      );
    });

    it('should toggle driver to offline', async () => {
      mockPrismaService.driver.findFirst.mockResolvedValue({
        ...mockDriver,
        isOnline: true,
      });
      mockPrismaService.ride.findFirst.mockResolvedValue(null); // No active rides
      mockPrismaService.driver.update.mockResolvedValue({
        ...mockDriver,
        isOnline: false,
      });

      const result = await service.toggleDriverAvailability('user-1');

      expect(result.data.isOnline).toBe(false);
      expect(mockPipeline.zrem).toHaveBeenCalledWith(
        'available_drivers',
        mockDriver.id,
      );
    });

    it('should throw BadRequestException if going offline with active ride', async () => {
      mockPrismaService.driver.findFirst.mockResolvedValue({
        ...mockDriver,
        isOnline: true,
      });
      mockPrismaService.ride.findFirst.mockResolvedValue(mockRide); // Active ride

      await expect(service.toggleDriverAvailability('user-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if onboarding not complete', async () => {
      mockPrismaService.driver.findFirst.mockResolvedValue({
        ...mockDriver,
        onboardingCompleted: false,
      });

      await expect(service.toggleDriverAvailability('user-1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('requestRide', () => {
    const dto: RequestRideDto = {
      pickupLatitude: 6.5,
      pickupLongitude: 3.5,
      pickupAddress: 'Pickup',
      dropoffLatitude: 6.6,
      dropoffLongitude: 3.6,
      dropoffAddress: 'Dropoff',
    };

    it('should create a ride request successfully', async () => {
      mockPrismaService.rider.findFirst.mockResolvedValue(mockRider);
      mockPrismaService.ride.findFirst.mockResolvedValue(null); // No pending ride
      // Mock finding drivers
      mockRedisClient.georadius.mockResolvedValue([
        [mockDriver.id, '1.5'], // id, distance
      ]);
      mockPipeline.exec.mockResolvedValue([[null, 1]]); // Heartbeat exists
      mockPrismaService.driver.findMany.mockResolvedValue([mockDriver]);

      mockPrismaService.ride.create.mockResolvedValue(mockRide);

      const result = await service.requestRide(mockRider.userId, dto);

      expect(result.message).toBe('Ride created and assigned');
      expect(mockPrismaService.ride.create).toHaveBeenCalled();
      expect(ridesGateway.sendNewRideNotification).toHaveBeenCalledWith(
        mockDriver.user.id,
        mockRide,
      );
    });

    it('should throw NotFoundException if no drivers found', async () => {
      mockPrismaService.rider.findFirst.mockResolvedValue(mockRider);
      mockPrismaService.ride.findFirst.mockResolvedValue(null);
      mockRedisClient.georadius.mockResolvedValue([]); // No drivers in redis

      await expect(service.requestRide(mockRider.userId, dto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException if rider has pending ride', async () => {
      mockPrismaService.rider.findFirst.mockResolvedValue(mockRider);
      mockPrismaService.ride.findFirst.mockResolvedValue(mockRide);

      await expect(service.requestRide(mockRider.userId, dto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('acceptRide', () => {
    it('should accept ride successfully', async () => {
      mockPrismaService.driver.findFirst.mockResolvedValue(mockDriver);
      mockPrismaService.ride.findUnique.mockResolvedValue(mockRide);
      mockPrismaService.ride.update.mockResolvedValue({
        ...mockRide,
        status: RideStatus.ACCEPTED,
      });

      const result = await service.acceptRide(mockDriver.userId, mockRide.id);

      expect(result.message).toBe('Ride accepted');
      expect(mockPrismaService.ride.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockRide.id },
          data: { status: RideStatus.ACCEPTED },
        }),
      );
    });

    it('should apply validation checks', async () => {
      mockPrismaService.driver.findFirst.mockResolvedValue(mockDriver);

      // Driver mismatch
      mockPrismaService.ride.findUnique.mockResolvedValue({
        ...mockRide,
        driverId: 'other-driver',
      });
      await expect(
        service.acceptRide(mockDriver.userId, mockRide.id),
      ).rejects.toThrow(BadRequestException);

      // Ride not pending
      mockPrismaService.ride.findUnique.mockResolvedValue({
        ...mockRide,
        status: RideStatus.CANCELLED,
      });
      await expect(
        service.acceptRide(mockDriver.userId, mockRide.id),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('startRide', () => {
    it('should start ride successfully', async () => {
      mockPrismaService.driver.findFirst.mockResolvedValue(mockDriver);
      mockPrismaService.ride.findUnique.mockResolvedValue({
        ...mockRide,
        status: RideStatus.ACCEPTED,
      });
      mockPrismaService.ride.update.mockResolvedValue({
        ...mockRide,
        status: RideStatus.ONGOING,
      });

      const result = await service.startRide(mockDriver.userId, mockRide.id);

      expect(result.message).toBe('Ride started');
    });

    it('should fail if ride not accepted', async () => {
      mockPrismaService.driver.findFirst.mockResolvedValue(mockDriver);
      mockPrismaService.ride.findUnique.mockResolvedValue({
        ...mockRide,
        status: RideStatus.PENDING,
      });

      await expect(
        service.startRide(mockDriver.userId, mockRide.id),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('completeRide', () => {
    it('should complete ride successfully', async () => {
      mockPrismaService.driver.findFirst.mockResolvedValue(mockDriver);
      mockPrismaService.ride.findUnique.mockResolvedValue({
        ...mockRide,
        status: RideStatus.ONGOING,
      });
      mockPrismaService.ride.update.mockResolvedValue({
        ...mockRide,
        status: RideStatus.COMPLETED,
      });

      const result = await service.completeRide(mockDriver.userId, mockRide.id);
      expect(result.message).toBe('Ride completed');
    });

    it('should fail if ride is not ongoing', async () => {
      mockPrismaService.driver.findFirst.mockResolvedValue(mockDriver);
      mockPrismaService.ride.findUnique.mockResolvedValue({
        ...mockRide,
        status: RideStatus.ACCEPTED,
      });

      await expect(
        service.completeRide(mockDriver.userId, mockRide.id),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('cancelRide', () => {
    it('should cancel ride successfully', async () => {
      mockPrismaService.driver.findFirst.mockResolvedValue(mockDriver);
      mockPrismaService.ride.findUnique.mockResolvedValue({
        ...mockRide,
        status: RideStatus.ACCEPTED,
      });
      mockPrismaService.ride.update.mockResolvedValue({
        ...mockRide,
        status: RideStatus.CANCELLED,
      });

      const result = await service.cancelRide(mockDriver.userId, mockRide.id);
      expect(result.message).toBe('Ride canceled');
    });
  });
});
