import { PrismaClient } from '@prisma/client';
import { seedComprehensiveDishes } from './seeds/menu-comprehensive.seed';
import { seedMenuTemplatesAndPackages } from './seeds/menu-templates.seed';
import { seedE2ETestData } from './seeds/e2e-test-data.seed';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');
  console.log('='.repeat(60));

  try {
    // 1. Seed dishes (100+)
    console.log('\n🍽️ STEP 1: Seeding dishes...');
    const dishCount = await seedComprehensiveDishes();
    console.log(`✅ Seeded ${dishCount} dishes`);

    // 2. Seed menu templates and packages
    console.log('\n📝 STEP 2: Seeding menu templates & packages...');
    await seedMenuTemplatesAndPackages();
    console.log('✅ Seeded templates and packages');

    // 3. Seed E2E test data (halls, users, clients, reservations)
    console.log('\n🧪 STEP 3: Seeding E2E test data...');
    await seedE2ETestData();
    console.log('✅ Seeded E2E test data');

    // 4. Summary
    console.log('\n' + '='.repeat(60));
    console.log('🎉 Database seeding completed successfully!');
    console.log('='.repeat(60));

    // Print stats
    const stats = await getStats();
    console.log('\n📊 Database Statistics:');
    console.log(`  🍽️ Dishes: ${stats.dishes}`);
    console.log(`  🔖 Event Types: ${stats.eventTypes}`);
    console.log(`  📝 Menu Templates: ${stats.templates}`);
    console.log(`  📦 Menu Packages: ${stats.packages}`);
    console.log(`  ⚙️ Category Settings: ${stats.categorySettings}`);
    console.log(`  🏛️ Halls: ${stats.halls}`);
    console.log(`  👥 Users: ${stats.users}`);
    console.log(`  👤 Clients: ${stats.clients}`);
    console.log(`  📅 Reservations: ${stats.reservations}`);
    console.log(`  💰 Deposits: ${stats.deposits}`);
    console.log('');

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  }
}

async function getStats() {
  const [
    dishes,
    eventTypes,
    templates,
    packages,
    categorySettings,
    halls,
    users,
    clients,
    reservations,
    deposits,
  ] = await Promise.all([
    prisma.dish.count(),
    prisma.eventType.count(),
    prisma.menuTemplate.count(),
    prisma.menuPackage.count(),
    prisma.packageCategorySettings.count(),
    prisma.hall.count(),
    prisma.user.count(),
    prisma.client.count(),
    prisma.reservation.count(),
    prisma.deposit.count(),
  ]);

  return {
    dishes,
    eventTypes,
    templates,
    packages,
    categorySettings,
    halls,
    users,
    clients,
    reservations,
    deposits,
  };
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
