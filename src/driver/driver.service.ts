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
import { CloudflareR2Service } from 'src/common/cloudflare/cloudflare-r2.service';
import { R2Bucket } from 'src/common/enums/bucket.enum';
import { ALLOWED_DRIVER_DOCUMENT_TYPES } from 'src/common/constants/mime-types.constants';

@Injectable()
export class DriverService {
  constructor(
    private prisma: PrismaService,
    private readonly logger: PinoLogger,
    private readonly r2Service: CloudflareR2Service,
  ) {
    this.logger.setContext(DriverService.name);
  }

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
    this.logger.info({ userId }, 'Updating personal information');
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
    this.logger.info({ userId }, 'Updating driver information');
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

    const [licensePhotoUrl, profilePhotoUrl] = await Promise.all([
      licensePhoto
        ? this.r2Service.uploadFile(
            licensePhoto,
            'driver-documents',
            R2Bucket.DRIVER_DOCUMENTS,
            ALLOWED_DRIVER_DOCUMENT_TYPES,
          )
        : undefined,
      profilePhoto
        ? this.r2Service.uploadFile(
            profilePhoto,
            'driver-documents',
            R2Bucket.DRIVER_DOCUMENTS,
            ALLOWED_DRIVER_DOCUMENT_TYPES,
          )
        : undefined,
    ]);

    // Update driver
    const updatedDriver = await this.prisma.driver.update({
      where: { id: user.driver.id },
      data: {
        ...(dto.licenseNumber && { licenseNumber: dto.licenseNumber }),
        ...(licensePhotoUrl && { licensePhoto: licensePhotoUrl }),
        ...(profilePhotoUrl && { profilePhoto: profilePhotoUrl }),
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

  async addVehicle(
    userId: string,
    dto: CreateVehicleDto,
    exteriorFile?: Express.Multer.File,
    interiorFile?: Express.Multer.File,
  ) {
    this.logger.info({ userId }, 'Adding vehicle');
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

    const [exteriorUrl, interiorUrl] = await Promise.all([
      exteriorFile
        ? this.r2Service.uploadFile(
            exteriorFile,
            'vehicles',
            R2Bucket.DRIVER_DOCUMENTS,
            ALLOWED_DRIVER_DOCUMENT_TYPES,
          )
        : undefined,
      interiorFile
        ? this.r2Service.uploadFile(
            interiorFile,
            'vehicles',
            R2Bucket.DRIVER_DOCUMENTS,
            ALLOWED_DRIVER_DOCUMENT_TYPES,
          )
        : undefined,
    ]);

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
    this.logger.info('Getting car manufacturers');
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
    this.logger.info({ manufacturerId }, 'Getting models by manufacturer');
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

  // Get driver profile
  async getProfile(userId: string) {
    this.logger.info({ userId }, 'Getting driver profile');
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
            _count: {
              select: {
                rides: true,
                ratingsReceived: true,
              },
            },
          },
        },
      },
    });

    if (!user || !user.driver) {
      throw new NotFoundException('Driver profile not found');
    }

    const driver = user.driver;

    // Calculate average rating
    const ratingsGroup = await this.prisma.rating.aggregate({
      where: { ratedDriverId: driver.id },
      _avg: { rating: true },
    });
    const averageRating = ratingsGroup._avg.rating || 0;

    // Generate presigned URLs
    const [
      licensePhotoUrl,
      profilePhotoUrl,
      exteriorPhotoUrl,
      interiorPhotoUrl,
    ] = await Promise.all([
      driver.licensePhoto
        ? this.r2Service.getPresignedDownloadUrl(
            R2Bucket.DRIVER_DOCUMENTS,
            driver.licensePhoto,
          )
        : null,
      driver.profilePhoto
        ? this.r2Service.getPresignedDownloadUrl(
            R2Bucket.DRIVER_DOCUMENTS,
            driver.profilePhoto,
          )
        : null,
      driver.vehicle?.exteriorPhoto
        ? this.r2Service.getPresignedDownloadUrl(
            R2Bucket.DRIVER_DOCUMENTS,
            driver.vehicle.exteriorPhoto,
          )
        : null,
      driver.vehicle?.interiorPhoto
        ? this.r2Service.getPresignedDownloadUrl(
            R2Bucket.DRIVER_DOCUMENTS,
            driver.vehicle.interiorPhoto,
          )
        : null,
    ]);

    const { vehicle, ...driverData } = driver;

    return {
      statusCode: 200,
      data: {
        user: {
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone,
          avatar: user.avatar,
        },
        driver: {
          ...driverData,
          licensePhoto: licensePhotoUrl,
          profilePhoto: profilePhotoUrl,
          totalRides: driver._count.rides,
          totalRatings: driver._count.ratingsReceived,
          averageRating: Number(averageRating.toFixed(1)),
        },
        vehicle: driver.vehicle
          ? {
              ...driver.vehicle,
              exteriorPhoto: exteriorPhotoUrl,
              interiorPhoto: interiorPhotoUrl,
            }
          : null,
      },
    };
  }
}
