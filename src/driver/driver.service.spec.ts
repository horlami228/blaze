import { Test, TestingModule } from '@nestjs/testing';
import { DriverService } from './driver.service';
import { PrismaService } from '../prisma/prisma.service';

describe('DriverService', () => {
  let service: DriverService;
  let prismaService: any;
  beforeEach(async () => {
    const mockPrismaService = {
      rider: {
        create: jest.fn() as jest.Mock,
      },
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DriverService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<DriverService>(DriverService);
    prismaService = module.get(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
