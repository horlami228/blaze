import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { ZodValidationPipe } from 'nestjs-zod';

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    app.useGlobalPipes(new ZodValidationPipe());
    await app.init();

    prisma = app.get(PrismaService);
    await prisma.$executeRawUnsafe(
      `TRUNCATE TABLE "User", "Rider", "Driver" CASCADE`,
    );
  });

  afterEach(async () => {
    // simple cleanup; adjust to your tables
    await prisma.$executeRawUnsafe(
      `TRUNCATE TABLE "User", "Rider", "Driver" CASCADE`,
    );
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /auth/register-rider creates a new rider', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/register-rider')
      .send({
        email: 'e2e@example.com',
        password: 'Pass123!',
        firstName: 'Jane',
        lastName: 'Doe',
      })
      .expect(201);

    expect(res.body.token).toBeDefined();
    expect(res.body.data?.password).toBeUndefined();
  });

  it('POST /auth/register-driver creates a new driver', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/register-driver')
      .send({
        email: 'e2e@example.com',
        password: 'Pass123!',
        firstName: 'Jane',
        lastName: 'Doe',
      })
      .expect(201);

    expect(res.body.token).toBeDefined();
    expect(res.body.data?.password).toBeUndefined();
  });

  it('POST /auth/login authenticates existing user', async () => {
    const email = 'login@example.com';
    const password = 'Pass123!';

    // first register the user
    await request(app.getHttpServer())
      .post('/api/v1/auth/register-rider')
      .send({
        email,
        password,
        firstName: 'Jane',
        lastName: 'Doe',
      })
      .expect(201);

    // then login with the same credentials
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email, password })
      .expect(201);

    expect(res.body.data?.token).toBeDefined();
    expect(res.body.data?.user?.email).toBe(email);
    expect(res.body.data?.user?.password).toBeUndefined();
  });
});
