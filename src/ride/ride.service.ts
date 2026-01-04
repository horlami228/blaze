import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { PinoLogger } from 'nestjs-pino';
import { RedisService } from 'src/redis/redis.service';
import { Driver, RideStatus } from '@prisma/client';
import { UpdateDriverLocationDto } from 'src/driver/dto/update-driver-location-dto';
import { RequestRideDto } from './dto/request-ride-dto';
import { RidesGateway } from './rides.gateway';
@Injectable()
export class RideService {
  private readonly BASE_FARE = 500; // Base fare in your currency
  private readonly PER_KM_RATE = 150; // Rate per kilometer
  private readonly SEARCH_RADIUS_LEVELS = [3, 5, 10, 15]; // km
  private readonly FIVE_MINUTES_AGO = new Date(Date.now() - 5 * 60 * 1000);

  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: PinoLogger,
    private readonly redis: RedisService,
    private readonly rideGateway: RidesGateway,
  ) {
    this.logger.setContext(RideService.name);
  }

  async updateDriverLocation(userId: string, dto: UpdateDriverLocationDto) {
    this.logger.info({ userId }, 'Updating driver location');

    const driver = await this.prisma.driver.findFirst({
      where: { userId, deletedAt: null },
    });

    if (!driver) {
      throw new NotFoundException('Driver not found');
    }

    // store in redis geospatial index
    await this.redis.client.geoadd(
      'available_drivers',
      dto.longitude,
      dto.latitude,
      driver.id,
    );

    // store metadata and set expiry

    await this.redis.client
      .pipeline()
      .hset(`driver:${driver.id}:location`, dto)
      .expire(`driver:${driver.id}:location`, 1000)
      .exec();

    // update db every 30 seconds
    const lockKey = `driver:${driver.id}:db-lock`;
    const isLocked = await this.redis.client.get(lockKey);

    if (!isLocked) {
      await this.prisma.driver.update({
        where: { id: driver.id },
        data: {
          lastKnownLatitude: dto.latitude,
          lastKnownLongitude: dto.longitude,
          lastLocationUpdate: new Date(),
        },
      });
      await this.redis.client.setex(lockKey, 30, 'locked');
    }

    // // if driver has active ride store in ride path
    const activeRide = await this.getActiveRideForDriver(driver.id);

    if (activeRide) {
      const pathKey = `ride:${activeRide.id}:path`;
      const now = Date.now(); // Current timestamp in milliseconds
      const lastSavedTsKey = `ride:${activeRide.id}:last_saved_ts`;

      const newPoint = {
        latitude: dto.latitude,
        longitude: dto.longitude,
        timestamp: now,
      };

      // ZADD: Add point to the Sorted Set using the timestamp as the score
      await this.redis.client.zadd(pathKey, now, JSON.stringify(newPoint));

      // remove everything from index 0 to (total - 1001)
      await this.redis.client.zremrangebyrank(pathKey, 0, -1001);

      // get timestamp of last db save
      const lastSavedTs = (await this.redis.client.get(lastSavedTsKey)) || 0;

      // get how many points since last timestamp
      const newPointsCount = await this.redis.client.zcount(
        pathKey,
        `(${lastSavedTs}`,
        '+inf',
      );

      // check if the total count is a multiple of 20.
      if (newPointsCount >= 20) {
        // Get the last 20 points that are newer than saved timestamp
        const pointsToSave = await this.redis.client.zrangebyscore(
          pathKey,
          `(${lastSavedTs}`,
          '+inf',
          'LIMIT',
          0,
          20,
        );

        // convert to json string
        const jsonString = `[${pointsToSave.join(',')}]`;

        // RAW SQL query to append ride path to ride path_json
        await this.prisma.$executeRaw`
        UPDATE "Ride" 
        SET "path_json" = COALESCE("path_json", '[]'::jsonb) || ${jsonString}::jsonb
        WHERE "id" = ${activeRide.id}
        `;

        // Update to timestamp of the LAST point in our saved batch
        const lastPoint = JSON.parse(pointsToSave[pointsToSave.length - 1]);
        await this.redis.client.set(lastSavedTsKey, lastPoint.timestamp);
      }

      // Set expiry to 1 hour (refreshes on every ping)
      await this.redis.client.expire(pathKey, 3600);
    }

    return {
      message: 'Driver location updated successfully',
    };
  }

  // Toggle driver availability
  async toggleDriverAvailability(userId: string) {
    this.logger.info({ userId }, 'Toggling diver availability');

    const driver = await this.prisma.driver.findFirst({
      where: {
        userId,
        deletedAt: null,
      },
    });

    if (!driver) {
      this.logger.error({ userId }, 'Driver not found');
      throw new NotFoundException('Driver not found');
    }

    if (!driver.onboardingCompleted) {
      this.logger.error({ userId }, 'Driver onboarding not completed');
      throw new BadRequestException('Complete onboarding before going online');
    }

    let updatedDriver: Driver;

    const newStatus = !driver.isOnline;

    if (newStatus === true) {
      // going online
      const isLocationFresh = driver.lastLocationUpdate > this.FIVE_MINUTES_AGO;
      this.logger.info(
        { userId, time: driver.lastLocationUpdate },
        'Driver location fresh: ' + isLocationFresh,
      );

      if (
        driver.lastKnownLatitude &&
        driver.lastKnownLongitude &&
        isLocationFresh
      ) {
        await this.redis.client.geoadd(
          'available_drivers',
          Number(driver.lastKnownLongitude),
          Number(driver.lastKnownLatitude),
          driver.id,
        );
      } else {
        this.logger.warn(
          { userId },
          'Driver location not fresh. Waiting for fresh ping',
        );
      }
    } else {
      // driver is  going offline
      const activeRides = await this.getActiveRideForDriver(driver.id);
      // check if driver has active rides
      if (activeRides) {
        this.logger.error({ userId }, 'Driver has active ride');
        throw new BadRequestException('Driver has active ride');
      }
      await this.redis.client.zrem('available_drivers', driver.id);
    }

    // fallback mechanism if update fails
    try {
      updatedDriver = await this.prisma.driver.update({
        where: { id: driver.id },
        data: {
          isOnline: newStatus,
        },
      });
    } catch (error) {
      this.logger.error(
        { userId },
        'Failed to update driver availability, Rolling back Redis',
      );
      if (newStatus === true) {
        // tried going online but failed
        await this.redis.client.zrem('available_drivers', driver.id);
      } else {
        // tried going offline but failed
        await this.redis.client.geoadd(
          'available_drivers',
          Number(driver.lastKnownLongitude),
          Number(driver.lastKnownLatitude),
          driver.id,
        );
      }
      throw new InternalServerErrorException(
        'Failed to update driver availability',
      );
    }

    if (newStatus === false) {
      await this.setDriverOffline(driver.id);
    }

    return {
      message: `Driver is now ${updatedDriver.isOnline ? 'online' : 'offline'}`,
      data: { isOnline: updatedDriver.isOnline },
    };
  }

  // request ride
  async requestRide(userId: string, dto: RequestRideDto) {
    this.logger.info({ userId }, 'Requesting ride');
    const rider = await this.prisma.rider.findFirst({
      where: {
        userId,
        deletedAt: null,
      },
    });
    if (!rider) {
      this.logger.error({ userId }, 'Rider not found');
      throw new NotFoundException('Rider not found');
    }

    // check if rider has a pending/active ride
    const pendingRide = await this.prisma.ride.findFirst({
      where: {
        riderId: rider.id,
        status: {
          in: [RideStatus.PENDING, RideStatus.ACCEPTED, RideStatus.ONGOING],
        },
      },
    });
    if (pendingRide) {
      this.logger.error({ userId }, 'Rider has a pending ride');
      throw new BadRequestException('You have a pending ride');
    }

    // calculate the estimated fare
    const straightLineDistance = this.calculateDistance(
      Number(dto.pickupLongitude),
      Number(dto.pickupLatitude),
      Number(dto.dropoffLatitude),
      Number(dto.dropoffLongitude),
    );
    // add 25% to the straight line distance to account for traffic
    const estiamtedRoadDistance = straightLineDistance * 1.25;

    const estimatedFare = this.calculateFare(estiamtedRoadDistance);

    // find nearby drivers
    const nearbyDrivers = await this.findNearbyDrivers(
      Number(dto.pickupLatitude),
      Number(dto.pickupLongitude),
    );

    this.logger.debug(
      { userId, driverLength: nearbyDrivers.length, drivers: nearbyDrivers },
      'Nearby drivers found',
    );

    if (!nearbyDrivers || nearbyDrivers.length === 0) {
      this.logger.error({ userId }, 'No nearby drivers found');
      throw new NotFoundException('No nearby drivers found');
    }

    // create ride request
    //TODO: Assign to closest driver for now
    const ride = await this.prisma.ride.create({
      data: {
        riderId: rider.id,
        driverId: nearbyDrivers[0].id,
        vehicleId: nearbyDrivers[0].vehicle.id,
        pickupLatitude: dto.pickupLatitude,
        pickupLongitude: dto.pickupLongitude,
        pickupAddress: dto.pickupAddress,
        dropoffLatitude: dto.dropoffLatitude,
        dropoffLongitude: dto.dropoffLongitude,
        dropoffAddress: dto.dropoffAddress,
        startDateTime: new Date(),
        status: RideStatus.PENDING,
        fare: estimatedFare,
        distance: estiamtedRoadDistance,
      },
      include: {
        driver: {
          include: {
            user: true,
            vehicle: {
              include: {
                model: {
                  include: { manufacturer: true },
                },
              },
            },
          },
        },
        rider: {
          include: { user: true },
        },
      },
    });

    this.logger.info(
      { rideId: ride.id, driverId: ride.driverId },
      'Ride Created and assigned',
    );

    // send ride notification to driver so the can accept it
    this.rideGateway.sendNewRideNotification(ride.driver.user.id, ride);

    return {
      message: 'Ride created and assigned',
      data: { ride, estiamtedRoadDistance, estimatedFare },
    };
  }

  // accept a ride
  async acceptRide(userId: string, rideId: string) {
    this.logger.info({ userId, rideId }, 'Accepting ride');

    const driver = await this.prisma.driver.findFirst({
      where: { userId, deletedAt: null },
    });
    if (!driver) {
      this.logger.error({ userId }, 'Driver not found');
      throw new NotFoundException('Driver not found');
    }
    const ride = await this.prisma.ride.findUnique({
      where: { id: rideId },
      include: { driver: true, rider: { include: { user: true } } },
    });

    if (!ride) {
      this.logger.error({ rideId }, 'Ride not found');
      throw new NotFoundException('Ride not found');
    }

    if (ride.driverId !== driver.id) {
      this.logger.error(
        { rideId, driverId: ride.driverId, userId },
        'Driver does not match',
      );
      throw new BadRequestException('Driver does not match');
    }

    if (ride.status != RideStatus.PENDING) {
      this.logger.error({ rideId, status: ride.status }, 'Ride is not pending');
      throw new BadRequestException('Ride is not pending');
    }

    const updatedRide = await this.prisma.ride.update({
      where: { id: rideId },
      data: { status: RideStatus.ACCEPTED },
      include: {
        driver: { include: { user: true, vehicle: true } },
        rider: { include: { user: true } },
      },
    });

    return {
      message: 'Ride accepted',
      data: updatedRide,
    };
  }

  // HELPER METHODS
  private async getActiveRideForDriver(driverId: string) {
    return await this.prisma.ride.findFirst({
      where: {
        driverId,
        status: {
          in: [RideStatus.PENDING, RideStatus.ACCEPTED, RideStatus.ONGOING],
        },
      },
    });
  }

  private calculateDistance(
    pickupLongitude: number,
    pickupLatitude: number,
    dropoffLatitude: number,
    dropoffLongitude: number,
  ) {
    // Haversine formula to calculate the distance between two cordinates
    const R = 6371; // Radius of the Earth in kilometers
    const lat1 = pickupLatitude;
    const lon1 = pickupLongitude;
    const lat2 = dropoffLatitude;
    const lon2 = dropoffLongitude;
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return Math.round(distance * 100) / 100;
  }

  private toRadians(degrees: number) {
    return degrees * (Math.PI / 180);
  }

  private calculateFare(distanceKm: number): number {
    const fare = this.BASE_FARE + distanceKm * this.PER_KM_RATE;
    return Math.round(fare * 100) / 100;
  }

  private async setDriverOffline(driverId: string) {
    this.logger.info({ driverId }, 'Setting driver offline');
    await this.redis.client
      .pipeline()
      .del(`driver:${driverId}:status`)
      .del(`driver:${driverId}:location`)
      .exec();
  }

  private async findNearbyDrivers(latitude: number, longitude: number) {
    const maxRadius = Math.max(...this.SEARCH_RADIUS_LEVELS);

    // Returns [[driverId, distance], [driverId, distance], ...]
    // Note: georadius arguments: key, longitude, latitude, radius, unit, "WITHDIST", "ASC"
    const driversWithDistance: [string, string][] =
      (await this.redis.client.georadius(
        'available_drivers',
        longitude,
        latitude,
        maxRadius,
        'km',
        'WITHDIST',
        'ASC',
      )) as [string, string][];

    if (!driversWithDistance || driversWithDistance.length === 0) {
      return [];
    }

    // Create a map for quick distance lookups
    const driverDistances = new Map<string, number>();
    const driverIds = driversWithDistance.map(([id, distance]) => {
      driverDistances.set(id, parseFloat(distance));
      return id;
    });

    // Fetch full driver details from Postgres
    const drivers = await this.prisma.driver.findMany({
      where: {
        id: { in: driverIds },
        isOnline: true,
        onboardingCompleted: true,
        deletedAt: null,
      },
      include: {
        vehicle: {
          include: {
            model: { include: { manufacturer: true } },
          },
        },
        user: true,
      },
    });

    // Attach distance and sort
    return drivers
      .map((driver) => ({
        ...driver,
        distanceFromPickUp: driverDistances.get(driver.id) || 0,
      }))
      .sort((a, b) => a.distanceFromPickUp - b.distanceFromPickUp);
  }
}
