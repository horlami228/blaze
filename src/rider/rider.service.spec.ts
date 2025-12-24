import { Test, TestingModule } from '@nestjs/testing';
import { RiderService } from './rider.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { PinoLogger } from 'nestjs-pino';

describe('RiderService', () => {
  let service: RiderService;
  let prismaService: any;

  // Mock PinoLogger with all methods used by the service
  const mockLogger = {
    info: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    error: jest.fn(),
    trace: jest.fn(),
    fatal: jest.fn(),
  };

  beforeEach(async () => {
    const mockPrismaService = {
      rider: {
        create: jest.fn() as jest.Mock,
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RiderService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: PinoLogger,
          useValue: mockLogger,
        },
      ],
    }).compile();

    service = module.get<RiderService>(RiderService);
    prismaService = module.get(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
