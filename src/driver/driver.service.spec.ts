import { Test, TestingModule } from '@nestjs/testing';
import { DriverService } from './driver.service';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateDriverInfoDto } from './dto/driver-info.dto';
import { CreateVehicleDto } from './dto/vehicle-info.dto';
import { UpdateDriverPersonalInfoDto } from './dto/update-personal-info.dto';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Gender, VehicleColor } from '@prisma/client';
import { PinoLogger } from 'nestjs-pino';

describe('DriverService', () => {
  let service: DriverService;
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

  const mockUser = {
    id: 'user-1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'driver@example.com',
    phone: '1234567890',
    gender: Gender.MALE,
    dateOfBirth: new Date('1990-01-01'),
    avatar: 'avatar-url',
    deletedAt: null,
  };

  const mockDriver = {
    id: 'driver-1',
    userId: 'user-1',
    licenseNumber: 'DL1234567890',
    onboardingStep: 3,
    onboardingCompleted: true,
  };

  const mockVehicle = {
    id: 'vehicle-1',
    driverId: 'driver-1',
    modelId: 'model-1',
    year: 2022,
    color: VehicleColor.BLACK,
    plateNumber: 'PLATE123',
  };

  const mockFile = {
    fieldname: 'file',
    originalname: 'test.jpg',
    encoding: '7bit',
    mimetype: 'image/jpeg',
    buffer: Buffer.from('test'),
    size: 4,
  } as Express.Multer.File;

  beforeEach(async () => {
    const mockPrismaService = {
      user: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      driver: {
        create: jest.fn(),
        update: jest.fn(),
      },
      vehicle: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
      vehicleManufacturer: {
        findMany: jest.fn(),
      },
      vehicleModel: {
        findMany: jest.fn(),
      },
      $transaction: jest.fn((cb) => cb(mockPrismaService)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DriverService,
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

    service = module.get<DriverService>(DriverService);
    prismaService = module.get(PrismaService);

    jest.clearAllMocks();
  });

  describe('createDriver', () => {
    it('should create a driver entry', async () => {
      const userId = 'user-1';
      prismaService.driver.create.mockResolvedValue({ id: 'driver-1', userId });

      const result = await service.createDriver(userId);

      expect(prismaService.driver.create).toHaveBeenCalledWith({
        data: { userId },
        include: { user: true },
      });
      expect(result.id).toBe('driver-1');
    });
  });

  describe('getOnboardingStatus', () => {
    it('should return onboarding status for a valid driver', async () => {
      prismaService.user.findUnique.mockResolvedValue({
        ...mockUser,
        driver: {
          ...mockDriver,
          vehicle: mockVehicle,
        },
      });

      const result = await service.getOnboardingStatus('user-1');

      expect(result.statusCode).toBe(200);
      expect(result.data.isComplete).toBe(true);
      expect(result.data.hasPersonalInfo).toBe(true);
    });

    it('should throw NotFoundException if user not found', async () => {
      prismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.getOnboardingStatus('invalid')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException if user is not a driver', async () => {
      prismaService.user.findUnique.mockResolvedValue({
        ...mockUser,
        driver: null,
      });

      await expect(service.getOnboardingStatus('user-1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('updatePersonalInfo', () => {
    const dto: UpdateDriverPersonalInfoDto = {
      phone: '0987654321',
      gender: Gender.FEMALE,
      dateOfBirth: new Date('1995-05-05'),
    };

    it('should update personal information successfully', async () => {
      prismaService.user.findUnique.mockResolvedValue({
        ...mockUser,
        driver: mockDriver,
      });
      prismaService.user.findFirst.mockResolvedValue(null);
      prismaService.user.update.mockResolvedValue({
        ...mockUser,
        ...dto,
      });

      const result = await service.updatePersonalInfo('user-1', dto);

      expect(result.statusCode).toBe(200);
      expect(prismaService.user.update).toHaveBeenCalled();
    });

    it('should throw BadRequestException if phone number is already in use', async () => {
      prismaService.user.findUnique.mockResolvedValue({
        ...mockUser,
        driver: mockDriver,
      });
      prismaService.user.findFirst.mockResolvedValue({ id: 'other-user' });

      await expect(service.updatePersonalInfo('user-1', dto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('updateDriverInfo', () => {
    const dto: UpdateDriverInfoDto = {
      licenseNumber: 'NEWDL123',
      licensePhoto: null,
      profilePhoto: null,
    };

    it('should update driver license info', async () => {
      prismaService.user.findUnique.mockResolvedValue({
        ...mockUser,
        driver: mockDriver,
      });
      prismaService.driver.update.mockResolvedValue({
        ...mockDriver,
        licenseNumber: dto.licenseNumber,
      });

      const result = await service.updateDriverInfo(
        'user-1',
        dto,
        mockFile,
        mockFile,
      );

      expect(result.statusCode).toBe(200);
      expect(prismaService.driver.update).toHaveBeenCalledWith({
        where: { id: mockDriver.id },
        data: {
          licenseNumber: dto.licenseNumber,
          onboardingStep: 2,
        },
      });
    });
  });

  describe('addVehicle', () => {
    const dto: CreateVehicleDto = {
      vehicleYear: 2023,
      vehicleColor: VehicleColor.WHITE,
      modelId: 'model-1',
      plateNumber: 'NEWPLATE',
      exteriorPhoto: null,
      interiorPhoto: null,
    };

    it('should add a vehicle and complete onboarding', async () => {
      prismaService.user.findUnique.mockResolvedValue({
        ...mockUser,
        driver: { ...mockDriver, vehicle: null },
      });
      prismaService.vehicle.findUnique.mockResolvedValue(null);
      prismaService.vehicle.create.mockResolvedValue(mockVehicle);

      const result = await service.addVehicle(
        'user-1',
        dto,
        mockFile,
        mockFile,
      );

      expect(result.statusCode).toBe(201);
      expect(prismaService.driver.update).toHaveBeenCalledWith({
        where: { id: mockDriver.id },
        data: {
          onboardingStep: 3,
          onboardingCompleted: true,
        },
      });
    });

    it('should throw BadRequestException if vehicle already exists', async () => {
      prismaService.user.findUnique.mockResolvedValue({
        ...mockUser,
        driver: { ...mockDriver, vehicle: mockVehicle },
      });

      await expect(
        service.addVehicle('user-1', dto, mockFile, mockFile),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getManufacturers', () => {
    it('should return list of manufacturers', async () => {
      const manufacturers = [{ id: '1', name: 'Toyota' }];
      prismaService.vehicleManufacturer.findMany.mockResolvedValue(
        manufacturers,
      );

      const result = await service.getManufacturers();

      expect(result.statusCode).toBe(200);
      expect(result.data).toEqual(manufacturers);
    });
  });

  describe('getModelsByManufacturer', () => {
    it('should return list of models for a manufacturer', async () => {
      const models = [{ id: '1', name: 'Camry', manufacturerId: 'm-1' }];
      prismaService.vehicleModel.findMany.mockResolvedValue(models);

      const result = await service.getModelsByManufacturer('m-1');

      expect(result.statusCode).toBe(200);
      expect(result.data).toEqual(models);
    });
  });
});
