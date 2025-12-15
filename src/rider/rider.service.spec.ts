import { Test, TestingModule } from '@nestjs/testing';
import { RiderService } from './rider.service';
import { PrismaService } from 'src/prisma/prisma.service';

describe('RiderService', () => {
  let service: RiderService;
  let prismaService: any;

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
      ],
    }).compile();

    service = module.get<RiderService>(RiderService);
    prismaService = module.get(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
