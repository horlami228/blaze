import { Test, TestingModule } from '@nestjs/testing';
import { DriverController } from './driver.controller';
import { DriverService } from './driver.service';
import { UpdateDriverPersonalInfoDto } from './dto/update-personal-info.dto';
import { UpdateDriverInfoDto } from './dto/driver-info.dto';
import { CreateVehicleDto } from './dto/vehicle-info.dto';
import { BadRequestException } from '@nestjs/common';
import { Gender, VehicleColor } from '@prisma/client';

describe('DriverController', () => {
  let controller: DriverController;
  let service: DriverService;

  const mockDriverService = {
    getOnboardingStatus: jest.fn(),
    updatePersonalInfo: jest.fn(),
    updateDriverInfo: jest.fn(),
    addVehicle: jest.fn(),
    getManufacturers: jest.fn(),
    getModelsByManufacturer: jest.fn(),
  };

  const mockRequest = {
    user: {
      sub: 'user-1',
    },
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
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DriverController],
      providers: [
        {
          provide: DriverService,
          useValue: mockDriverService,
        },
      ],
    }).compile();

    controller = module.get<DriverController>(DriverController);
    service = module.get<DriverService>(DriverService);

    jest.clearAllMocks();
  });

  describe('getOnboardingStatus', () => {
    it('should call service and return status', async () => {
      const expectedResult = { statusCode: 200, data: { onboardingStep: 1 } };
      mockDriverService.getOnboardingStatus.mockResolvedValue(expectedResult);

      const result = await controller.getOnboardingStatus(mockRequest);

      expect(service.getOnboardingStatus).toHaveBeenCalledWith('user-1');
      expect(result).toBe(expectedResult);
    });
  });

  describe('updatePersonalInfo', () => {
    it('should call service with DTO and return result', async () => {
      const dto: UpdateDriverPersonalInfoDto = {
        phone: '1234567890',
        gender: Gender.MALE,
        dateOfBirth: new Date(),
      };
      const expectedResult = { statusCode: 200, message: 'Updated' };
      mockDriverService.updatePersonalInfo.mockResolvedValue(expectedResult);

      const result = await controller.updatePersonalInfo(mockRequest, dto);

      expect(service.updatePersonalInfo).toHaveBeenCalledWith('user-1', dto);
      expect(result).toBe(expectedResult);
    });
  });

  describe('updateDriverInfo', () => {
    it('should call service with files and return result', async () => {
      const dto: UpdateDriverInfoDto = {
        licenseNumber: 'DL123',
        licensePhoto: null,
        profilePhoto: null,
      };
      const files = {
        licensePhoto: [mockFile],
        profilePhoto: [mockFile],
      };
      const expectedResult = { statusCode: 200, message: 'Updated' };
      mockDriverService.updateDriverInfo.mockResolvedValue(expectedResult);

      const result = await controller.updateDriverInfo(mockRequest, dto, files);

      expect(service.updateDriverInfo).toHaveBeenCalledWith(
        'user-1',
        dto,
        mockFile,
        mockFile,
      );
      expect(result).toBe(expectedResult);
    });

    it('should throw BadRequestException if files are missing', async () => {
      const dto: UpdateDriverInfoDto = {
        licenseNumber: 'DL123',
        licensePhoto: null,
        profilePhoto: null,
      };

      await expect(
        controller.updateDriverInfo(mockRequest, dto, {}),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('addVehicle', () => {
    it('should call service with files and return result', async () => {
      const dto: CreateVehicleDto = {
        vehicleYear: 2022,
        vehicleColor: VehicleColor.BLACK,
        modelId: 'model-1',
        plateNumber: 'ABC-123-XY',
        exteriorPhoto: null,
        interiorPhoto: null,
      };
      const files = {
        exteriorPhoto: [mockFile],
        interiorPhoto: [mockFile],
      };
      const expectedResult = { statusCode: 201, message: 'Added' };
      mockDriverService.addVehicle.mockResolvedValue(expectedResult);

      const result = await controller.addVehicle(mockRequest, dto, files);

      expect(service.addVehicle).toHaveBeenCalledWith(
        'user-1',
        dto,
        mockFile,
        mockFile,
      );
      expect(result).toBe(expectedResult);
    });

    it('should throw BadRequestException if vehicle photos are missing', async () => {
      const dto: CreateVehicleDto = {
        vehicleYear: 2022,
        vehicleColor: VehicleColor.BLACK,
        modelId: 'model-1',
        plateNumber: 'ABC-123-XY',
        exteriorPhoto: null,
        interiorPhoto: null,
      };

      await expect(controller.addVehicle(mockRequest, dto, {})).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('getManufacturer', () => {
    it('should return manufacturers list', async () => {
      const expectedResult = { statusCode: 200, data: [] };
      mockDriverService.getManufacturers.mockResolvedValue(expectedResult);

      const result = await controller.getManufacturer();

      expect(service.getManufacturers).toHaveBeenCalled();
      expect(result).toBe(expectedResult);
    });
  });

  describe('getModels', () => {
    it('should return models for manufacturer', async () => {
      const manufacturerId = 'm-1';
      const expectedResult = { statusCode: 200, data: [] };
      mockDriverService.getModelsByManufacturer.mockResolvedValue(
        expectedResult,
      );

      const result = await controller.getModels(manufacturerId);

      expect(service.getModelsByManufacturer).toHaveBeenCalledWith(
        manufacturerId,
      );
      expect(result).toBe(expectedResult);
    });
  });
});
