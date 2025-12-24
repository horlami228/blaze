import { seedVehicles } from './vehicle-seed';

async function main() {
  console.log('🌱 Seeding database...');

  await seedVehicles();

  console.log('✅ Seeding completed');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
