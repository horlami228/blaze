import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Query,
  Request,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { DriverService } from './driver.service';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { UpdateDriverPersonalInfoDto } from './dto/update-personal-info.dto';
import { UpdateDriverInfoDto } from './dto/driver-info.dto';
import {
  FileFieldsInterceptor,
  FileInterceptor,
} from '@nestjs/platform-express';
import { createMulterOptions } from 'src/common/config/multer.config';
import { CreateVehicleDto } from './dto/vehicle-info.dto';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { IMAGE_MIME_TYPES } from 'src/common/constants/mime-types.constants';
import { FILE_SIZE_LIMITS } from 'src/common/constants/file-size.constants';

@ApiTags('Driver')
@ApiBearerAuth()
@Controller('api/v1/driver')
@Roles(UserRole.DRIVER)
export class DriverController {
  constructor(private readonly driverService: DriverService) {}

  // Get onboarding status
  @Get('onboarding-status')
  @ApiOperation({ summary: 'Get current onboarding status of the driver' })
  @ApiResponse({
    status: 200,
    description: 'Return onboarding status details',
    schema: {
      example: {
        statusCode: 200,
        data: {
          status: {
            currentStep: 3,
            hasPersonalInfo: true,
            hasDriverInfo: true,
            hasVehicle: true,
            isComplete: true,
          },
          user: {
            firstName: 'Klaus',
            lastName: 'Michealson',
            email: 'test_driver@example.com',
            phone: '8148912241',
            avatar: null,
          },
          driver: {
            id: '9ef02eb0-b268-4222-823d-91c1b1fe3ccf',
            licenseNumber: 'NONASF90A0SD',
            licensePhoto: null,
            profilePhoto: null,
          },
          vehicle: {
            id: '83eff568-e668-4f4a-a388-c7ec15ff42a9',
            color: 'RED',
            plateNumber: 'LAG-1241A',
            year: 2015,
            isActive: true,
            model: {
              name: 'Corolla',
              manufacturer: {
                name: 'Toyota',
              },
            },
          },
        },
      },
    },
  })
  async getOnboardingStatus(@Request() req: any) {
    const userId = req.user.sub;
    return this.driverService.getOnboardingStatus(userId);
  }

  // Get driver profile
  @Get('profile')
  @ApiOperation({ summary: 'Get full driver profile with statistics' })
  @ApiResponse({
    status: 200,
    description: 'Return driver profile details',
    schema: {
      example: {
        statusCode: 200,
        data: {
          user: {
            firstName: 'Klaus',
            lastName: 'Michealson',
            email: 'test_driver@example.com',
            phone: '8148912241',
            avatar: null,
          },
          driver: {
            id: '9ef02eb0-b268-4222-823d-91c1b1fe3ccf',
            licenseNumber: 'NONASF90A0SD',
            licensePhoto: 'https://r2.cloudflarestorage.com/...signed...',
            profilePhoto: 'https://r2.cloudflarestorage.com/...signed...',
            totalRides: 154,
            totalRatings: 45,
            averageRating: 4.8,
            onboardingCompleted: true,
          },
          vehicle: {
            id: '83eff568-e668-4f4a-a388-c7ec15ff42a9',
            model: {
              name: 'Corolla',
              manufacturer: {
                name: 'Toyota',
              },
            },
            exteriorPhoto: 'https://r2.cloudflarestorage.com/...signed...',
            interiorPhoto: 'https://r2.cloudflarestorage.com/...signed...',
          },
        },
      },
    },
  })
  async getProfile(@Request() req: any) {
    const userId = req.user.sub;
    return this.driverService.getProfile(userId);
  }

  // Update personal info
  @Post('update-personal-info')
  @ApiOperation({ summary: 'Update basic personal information' })
  @ApiResponse({
    status: 200,
    description: 'Personal info updated successfully',
    schema: {
      example: {
        statusCode: 200,
        message: 'Personal information updated successfully',
        data: {
          user: {
            firstName: 'Klaus',
            lastName: 'Michealson',
            email: 'test_driver@example.com',
            phone: '8148912241',
            dateOfBirth: '1998-05-08T00:00:00.000Z',
            gender: 'MALE',
          },
        },
      },
    },
  })
  async updatePersonalInfo(
    @Request() req: any,
    @Body() updatePersonalInfoDto: UpdateDriverPersonalInfoDto,
  ) {
    const userId = req.user.sub;
    return this.driverService.updatePersonalInfo(userId, updatePersonalInfoDto);
  }

  // Update driver info
  @Post('update-driver-info')
  @ApiOperation({ summary: 'Update driver license information and photos' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UpdateDriverInfoDto })
  @ApiResponse({
    status: 200,
    description: 'Driver information updated successfully',
    schema: {
      example: {
        statusCode: 200,
        message: 'Driver information updated successfully',
        data: {
          driver: {
            id: '9ef02eb0-b268-4222-823d-91c1b1fe3ccf',
            userId: 'e8eeb0f6-ec2a-4ff8-9e9c-35a443e34c88',
            licenseNumber: 'NONASF90A0SD',
            licensePhoto: 'https://example.com/license.jpg',
            profilePhoto: 'https://example.com/profile.jpg',
            onboardingCompleted: true,
            onboardingStep: 2,
            createdAt: '2025-12-16T20:21:08.899Z',
            updatedAt: '2025-12-24T08:16:03.265Z',
            deletedAt: null,
          },
        },
      },
    },
  })
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'licensePhoto', maxCount: 1 },
        { name: 'profilePhoto', maxCount: 1 },
      ],
      createMulterOptions({
        allowedMimeTypes: [IMAGE_MIME_TYPES.JPEG, IMAGE_MIME_TYPES.PNG],
        maxFileSize: FILE_SIZE_LIMITS.LARGE,
      }),
    ),
  )
  async updateDriverInfo(
    @Request() req: any,
    @Body() updateDriverInfoDto: UpdateDriverInfoDto,
    @UploadedFiles()
    files?: {
      licensePhoto?: Express.Multer.File[];
      profilePhoto?: Express.Multer.File[];
    },
  ) {
    const userId = req.user.sub;
    const licenseFile = files?.licensePhoto?.[0];
    const profileFile = files?.profilePhoto?.[0];

    if (!licenseFile || !profileFile) {
      throw new BadRequestException(
        'Both license and profile photos are required',
      );
    }

    return this.driverService.updateDriverInfo(
      userId,
      updateDriverInfoDto,
      licenseFile,
      profileFile,
    );
  }

  // Add vehicle
  @Post('add-vehicle')
  @ApiOperation({ summary: 'Add vehicle information and photos' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: CreateVehicleDto })
  @ApiResponse({
    status: 201,
    description: 'Vehicle information added successfully',
    schema: {
      example: {
        statusCode: 201,
        message: 'Onboarding complete!',
        data: {
          vehicle: {
            id: '83eff568-e668-4f4a-a388-c7ec15ff42a9',
            driverId: '9ef02eb0-b268-4222-823d-91c1b1fe3ccf',
            modelId: 'abcca413-b6ba-4d2d-a987-fcb454a314d6',
            color: 'RED',
            plateNumber: 'LAG-1241A',
            year: 2015,
            isActive: true,
            createdAt: '2025-12-20T17:31:12.629Z',
            updatedAt: '2025-12-20T17:31:12.629Z',
            deletedAt: null,
            model: {
              id: 'abcca413-b6ba-4d2d-a987-fcb454a314d6',
              name: 'Corolla',
              manufacturer: {
                id: 'e64941b5-9202-48b5-b6d0-6cda53851317',
                name: 'Toyota',
              },
            },
          },
        },
      },
    },
  })
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'exteriorPhoto', maxCount: 1 },
        { name: 'interiorPhoto', maxCount: 1 },
      ],
      createMulterOptions({
        allowedMimeTypes: [IMAGE_MIME_TYPES.JPEG, IMAGE_MIME_TYPES.PNG],
        maxFileSize: FILE_SIZE_LIMITS.LARGE,
      }),
    ),
  )
  async addVehicle(
    @Request() req: any,
    @Body() createVehicleDto: CreateVehicleDto,
    @UploadedFiles()
    files?: {
      exteriorPhoto?: Express.Multer.File[];
      interiorPhoto?: Express.Multer.File[];
    },
  ) {
    const userId = req.user.sub;
    const exteriorFile = files?.exteriorPhoto?.[0];
    const interiorFile = files?.interiorPhoto?.[0];

    if (!exteriorFile || !interiorFile) {
      throw new BadRequestException(
        'Both exterior and interior photos are required',
      );
    }

    return this.driverService.addVehicle(
      userId,
      createVehicleDto,
      exteriorFile,
      interiorFile,
    );
  }

  // Get manufacturer
  @Get('manufacturer')
  @ApiOperation({ summary: 'Get list of available vehicle manufacturers' })
  @ApiResponse({
    status: 200,
    description: 'Return list of manufacturers',
    schema: {
      example: {
        statusCode: 200,
        data: [
          {
            id: 'dd3afc76-171d-4927-82bc-3d7391c4dcd9',
            name: 'Audi',
            createdAt: '2025-12-19T18:56:15.109Z',
          },
          {
            id: 'e64941b5-9202-48b5-b6d0-6cda53851317',
            name: 'Toyota',
            createdAt: '2025-12-19T18:42:18.104Z',
          },
          {
            id: 'c90866f4-4547-4f81-bab8-688efa7a3496',
            name: 'Yamaha',
            createdAt: '2025-12-19T18:59:24.289Z',
          },
        ],
      },
    },
  })
  async getManufacturer() {
    return this.driverService.getManufacturers();
  }

  // Get models by manufacturer
  @Get('models')
  @ApiOperation({ summary: 'Get vehicle models for a specific manufacturer' })
  @ApiResponse({
    status: 200,
    description: 'Return list of models',
    schema: {
      example: {
        statusCode: 200,
        data: [
          {
            id: 'e748a6df-1f70-4ee8-918d-20df901e2210',
            manufacturerId: 'e64941b5-9202-48b5-b6d0-6cda53851317',
            name: '4Runner',
            type: 'SUV',
            seats: 5,
            createdAt: '2025-12-19T18:56:14.918Z',
            manufacturer: {
              id: 'e64941b5-9202-48b5-b6d0-6cda53851317',
              name: 'Toyota',
              createdAt: '2025-12-19T18:42:18.104Z',
            },
          },
          {
            id: '369826af-4092-433f-8d1b-87c5e6a1a828',
            manufacturerId: 'e64941b5-9202-48b5-b6d0-6cda53851317',
            name: 'Camry',
            type: 'SEDAN',
            seats: 4,
            createdAt: '2025-12-19T18:42:18.110Z',
            manufacturer: {
              id: 'e64941b5-9202-48b5-b6d0-6cda53851317',
              name: 'Toyota',
              createdAt: '2025-12-19T18:42:18.104Z',
            },
          },
          {
            id: 'abcca413-b6ba-4d2d-a987-fcb454a314d6',
            manufacturerId: 'e64941b5-9202-48b5-b6d0-6cda53851317',
            name: 'Corolla',
            type: 'SEDAN',
            seats: 4,
            createdAt: '2025-12-19T18:42:18.114Z',
            manufacturer: {
              id: 'e64941b5-9202-48b5-b6d0-6cda53851317',
              name: 'Toyota',
              createdAt: '2025-12-19T18:42:18.104Z',
            },
          },
          {
            id: '762ba5d3-88d5-40d6-8e5c-ad53ea785260',
            manufacturerId: 'e64941b5-9202-48b5-b6d0-6cda53851317',
            name: 'Highlander',
            type: 'SUV',
            seats: 7,
            createdAt: '2025-12-19T18:42:18.117Z',
            manufacturer: {
              id: 'e64941b5-9202-48b5-b6d0-6cda53851317',
              name: 'Toyota',
              createdAt: '2025-12-19T18:42:18.104Z',
            },
          },
        ],
      },
    },
  })
  async getModels(@Query('manufacturerId') manufacturerId: string) {
    return this.driverService.getModelsByManufacturer(manufacturerId);
  }
}
