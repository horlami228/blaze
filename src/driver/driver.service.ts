import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Driver } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { UpdateDriverPersonalInfoDto } from './dto/update-personal-info.dto';
import { UpdateDriverInfoDto } from './dto/driver-info.dto';
import { CreateVehicleDto } from './dto/vehicle-info.dto';
import { PinoLogger } from 'nestjs-pino';

@Injectable()
export class DriverService {
  constructor(
    private prisma: PrismaService,
    private readonly logger: PinoLogger,
  ) {}

  async createDriver(userId: string): Promise<Driver> {
    this.logger.info({ userId }, 'Creating new driver profile');
    return this.prisma.driver.create({
      data: { userId },
      include: { user: true },
    });
  }

  // get onboarding status
  async getOnboardingStatus(userId: string) {
    this.logger.info({ userId }, 'Getting onboarding status');
    const user = await this.prisma.user.findUnique({
      where: { id: userId, deletedAt: null },
      include: {
        driver: {
          include: {
            vehicle: {
              include: {
                model: {
                  include: {
                    manufacturer: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.driver) {
      throw new BadRequestException('User is not a driver');
    }

    const hasPersonalInfo = !!user.phone;
    const hasDriverInfo = !!user.driver.licenseNumber;
    const hasVehicle = !!user.driver.vehicle;
    const isComplete = hasPersonalInfo && hasDriverInfo && hasVehicle;

    return {
      statusCode: 200,
      data: {
        currentStep: user.driver.onboardingStep,
        hasPersonalInfo,
        hasDriverInfo,
        hasVehicle,
        isComplete,
        user: {
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone,
          avatar: user.avatar,
        },
        vehicle: user.driver.vehicle,
        driver: user.driver,
      },
    };
  }

  async updatePersonalInfo(userId: string, dto: UpdateDriverPersonalInfoDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId, deletedAt: null },
      include: { driver: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.driver) {
      throw new BadRequestException('User is not a driver');
    }

    // Check if phone is already taken
    if (dto.phone) {
      const existingPhone = await this.prisma.user.findFirst({
        where: {
          phone: dto.phone,
          id: { not: userId },
          deletedAt: null,
        },
      });

      if (existingPhone) {
        this.logger.warn(
          { userId, attemptedPhone: dto.phone },
          'Phone number update failed - already in use',
        );
        throw new BadRequestException('Phone number already in use');
      }
    }

    // Update user
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...dto, // Spreading the DTO fields directly
        driver: {
          update: {
            onboardingStep: 1,
          },
        },
      },
    });

    this.logger.info({ userId }, 'Driver onboarding Step 1 complete');

    return {
      statusCode: 200,
      message: 'Personal information updated successfully',
      data: {
        user: {
          firstName: updatedUser.firstName,
          lastName: updatedUser.lastName,
          email: updatedUser.email,
          phone: updatedUser.phone,
          dateOfBirth: updatedUser.dateOfBirth,
          gender: updatedUser.gender,
        },
      },
    };
  }

  async updateDriverInfo(
    userId: string,
    dto: UpdateDriverInfoDto,
    licensePhoto: Express.Multer.File,
    profilePhoto: Express.Multer.File,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId, deletedAt: null },
      include: { driver: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.driver) {
      throw new BadRequestException('User is not a driver');
    }

    //TODO: upload to R2

    // Update driver
    const updatedDriver = await this.prisma.driver.update({
      where: { id: user.driver.id },
      data: {
        ...(dto.licenseNumber && { licenseNumber: dto.licenseNumber }),
        onboardingStep: 2,
      },
    });

    return {
      statusCode: 200,
      message: 'Driver information updated successfully',
      data: {
        driver: updatedDriver,
      },
    };
  }

  // add vehicle
  //TODO: upload to R2

  async addVehicle(
    userId: string,
    dto: CreateVehicleDto,
    exteriorFile?: Express.Multer.File,
    interiorFile?: Express.Multer.File,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId, deletedAt: null },
      include: { driver: { include: { vehicle: true } } },
    });

    if (!user?.driver) throw new BadRequestException('Driver not found');
    if (user.driver.vehicle)
      throw new BadRequestException('Vehicle already exists');

    // 1. Check plate uniqueness
    const existingPlate = await this.prisma.vehicle.findUnique({
      where: { plateNumber: dto.plateNumber },
    });
    if (existingPlate)
      throw new BadRequestException('Plate number already registered');

    const exteriorUrl = '';
    const interiorUrl = '';
    // 2. Upload photos
    // const [exteriorUrl, interiorUrl] = await Promise.all([
    //   exteriorFile ? this.r2Service.uploadFile(exteriorFile, 'vehicles') : null,
    //   interiorFile ? this.r2Service.uploadFile(interiorFile, 'vehicles') : null,
    // ]);

    return this.prisma.$transaction(async (tx) => {
      const vehicle = await tx.vehicle.create({
        data: {
          driverId: user.driver.id,
          modelId: dto.modelId,
          year: dto.vehicleYear,
          color: dto.vehicleColor,
          plateNumber: dto.plateNumber,
          exteriorPhoto: exteriorUrl,
          interiorPhoto: interiorUrl,
        },
        include: { model: { include: { manufacturer: true } } },
      });

      await tx.driver.update({
        where: { id: user.driver.id },
        data: {
          onboardingStep: 3,
          onboardingCompleted: true,
        },
      });

      this.logger.info(
        { userId, vehicleId: vehicle.id },
        'Onboarding complete',
      );

      return {
        statusCode: 201,
        message: 'Onboarding complete!',
        data: { vehicle },
      };
    });
  }

  // get car manufacturers
  async getManufacturers() {
    const manufacturers = await this.prisma.vehicleManufacturer.findMany({
      orderBy: { name: 'asc' },
    });

    return {
      statusCode: 200,
      data: manufacturers,
    };
  }

  // Get models by manufacturer
  async getModelsByManufacturer(manufacturerId: string) {
    const models = await this.prisma.vehicleModel.findMany({
      where: { manufacturerId },
      include: {
        manufacturer: true,
      },
      orderBy: { name: 'asc' },
    });

    return {
      statusCode: 200,
      data: models,
    };
  }
}
