import { PrismaClient, VehicleType } from '@prisma/client';
const prisma = new PrismaClient();

const vehicleData = [
  {
    manufacturer: 'Toyota',
    models: [
      {
        name: 'Camry',
        type: VehicleType.SEDAN,
        seats: 4,
      },
      { name: 'RAV4', type: VehicleType.SUV, seats: 5 },
      { name: 'Tacoma', type: VehicleType.TRUCK, seats: 5 },
      { name: '4Runner', type: VehicleType.SUV, seats: 5 },
      { name: 'Prius', type: VehicleType.HATCHBACK, seats: 5 },

      {
        name: 'Corolla',
        type: VehicleType.SEDAN,
        seats: 4,
      },
      {
        name: 'Highlander',
        type: VehicleType.SUV,
        seats: 7,
      },
      {
        name: 'Venza',
        type: VehicleType.SUV,
        seats: 5,
      },
    ],
  },
  {
    manufacturer: 'Honda',
    models: [
      { name: 'Civic', type: VehicleType.SEDAN, seats: 4 },
      { name: 'Accord', type: VehicleType.SEDAN, seats: 5 },
      { name: 'CR-V', type: VehicleType.SUV, seats: 5 },
      { name: 'Pilot', type: VehicleType.SUV, seats: 7 },
      { name: 'Passport', type: VehicleType.SUV, seats: 5 },
      { name: 'Odyssey', type: VehicleType.VAN, seats: 7 },
      {
        name: 'Element',
        type: VehicleType.SUV,
        seats: 4,
      },
    ],
  },
  {
    manufacturer: 'Ford',
    models: [
      { name: 'F-150', type: VehicleType.TRUCK, seats: 5 },
      { name: 'Explorer', type: VehicleType.SUV, seats: 7 },
      { name: 'Escape', type: VehicleType.SUV, seats: 5 },
      { name: 'Ranger', type: VehicleType.TRUCK, seats: 5 },
    ],
  },
  {
    manufacturer: 'Chevrolet',
    models: [
      { name: 'Silverado', type: VehicleType.TRUCK, seats: 5 },
      { name: 'Equinox', type: VehicleType.SUV, seats: 5 },
      { name: 'Malibu', type: VehicleType.SEDAN, seats: 5 },
    ],
  },
  {
    manufacturer: 'Nissan',
    models: [
      { name: 'Altima', type: VehicleType.SEDAN, seats: 5 },
      { name: 'Rogue', type: VehicleType.SUV, seats: 5 },
      { name: 'Titan', type: VehicleType.TRUCK, seats: 5 },
    ],
  },
  {
    manufacturer: 'Hyundai',
    models: [
      { name: 'Elantra', type: VehicleType.SEDAN, seats: 5 },
      { name: 'Tucson', type: VehicleType.SUV, seats: 5 },
      { name: 'Santa Fe', type: VehicleType.SUV, seats: 5 },
    ],
  },
  {
    manufacturer: 'BMW',
    models: [
      { name: '3 Series', type: VehicleType.SEDAN, seats: 5 },
      { name: 'X5', type: VehicleType.SUV, seats: 5 },
      { name: '5 Series', type: VehicleType.SEDAN, seats: 5 },
    ],
  },
  {
    manufacturer: 'Mercedes-Benz',
    models: [
      { name: 'C-Class', type: VehicleType.SEDAN, seats: 5 },
      { name: 'GLC', type: VehicleType.SUV, seats: 5 },
      { name: 'E-Class', type: VehicleType.SEDAN, seats: 5 },
      { name: 'GLA', type: VehicleType.SUV, seats: 5 },

      { name: 'GLE', type: VehicleType.SUV, seats: 5 },
    ],
  },
  {
    manufacturer: 'Audi',
    models: [
      { name: 'A4', type: VehicleType.SEDAN, seats: 5 },
      { name: 'Q5', type: VehicleType.SUV, seats: 5 },
    ],
  },
  {
    manufacturer: 'Tesla',
    models: [
      { name: 'Model 3', type: VehicleType.SEDAN, seats: 5 },
      { name: 'Model Y', type: VehicleType.SUV, seats: 5 },
    ],
  },
  {
    manufacturer: 'Lexus',
    models: [
      { name: 'ES', type: VehicleType.SEDAN, seats: 5 },
      { name: 'IS', type: VehicleType.SEDAN, seats: 5 },
      { name: 'LS', type: VehicleType.SEDAN, seats: 5 },
      { name: 'RX', type: VehicleType.SUV, seats: 5 },
      { name: 'GX', type: VehicleType.SUV, seats: 7 },
      { name: 'LX', type: VehicleType.SUV, seats: 7 },
    ],
  },
  {
    manufacturer: 'Honda (Motorcycle)',
    models: [
      { name: 'CBR', type: VehicleType.MOTORCYCLE, seats: 1 },
      { name: 'CB', type: VehicleType.MOTORCYCLE, seats: 1 },
    ],
  },
  {
    manufacturer: 'Yamaha',
    models: [
      { name: 'YZF', type: VehicleType.MOTORCYCLE, seats: 1 },
      { name: 'MT', type: VehicleType.MOTORCYCLE, seats: 1 },
    ],
  },
  {
    manufacturer: 'Bajaj',
    models: [
      { name: 'Boxer', type: VehicleType.MOTORCYCLE, seats: 1 },
      { name: 'Pulsar', type: VehicleType.MOTORCYCLE, seats: 1 },
    ],
  },
];

export async function seedVehicles() {
  try {
    for (const data of vehicleData) {
      await prisma.$transaction(async (tx) => {
        // Upsert manufacturer
        const manufacturer = await tx.vehicleManufacturer.upsert({
          where: { name: data.manufacturer },
          update: {},
          create: { name: data.manufacturer },
        });

        // Upsert models
        for (const modelData of data.models) {
          const model = await tx.vehicleModel.upsert({
            where: {
              manufacturerId_name: {
                manufacturerId: manufacturer.id,
                name: modelData.name,
              },
            },
            update: {},
            create: {
              manufacturerId: manufacturer.id,
              name: modelData.name,
              type: modelData.type,
              seats: modelData.seats,
            },
          });
        }
      });
      console.log(`✅ Seeded manufacturer: ${data.manufacturer}`);
    }

    console.log('🎉 Vehicle database seeded successfully!');
  } catch (e) {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}
