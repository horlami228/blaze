import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { ZodValidationPipe } from 'nestjs-zod';
import { RideStatus, VehicleType, VehicleColor, Gender } from '@prisma/client';
import { RedisService } from 'src/redis/redis.service';
import { CloudflareR2Service } from '../src/common/cloudflare/cloudflare-r2.service';

describe('Ride (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let redis: RedisService;

  let riderToken: string;
  let driverToken: string;
  let driverId: string;
  let riderId: string;
  let rideId: string;

  const riderEmail = 'rider.e2e@example.com';
  const driverEmail = 'driver.e2e@example.com';
  const password = 'Pass123!';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(CloudflareR2Service)
      .useValue({
        uploadFile: jest.fn().mockResolvedValue('mock-key'),
        getPresignedDownloadUrl: jest
          .fn()
          .mockResolvedValue('http://mock-url.com'),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ZodValidationPipe());
    await app.init();

    prisma = app.get(PrismaService);
    redis = app.get(RedisService);

    // Cleanup
    const tables = [
      'User',
      'Rider',
      'Driver',
      'Vehicle',
      'VehicleModel',
      'VehicleManufacturer',
      'Ride',
    ];
    for (const table of tables) {
      await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${table}" CASCADE`);
    }
    await redis.client.flushall();

    // 1. Setup Rider
    await request(app.getHttpServer())
      .post('/api/v1/auth/register-rider')
      .send({
        email: riderEmail,
        password: password,
        firstName: 'Rider',
        lastName: 'E2E',
      })
      .expect(201);

    const riderLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: riderEmail, password });
    riderToken = riderLogin.body.data.token;
    riderId = riderLogin.body.data.user.id;

    // 2. Setup Driver
    await request(app.getHttpServer())
      .post('/api/v1/auth/register-driver')
      .send({
        email: driverEmail,
        password: password,
        firstName: 'Driver',
        lastName: 'E2E',
      })
      .expect(201);

    const driverLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: driverEmail, password });
    driverToken = driverLogin.body.data.token;
    driverId = driverLogin.body.data.user.id;

    // 3. Complete Driver Onboarding manually in DB for speed
    const dbDriver = await prisma.driver.findFirst({
      where: { userId: driverId },
    });
    const manufacturer = await prisma.vehicleManufacturer.create({
      data: { name: 'Toyota' },
    });
    const model = await prisma.vehicleModel.create({
      data: {
        name: 'Corolla',
        type: VehicleType.SEDAN,
        manufacturerId: manufacturer.id,
        seats: 4,
      },
    });

    await prisma.vehicle.create({
      data: {
        driverId: dbDriver.id,
        modelId: model.id,
        color: VehicleColor.WHITE,
        plateNumber: 'E2E-RIDE',
        year: 2022,
        exteriorPhoto: 'photo.jpg',
        interiorPhoto: 'photo.jpg',
      },
    });

    await prisma.driver.update({
      where: { id: dbDriver.id },
      data: { onboardingCompleted: true, onboardingStep: 3 },
    });
  });

  afterAll(async () => {
    // Final cleanup
    try {
      await prisma.$executeRawUnsafe(
        `TRUNCATE TABLE "User", "Rider", "Driver", "Vehicle", "VehicleModel", "VehicleManufacturer", "Ride" CASCADE`,
      );
      await redis.client.flushall();
    } catch (err) {
      console.error('Error during ride.e2e-spec.ts cleanup:', err.message);
    }

    await app.close();
  });

  describe('Full Ride Lifecycle', () => {
    it('should toggle driver online and update location', async () => {
      // Toggle Online
      const toggleRes = await request(app.getHttpServer())
        .patch('/api/v1/ride/toggle-availability')
        .set('Authorization', `Bearer ${driverToken}`)
        .expect(200);

      expect(toggleRes.body.data.isOnline).toBe(true);

      // Update Location (Lagoon, Lagos roughly)
      await request(app.getHttpServer())
        .post('/api/v1/ride/update-driver-location')
        .set('Authorization', `Bearer ${driverToken}`)
        .send({
          latitude: 6.45,
          longitude: 3.4,
          heading: 0,
          speed: 0,
        })
        .expect(201);
    });

    it('should request a ride as a rider', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/ride/request-ride')
        .set('Authorization', `Bearer ${riderToken}`)
        .send({
          pickupLatitude: 6.45,
          pickupLongitude: 3.4,
          pickupAddress: 'Lagos Island',
          dropoffLatitude: 6.5,
          dropoffLongitude: 3.45,
          dropoffAddress: 'Victoria Island',
        })
        .expect(201);

      expect(res.body.data.ride).toBeDefined();
      expect(res.body.data.ride.status).toBe(RideStatus.PENDING);
      rideId = res.body.data.ride.id;
    });

    it('should allow driver to accept the ride', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/ride/accept-ride/${rideId}`)
        .set('Authorization', `Bearer ${driverToken}`)
        .expect(200);

      expect(res.body.data.status).toBe(RideStatus.ACCEPTED);
    });

    it('should allow driver to start the ride', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/ride/start-ride/${rideId}`)
        .set('Authorization', `Bearer ${driverToken}`)
        .expect(200);

      expect(res.body.data.status).toBe(RideStatus.ONGOING);
    });

    it('should update driver location during ride (tracks path)', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/ride/update-driver-location')
        .set('Authorization', `Bearer ${driverToken}`)
        .send({
          latitude: 6.46,
          longitude: 3.41,
          heading: 45,
          speed: 20,
        })
        .expect(201);
    });

    it('should allow driver to complete the ride', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/ride/complete-ride/${rideId}`)
        .set('Authorization', `Bearer ${driverToken}`)
        .expect(200);

      expect(res.body.data.status).toBe(RideStatus.COMPLETED);
    });
  });

  describe('Edge Cases', () => {
    it('should not allow rider to request another ride while in one (if we had an ongoing one)', async () => {
      // Since we just completed one, let's try to request another one when we have a PENDING one

      // First, ensure driver is online and available (may have been removed after completing ride)
      // Toggle may turn driver offline if they were already online, so check response
      const toggleRes = await request(app.getHttpServer())
        .patch('/api/v1/ride/toggle-availability')
        .set('Authorization', `Bearer ${driverToken}`)
        .expect(200);

      // If toggled to offline, toggle back to online
      if (toggleRes.body.data.isOnline === false) {
        await request(app.getHttpServer())
          .patch('/api/v1/ride/toggle-availability')
          .set('Authorization', `Bearer ${driverToken}`)
          .expect(200);
      }

      await request(app.getHttpServer())
        .post('/api/v1/ride/update-driver-location')
        .set('Authorization', `Bearer ${driverToken}`)
        .send({
          latitude: 6.45,
          longitude: 3.4,
          heading: 0,
          speed: 0,
        })
        .expect(201);

      // 1. Request one
      const res1 = await request(app.getHttpServer())
        .post('/api/v1/ride/request-ride')
        .set('Authorization', `Bearer ${riderToken}`)
        .send({
          pickupLatitude: 6.45,
          pickupLongitude: 3.4,
          pickupAddress: 'A',
          dropoffLatitude: 6.5,
          dropoffLongitude: 3.45,
          dropoffAddress: 'B',
        })
        .expect(201);

      // 2. Request again immediately
      await request(app.getHttpServer())
        .post('/api/v1/ride/request-ride')
        .set('Authorization', `Bearer ${riderToken}`)
        .send({
          pickupLatitude: 6.45,
          pickupLongitude: 3.4,
          pickupAddress: 'A',
          dropoffLatitude: 6.5,
          dropoffLongitude: 3.45,
          dropoffAddress: 'B',
        })
        .expect(400); // Bad Request: You have a pending ride
    });
  });
});
