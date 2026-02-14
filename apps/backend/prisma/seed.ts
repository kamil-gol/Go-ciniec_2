import { PrismaClient } from '@prisma/client';
import { seedDishCategories } from './seeds/dish-categories.seed';
import { seedComprehensiveDishes } from './seeds/menu-comprehensive.seed';
import { seedMenuTemplatesAndPackages } from './seeds/menu-templates.seed';
import { seedE2ETestData } from './seeds/e2e-test-data.seed';

const prisma = new PrismaClient();

async function main() {
  console.log('\ud83c\udf31 Starting database seeding...');
  console.log('='.repeat(60));

  try {
    // 0. Seed dish categories first (SOUP, MAIN_COURSE, etc.)
    console.log('\n\ud83c\udff7\ufe0f  STEP 0: Seeding dish categories...');
    await seedDishCategories();

    // 1. Seed dishes (100+)
    console.log('\n\ud83c\udf7d\ufe0f STEP 1: Seeding dishes...');
    const dishCount = await seedComprehensiveDishes();
    console.log(`\u2705 Seeded ${dishCount} dishes`);

    // 2. Seed menu templates and packages
    console.log('\n\ud83d\udcdd STEP 2: Seeding menu templates & packages...');
    await seedMenuTemplatesAndPackages();
    console.log('\u2705 Seeded templates and packages');

    // 3. Seed E2E test data (halls, users, clients, reservations)
    console.log('\n\ud83e\uddea STEP 3: Seeding E2E test data...');
    await seedE2ETestData();
    console.log('\u2705 Seeded E2E test data');

    // 4. Summary
    console.log('\n' + '='.repeat(60));
    console.log('\ud83c\udf89 Database seeding completed successfully!');
    console.log('='.repeat(60));

    // Print stats
    const stats = await getStats();
    console.log('\n\ud83d\udcca Database Statistics:');
    console.log(`  \ud83c\udf7d\ufe0f Dishes: ${stats.dishes}`);
    console.log(`  \ud83d\udd16 Event Types: ${stats.eventTypes}`);
    console.log(`  \ud83d\udcdd Menu Templates: ${stats.templates}`);
    console.log(`  \ud83d\udce6 Menu Packages: ${stats.packages}`);
    console.log(`  \u2699\ufe0f Category Settings: ${stats.categorySettings}`);
    console.log(`  \ud83c\udfdb\ufe0f Halls: ${stats.halls}`);
    console.log(`  \ud83d\udc65 Users: ${stats.users}`);
    console.log(`  \ud83d\udc64 Clients: ${stats.clients}`);
    console.log(`  \ud83d\udcc5 Reservations: ${stats.reservations}`);
    console.log(`  \ud83d\udcb0 Deposits: ${stats.deposits}`);
    console.log(`  \ud83c\udff7\ufe0f  Dish Categories: ${stats.dishCategories}`);
    console.log('');

  } catch (error) {
    console.error('\u274c Seeding failed:', error);
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
    dishCategories,
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
    prisma.dishCategory.count(),
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
    dishCategories,
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
