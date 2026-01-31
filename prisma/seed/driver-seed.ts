import { PrismaClient, UserRole, VehicleColor } from '@prisma/client';
import { PasswordUtil } from 'src/common/utils/password.utils';
import * as bcrypt from 'bcrypt';
import Redis from 'ioredis';

const prisma = new PrismaClient();

// Initialize Redis client explicitly for the seed script
const redisClient = new Redis(
  process.env.REDIS_URL || 'redis://localhost:6379',
);

// Coordinates for sample drivers
// Request Pickup: 6.514656, 3.490738 (Third Mainland Bridge / Yaba side)
// Max Search Radius: 20km

const driverLocations: [number, number][] = [
  // NEARBY DRIVERS (Within ~5km)
  [6.5, 3.39], // Driver 1: Yaba/Adekunle area (Very close)
  [6.49, 3.4], // Driver 2: Oyingbo area (Close)

  // FAR AWAY DRIVERS (Outside 20km radius)
  [6.6018, 3.3515], // Driver 3: Ikeja (Borderline, maybe ~15km, let's keep it just in case or move further) -> Moving further
  [7.3775, 3.947], // Driver 4: Ibadan (Far)
  [9.0765, 7.3986], // Driver 5: Abuja (Very Far)
  [6.5244, 3.8], // Driver 6: Way east (Far Lekki/Epe)
  [6.8, 3.2], // Driver 7: Sagamu (Far)
];

const driverProfiles = [
  {
    firstName: 'Emeka', // NEARBY
    lastName: 'Okonkwo',
    email: 'emeka.driver@example.com',
    phone: '+2348011111111',
    vehicle: {
      plateNumber: 'LND-123-AB',
      color: VehicleColor.BLACK,
      year: 2018,
      modelName: 'Camry',
      manufacturer: 'Toyota',
    },
  },
  {
    firstName: 'Tunde', // NEARBY
    lastName: 'Bakare',
    email: 'tunde.driver@example.com',
    phone: '+2348022222222',
    vehicle: {
      plateNumber: 'ABC-456-XY',
      color: VehicleColor.SILVER,
      year: 2020,
      modelName: 'Corolla',
      manufacturer: 'Toyota',
    },
  },
  {
    firstName: 'Chinedu', // FAR
    lastName: 'Eze',
    email: 'chinedu.driver@example.com',
    phone: '+2348033333333',
    vehicle: {
      plateNumber: 'KJA-789-QA',
      color: VehicleColor.BLUE,
      year: 2019,
      modelName: 'Civic',
      manufacturer: 'Honda',
    },
  },
  {
    firstName: 'Ibrahim', // FAR
    lastName: 'Musa',
    email: 'ibrahim.driver@example.com',
    phone: '+2348044444444',
    vehicle: {
      plateNumber: 'ABJ-101-ZZ',
      color: VehicleColor.WHITE,
      year: 2021,
      modelName: 'Accord',
      manufacturer: 'Honda',
    },
  },
  {
    firstName: 'Sarah', // FAR
    lastName: 'Johnson',
    email: 'sarah.driver@example.com',
    phone: '+2348055555555',
    vehicle: {
      plateNumber: 'LAG-202-BB',
      color: VehicleColor.RED,
      year: 2022,
      modelName: 'Elantra',
      manufacturer: 'Hyundai',
    },
  },
  {
    firstName: 'David', // FAR
    lastName: 'Mark',
    email: 'david.driver@example.com',
    phone: '+2348066666666',
    vehicle: {
      plateNumber: 'MUS-303-CC',
      color: VehicleColor.GRAY,
      year: 2017,
      modelName: 'ES',
      manufacturer: 'Lexus',
    },
  },
  {
    firstName: 'Fatima', // FAR
    lastName: 'Ali',
    email: 'fatima.driver@example.com',
    phone: '+2348077777777',
    vehicle: {
      plateNumber: 'EPE-404-DD',
      color: VehicleColor.GOLD,
      year: 2021,
      modelName: 'RX',
      manufacturer: 'Lexus',
    },
  },
];

export async function seedDrivers() {
  try {
    const hashedPassword = await PasswordUtil.hash('password');

    for (let i = 0; i < driverProfiles.length; i++) {
      const profile = driverProfiles[i];
      const location = driverLocations[i];

      // 1. Create or Update User
      const user = await prisma.user.upsert({
        where: { email: profile.email, deletedAt: null },
        update: {
          firstName: profile.firstName,
          lastName: profile.lastName,
          phone: profile.phone,
          password: hashedPassword, // Optional: might not want to reset password every seed
          role: UserRole.DRIVER,
          isVerified: true,
        },
        create: {
          email: profile.email,
          firstName: 'colins',
          lastName: profile.lastName,
          phone: profile.phone,
          password: hashedPassword,
          role: UserRole.DRIVER,
          isVerified: false,
        },
      });

      // 2. Create or Update Driver Profile
      const driver = await prisma.driver.upsert({
        where: { userId: user.id },
        update: {
          isOnline: true,
          lastKnownLatitude: location[0],
          lastKnownLongitude: location[1],
          lastLocationUpdate: new Date(),
        },
        create: {
          userId: user.id,
          onboardingCompleted: true,
          onboardingStep: 3,
          isOnline: true,
          lastKnownLatitude: location[0],
          lastKnownLongitude: location[1],
          lastLocationUpdate: new Date(),
        },
      });

      // 3. Find Manufacturer to get ID
      const manufacturer = await prisma.vehicleManufacturer.findUnique({
        where: { name: profile.vehicle.manufacturer },
      });

      if (!manufacturer) {
        console.warn(
          `⚠️ Manufacturer not found: ${profile.vehicle.manufacturer}`,
        );
        continue;
      }

      // 4. Find Vehicle Model using Manufacturer ID
      const vehicleModel = await prisma.vehicleModel.findUnique({
        where: {
          manufacturerId_name: {
            manufacturerId: manufacturer.id,
            name: profile.vehicle.modelName,
          },
        },
      });

      if (vehicleModel) {
        // 5. Create or Update Vehicle with correct model relation
        await prisma.vehicle.upsert({
          where: { driverId: driver.id },
          update: {
            plateNumber: profile.vehicle.plateNumber,
            modelId: vehicleModel.id,
          },
          create: {
            driverId: driver.id,
            modelId: vehicleModel.id,
            color: profile.vehicle.color,
            plateNumber: profile.vehicle.plateNumber,
            year: profile.vehicle.year,
            insuranceNumber: `INS-${profile.vehicle.plateNumber}`,
            isActive: true,
            exteriorPhoto: 'https://placehold.co/600x400',
            interiorPhoto: 'https://placehold.co/600x400',
          },
        });
        console.log(
          `✅ Seeded driver & vehicle: ${profile.firstName} ${profile.lastName}`,
        );

        // 6. Update location in Redis (Manual implementation)
        try {
          const longitude = location[1];
          const latitude = location[0];

          // Add to geospatial index
          // await redisClient.geoadd(
          //   'available_drivers',
          //   longitude,
          //   latitude,
          //   driver.id,
          // );

          // Store metadata
          // const metadataKey = `driver:${driver.id}:location`;
          // await redisClient.hset(metadataKey, {
          //   longitude: longitude,
          //   latitude: latitude,
          // });
          // await redisClient.expire(metadataKey, 1000);

          console.log(
            `   📍 Updated Redis location for ${profile.firstName} [${latitude}, ${longitude}]`,
          );
        } catch (err) {
          console.error(
            `   ❌ Failed to update Redis for ${profile.firstName}:`,
            err,
          );
        }
      } else {
        console.warn(
          `⚠️ Vehicle model not found: ${profile.vehicle.modelName} for ${profile.vehicle.manufacturer}`,
        );
      }
    }

    console.log('🎉 Driver seeding completed!');
  } catch (error) {
    console.error('❌ Driver seeding failed:', error);
    process.exit(1);
  } finally {
    await redisClient.quit();
    await prisma.$disconnect();
  }
}
