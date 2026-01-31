// import { Test, TestingModule } from '@nestjs/testing';
// import { INestApplication } from '@nestjs/common';
// import * as request from 'supertest';
// import { AppModule } from '../src/app.module';
// import { PrismaService } from '../src/prisma/prisma.service';
// import { RedisService } from 'src/redis/redis.service';
// import { ZodValidationPipe } from 'nestjs-zod';
// import { RideStatus, VehicleType, VehicleColor, Gender } from '@prisma/client';
// import { CloudflareR2Service } from '../src/common/cloudflare/cloudflare-r2.service';
// import { join } from 'path';
// import { writeFileSync, unlinkSync } from 'fs';

// describe('Integration Tests (e2e)', () => {
//   let app: INestApplication;
//   let prisma: PrismaService;
//   let redis: RedisService;

//   const testFile = join(__dirname, 'test-image.jpg');
//   const password = 'Pass123!';

//   // Helper for cleanup
//   const cleanup = async () => {
//     try {
//       await prisma.$executeRawUnsafe(
//         `TRUNCATE TABLE "Ride", "Vehicle", "VehicleModel", "VehicleManufacturer", "Driver", "Rider", "User" RESTART IDENTITY CASCADE`,
//       );
//       await redis.client.flushall();
//     } catch (err) {
//       console.error('Cleanup error:', err.message);
//     }
//   };

//   beforeAll(async () => {
//     // 1. Create dummy file for uploads
//     writeFileSync(testFile, 'dummy-content');

//     const moduleFixture: TestingModule = await Test.createTestingModule({
//       imports: [AppModule],
//     })
//       .overrideProvider(CloudflareR2Service)
//       .useValue({
//         uploadFile: jest.fn().mockResolvedValue('mock-key'),
//         getPresignedDownloadUrl: jest
//           .fn()
//           .mockResolvedValue('http://mock-url.com'),
//       })
//       .compile();

//     app = moduleFixture.createNestApplication();
//     app.useGlobalPipes(new ZodValidationPipe());
//     await app.init();

//     prisma = app.get(PrismaService);
//     redis = app.get(RedisService);

//     await cleanup();
//   });

//   afterAll(async () => {
//     await cleanup();
//     await app.close();
//     try {
//       unlinkSync(testFile);
//     } catch {}
//   });

//   describe('Auth (e2e)', () => {
//     it('POST /auth/register-rider creates a new rider', async () => {
//       const res = await request(app.getHttpServer())
//         .post('/api/v1/auth/register-rider')
//         .send({
//           email: 'auth-rider@example.com',
//           password: password,
//           firstName: 'Jane',
//           lastName: 'Doe',
//         })
//         .expect(201);

//       expect(res.body.token || res.body.data.token).toBeDefined();
//     });

//     it('POST /auth/register-driver creates a new driver', async () => {
//       const res = await request(app.getHttpServer())
//         .post('/api/v1/auth/register-driver')
//         .send({
//           email: 'auth-driver@example.com',
//           password: password,
//           firstName: 'Jane',
//           lastName: 'Doe',
//         })
//         .expect(201);

//       expect(res.body.token || res.body.data.token).toBeDefined();
//     });

//     it('POST /auth/login authenticates existing user', async () => {
//       const email = 'login-test@example.com';
//       await request(app.getHttpServer())
//         .post('/api/v1/auth/register-rider')
//         .send({ email, password, firstName: 'Jane', lastName: 'Doe' })
//         .expect(201);

//       const res = await request(app.getHttpServer())
//         .post('/api/v1/auth/login')
//         .send({ email, password })
//         .expect(201);

//       expect(res.body.data?.token).toBeDefined();
//       expect(res.body.data?.user?.email).toBe(email);
//     });
//   });

//   describe('Driver Onboarding & Profile (e2e)', () => {
//     let driverToken: string;
//     const email = 'driver.onboarding@example.com';

//     beforeAll(async () => {
//       await request(app.getHttpServer())
//         .post('/api/v1/auth/register-driver')
//         .send({ email, password, firstName: 'Driver', lastName: 'E2E' });

//       const loginRes = await request(app.getHttpServer())
//         .post('/api/v1/auth/login')
//         .send({ email, password });
//       driverToken = loginRes.body.data.token;
//     });

//     it('GET /api/v1/driver/onboarding/status returns initial status', async () => {
//       const res = await request(app.getHttpServer())
//         .get('/api/v1/driver/onboarding/status')
//         .set('Authorization', `Bearer ${driverToken}`)
//         .expect(200);
//       expect(res.body.data.currentStep).toBe(0);
//     });

//     it('POST /api/v1/driver/onboarding/personal-info updates driver info', async () => {
//       await request(app.getHttpServer())
//         .post('/api/v1/driver/onboarding/personal-info')
//         .set('Authorization', `Bearer ${driverToken}`)
//         .send({
//           phone: '1234567890',
//           firstName: 'Driver',
//           lastName: 'E2E',
//           gender: Gender.MALE,
//           dateOfBirth: '1990-01-01T00:00:00.000Z',
//         })
//         .expect(201);
//     });

//     it('POST /api/v1/driver/onboarding/driver-info updates license info', async () => {
//       await request(app.getHttpServer())
//         .post('/api/v1/driver/onboarding/driver-info')
//         .set('Authorization', `Bearer ${driverToken}`)
//         .attach('licensePhoto', testFile)
//         .attach('profilePhoto', testFile)
//         .field('licenseNumber', 'DL1234567890')
//         .expect(201);
//     });

//     it('POST /api/v1/driver/onboarding/vehicle-info completes onboarding', async () => {
//       const m = await prisma.vehicleManufacturer.create({
//         data: { name: 'Ford' },
//       });
//       const model = await prisma.vehicleModel.create({
//         data: { name: 'F150', type: VehicleType.TRUCK, manufacturerId: m.id },
//       });

//       await request(app.getHttpServer())
//         .post('/api/v1/driver/onboarding/vehicle-info')
//         .set('Authorization', `Bearer ${driverToken}`)
//         .attach('exteriorPhoto', testFile)
//         .attach('interiorPhoto', testFile)
//         .field('vehicleYear', 2022)
//         .field('vehicleColor', VehicleColor.BLACK)
//         .field('modelId', model.id)
//         .field('plateNumber', 'ABC-ONB-1')
//         .expect(201);

//       const statusRes = await request(app.getHttpServer())
//         .get('/api/v1/driver/onboarding/status')
//         .set('Authorization', `Bearer ${driverToken}`);
//       expect(statusRes.body.data.isComplete).toBe(true);
//     });

//     it('GET /api/v1/driver/profile returns full driver profile', async () => {
//       const res = await request(app.getHttpServer())
//         .get('/api/v1/driver/profile')
//         .set('Authorization', `Bearer ${driverToken}`)
//         .expect(200);
//       expect(res.body.data.driver.licenseNumber).toBe('DL1234567890');
//     });
//   });

//   describe('Ride Lifecycle (e2e)', () => {
//     let riderToken: string;
//     let driverToken: string;
//     let driverId: string;
//     let rideId: string;

//     const riderEmail = 'ride.rider@example.com';
//     const driverEmail = 'ride.driver@example.com';

//     beforeAll(async () => {
//       // Setup Rider
//       await request(app.getHttpServer())
//         .post('/api/v1/auth/register-rider')
//         .send({
//           email: riderEmail,
//           password,
//           firstName: 'Rider',
//           lastName: 'E2E',
//         });
//       const rLogin = await request(app.getHttpServer())
//         .post('/api/v1/auth/login')
//         .send({ email: riderEmail, password });
//       riderToken = rLogin.body.data.token;

//       // Setup Driver
//       await request(app.getHttpServer())
//         .post('/api/v1/auth/register-driver')
//         .send({
//           email: driverEmail,
//           password,
//           firstName: 'Driver',
//           lastName: 'E2E',
//         });
//       const dLogin = await request(app.getHttpServer())
//         .post('/api/v1/auth/login')
//         .send({ email: driverEmail, password });
//       driverToken = dLogin.body.data.token;
//       driverId = dLogin.body.data.user.id;

//       // Complete Driver Onboarding manually
//       const dbDriver = await prisma.driver.findFirst({
//         where: { userId: driverId },
//       });
//       const manufacturer = await prisma.vehicleManufacturer.upsert({
//         where: { name: 'Toyota' },
//         update: {},
//         create: { name: 'Toyota' },
//       });
//       const model = await prisma.vehicleModel.upsert({
//         where: {
//           manufacturerId_name: {
//             name: 'Corolla',
//             manufacturerId: manufacturer.id,
//           },
//         },
//         update: {},
//         create: {
//           name: 'Corolla',
//           type: VehicleType.SEDAN,
//           manufacturerId: manufacturer.id,
//           seats: 4,
//         },
//       });
//       await prisma.vehicle.create({
//         data: {
//           driverId: dbDriver.id,
//           modelId: model.id,
//           color: VehicleColor.WHITE,
//           plateNumber: 'RIDE-E2E-1',
//           year: 2022,
//           exteriorPhoto: 'p.jpg',
//           interiorPhoto: 'p.jpg',
//         },
//       });
//       await prisma.driver.update({
//         where: { id: dbDriver.id },
//         data: { onboardingCompleted: true, onboardingStep: 3 },
//       });
//     });

//     it('should toggle driver online and update location', async () => {
//       await request(app.getHttpServer())
//         .patch('/api/v1/ride/toggle-availability')
//         .set('Authorization', `Bearer ${driverToken}`)
//         .expect(200);

//       await request(app.getHttpServer())
//         .post('/api/v1/ride/update-driver-location')
//         .set('Authorization', `Bearer ${driverToken}`)
//         .send({ latitude: 6.45, longitude: 3.4, heading: 0, speed: 0 })
//         .expect(201);
//     });

//     it('should request a ride as a rider', async () => {
//       const res = await request(app.getHttpServer())
//         .post('/api/v1/ride/request-ride')
//         .set('Authorization', `Bearer ${riderToken}`)
//         .send({
//           pickupLatitude: 6.45,
//           pickupLongitude: 3.4,
//           pickupAddress: 'A',
//           dropoffLatitude: 6.5,
//           dropoffLongitude: 3.45,
//           dropoffAddress: 'B',
//         })
//         .expect(201);
//       rideId = res.body.data.ride.id;
//       expect(res.body.data.ride.status).toBe(RideStatus.PENDING);
//     });

//     it('driver accepts, starts, updates location, and completes ride', async () => {
//       // Accept
//       await request(app.getHttpServer())
//         .patch(`/api/v1/ride/accept-ride/${rideId}`)
//         .set('Authorization', `Bearer ${driverToken}`)
//         .expect(200);

//       // Start
//       await request(app.getHttpServer())
//         .patch(`/api/v1/ride/start-ride/${rideId}`)
//         .set('Authorization', `Bearer ${driverToken}`)
//         .expect(200);

//       // Update location
//       await request(app.getHttpServer())
//         .post('/api/v1/ride/update-driver-location')
//         .set('Authorization', `Bearer ${driverToken}`)
//         .send({ latitude: 6.46, longitude: 3.41, heading: 45, speed: 20 })
//         .expect(201);

//       // Complete
//       const res = await request(app.getHttpServer())
//         .patch(`/api/v1/ride/complete-ride/${rideId}`)
//         .set('Authorization', `Bearer ${driverToken}`)
//         .expect(200);
//       expect(res.body.data.status).toBe(RideStatus.COMPLETED);
//     });

//     it('should not allow rider to request another ride while in one', async () => {
//       // 1. Request one
//       await request(app.getHttpServer())
//         .post('/api/v1/ride/request-ride')
//         .set('Authorization', `Bearer ${riderToken}`)
//         .send({
//           pickupLatitude: 6.45,
//           pickupLongitude: 3.4,
//           pickupAddress: 'A',
//           dropoffLatitude: 6.5,
//           dropoffLongitude: 3.45,
//           dropoffAddress: 'B',
//         })
//         .expect(201);

//       // 2. Request again immediately (pending)
//       await request(app.getHttpServer())
//         .post('/api/v1/ride/request-ride')
//         .set('Authorization', `Bearer ${riderToken}`)
//         .send({
//           pickupLatitude: 6.45,
//           pickupLongitude: 3.4,
//           pickupAddress: 'A',
//           dropoffLatitude: 6.5,
//           dropoffLongitude: 3.45,
//           dropoffAddress: 'B',
//         })
//         .expect(400);
//     });
//   });
// });

describe('Auth (e2e)', () => {
  it('POST /auth/register-rider creates a new rider', async () => {});
});
