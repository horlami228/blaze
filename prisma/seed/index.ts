import { seedVehicles } from './vehicle-seed';
import { seedDrivers } from './driver-seed';

async function main() {
  console.log('🌱 Seeding database...');

  // await seedVehicles();
  await seedDrivers();

  console.log('✅ Seeding completed');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
