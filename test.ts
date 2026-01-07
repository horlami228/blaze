import { PrismaClient, RideStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Starting Ride Simulation ---');

  // 1. Find a rider
  const rider = await prisma.rider.findFirst({
    include: {
      user: true,
    },
  });

  if (!rider) {
    console.error(
      'No rider found in the database. Please seed the database first.',
    );
    return;
  }

  console.log(
    `Found Rider: ${rider.user.firstName} ${rider.user.lastName} (ID: ${rider.id})`,
  );

  // 2. Find a driver with a vehicle
  const driver = await prisma.driver.findFirst({
    where: {
      vehicle: {
        isNot: null,
      },
    },
    include: {
      user: true,
      vehicle: true,
    },
  });

  if (!driver || !driver.vehicle) {
    console.error(
      'No driver with a vehicle found. Please seed the database first.',
    );
    return;
  }

  console.log(
    `Found Driver: ${driver.user.firstName} ${driver.user.lastName} (ID: ${driver.id})`,
  );
  console.log(
    `Vehicle: ${driver.vehicle.plateNumber} (ID: ${driver.vehicle.id})`,
  );

  // 3. Create an ongoing ride
  const ride = await prisma.ride.create({
    data: {
      riderId: rider.id,
      driverId: driver.id,
      vehicleId: driver.vehicle.id,
      status: RideStatus.ONGOING,
      pickupLatitude: 6.5244,
      pickupLongitude: 3.3792,
      pickupAddress: 'Lagos Island, Nigeria',
      dropoffLatitude: 6.4281,
      dropoffLongitude: 3.4219,
      dropoffAddress: 'Victoria Island, Nigeria',
      startDateTime: new Date(),
      fare: 2500.0,
      distance: 12.5,
    },
  });

  console.log('--- Ride Created Successfully ---');
  console.log(`Ride ID: ${ride.id}`);
  console.log(`Status: ${ride.status}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
