import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { Gender, VehicleColor, VehicleType } from '@prisma/client';
import { join } from 'path';
import { writeFileSync, unlinkSync } from 'fs';
import { ZodValidationPipe } from 'nestjs-zod';

describe('Driver (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;
  let userId: string;

  const testFile = join(__dirname, 'test-image.jpg');

  beforeAll(async () => {
    // Create a dummy file for testing uploads
    writeFileSync(testFile, 'dummy-content');

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ZodValidationPipe());
    await app.init();

    prisma = app.get(PrismaService);

    await prisma.$executeRawUnsafe(
      `TRUNCATE TABLE "User", "Driver", "Vehicle", "VehicleModel", "VehicleManufacturer" CASCADE`,
    );

    // Register and login a driver to get a token
    const email = 'driver.e2e@example.com';
    const password = 'Pass123!';

    await request(app.getHttpServer())
      .post('/api/v1/auth/register-driver')
      .send({
        email,
        password,
        firstName: 'Driver',
        lastName: 'E2E',
      });

    const loginRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email, password });

    authToken = loginRes.body.data.token;
    userId = loginRes.body.data.user.id;
  });

  afterAll(async () => {
    // Cleanup relevant tables
    await prisma.$executeRawUnsafe(
      `TRUNCATE TABLE "User", "Driver", "Vehicle", "VehicleModel", "VehicleManufacturer" CASCADE`,
    );
    await app.close();
    unlinkSync(testFile);
  });

  it('GET /api/v1/driver/onboarding/status returns initial status', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/driver/onboarding/status')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(res.body.data.currentStep).toBe(0);
    expect(res.body.data.isComplete).toBe(false);
  });

  it('POST /api/v1/driver/onboarding/personal-info updates driver info', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/driver/onboarding/personal-info')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        phone: '1234567890',
        firstName: 'Driver',
        lastName: 'E2E',
        gender: Gender.MALE,
        dateOfBirth: '1990-01-01T00:00:00.000Z',
      })
      .expect(201);

    expect(res.body.data.user.phone).toBe('1234567890');

    // Verify step updated
    const statusRes = await request(app.getHttpServer())
      .get('/api/v1/driver/onboarding/status')
      .set('Authorization', `Bearer ${authToken}`);
    expect(statusRes.body.data.currentStep).toBe(1);
  });

  it('POST /api/v1/driver/onboarding/driver-info updates license info and photos', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/driver/onboarding/driver-info')
      .set('Authorization', `Bearer ${authToken}`)
      .attach('licensePhoto', testFile)
      .attach('profilePhoto', testFile)
      .field('licenseNumber', 'DL1234567890')
      .expect(201);

    expect(res.body.statusCode).toBe(200);
    expect(res.body.data.driver.licenseNumber).toBe('DL1234567890');

    const statusRes = await request(app.getHttpServer())
      .get('/api/v1/driver/onboarding/status')
      .set('Authorization', `Bearer ${authToken}`);
    expect(statusRes.body.data.currentStep).toBe(2);
  });

  it('GET /api/v1/driver/manufacturers and /models lists vehicle options', async () => {
    // Seed manufacturer and model
    const m = await prisma.vehicleManufacturer.create({
      data: { name: 'Toyota' },
    });
    const model = await prisma.vehicleModel.create({
      data: {
        name: 'Camry',
        type: VehicleType.SEDAN,
        manufacturerId: m.id,
      },
    });

    const mRes = await request(app.getHttpServer())
      .get('/api/v1/driver/manufacturers')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);
    expect(mRes.body.data.some((man: any) => man.name === 'Toyota')).toBe(true);

    const modelRes = await request(app.getHttpServer())
      .get(`/api/v1/driver/models?manufacturerId=${m.id}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);
    expect(modelRes.body.data.some((mod: any) => mod.name === 'Camry')).toBe(
      true,
    );
  });

  it('POST /api/v1/driver/add-vehicle adds vehicle and completes onboarding', async () => {
    const m = await prisma.vehicleManufacturer.findFirst();
    const model = await prisma.vehicleModel.findFirst({
      where: { manufacturerId: m.id },
    });

    const res = await request(app.getHttpServer())
      .post('/api/v1/driver/onboarding/vehicle-info')
      .set('Authorization', `Bearer ${authToken}`)
      .attach('exteriorPhoto', testFile)
      .attach('interiorPhoto', testFile)
      .field('vehicleYear', 2022)
      .field('vehicleColor', VehicleColor.BLACK)
      .field('modelId', model.id)
      .field('plateNumber', 'ABC-123-X')
      .expect(201);

    expect(res.body.statusCode).toBe(201);

    const statusRes = await request(app.getHttpServer())
      .get('/api/v1/driver/onboarding/status')
      .set('Authorization', `Bearer ${authToken}`);
    expect(statusRes.body.data.currentStep).toBe(3);
    expect(statusRes.body.data.driver.onboardingCompleted).toBe(true);
    expect(statusRes.body.data.isComplete).toBe(true);
  });

  it('GET /api/v1/driver/profile returns full driver profile with stats', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/driver/profile')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(res.body.statusCode).toBe(200);
    expect(res.body.data.user).toBeDefined();
    expect(res.body.data.user.firstName).toBe('Driver');
    expect(res.body.data.user.lastName).toBe('E2E');
    expect(res.body.data.driver).toBeDefined();
    expect(res.body.data.driver.licenseNumber).toBe('DL1234567890');
    expect(res.body.data.driver.totalRides).toBeDefined();
    expect(res.body.data.driver.totalRatings).toBeDefined();
    expect(res.body.data.driver.averageRating).toBeDefined();
    expect(res.body.data.vehicle).toBeDefined();
    expect(res.body.data.vehicle.plateNumber).toBe('ABC-123-X');
  });
});
