import { PrismaClient } from '@prisma/client';
import { seedDishCategories } from './seeds/dish-categories.seed';
import { seedComprehensiveDishes } from './seeds/menu-comprehensive.seed';
import { seedMenuTemplatesAndPackages } from './seeds/menu-templates.seed';
import { seedE2ETestData } from './seeds/e2e-test-data.seed';
import { seedRBAC } from './seeds/rbac.seed';

const prisma = new PrismaClient();

async function main() {
  console.log('\ud83c\udf31 Starting database seeding...');
  console.log('='.repeat(60));

  const isProduction = process.env.NODE_ENV === 'production';

  if (isProduction) {
    console.log('\n\u26a0\ufe0f  PRODUCTION MODE DETECTED');
    console.log('\u26a0\ufe0f  Skipping E2E test data. Use seed-production.ts for production seeding.');
    console.log('\u26a0\ufe0f  To seed test data anyway, run: NODE_ENV=development npx prisma db seed\n');
  }

  try {
    // 0. Seed RBAC first (permissions, roles, user migration, company settings)
    console.log('\n\ud83d\udd10 STEP 0: Seeding RBAC (roles, permissions, company settings)...');
    const rbacResult = await seedRBAC();
    console.log(`\u2705 RBAC seeded: ${rbacResult.permissionsCount} permissions, ${rbacResult.rolesCount} roles`);

    // 1. Seed dish categories (SOUP, MAIN_COURSE, etc.)
    console.log('\n\ud83c\udff7\ufe0f  STEP 1: Seeding dish categories...');
    await seedDishCategories();

    // 2. Seed dishes (100+)
    console.log('\n\ud83c\udf7d\ufe0f STEP 2: Seeding dishes...');
    const dishCount = await seedComprehensiveDishes();
    console.log(`\u2705 Seeded ${dishCount} dishes`);

    // 3. Seed menu templates and packages
    console.log('\n\ud83d\udcdd STEP 3: Seeding menu templates & packages...');
    await seedMenuTemplatesAndPackages();
    console.log('\u2705 Seeded templates and packages');

    // 4. Seed E2E test data (halls, users, clients, reservations)
    //    ⚠️ SKIPPED IN PRODUCTION — contains test users with known passwords
    if (!isProduction) {
      console.log('\n\ud83e\uddea STEP 4: Seeding E2E test data...');
      await seedE2ETestData();
      console.log('\u2705 Seeded E2E test data');
    } else {
      console.log('\n\u23ed\ufe0f  STEP 4: SKIPPED — E2E test data not seeded in production');
    }

    // 5. Summary
    console.log('\n' + '='.repeat(60));
    console.log('\ud83c\udf89 Database seeding completed successfully!');
    console.log('='.repeat(60));

    // Print stats
    const stats = await getStats();
    console.log('\n\ud83d\udcca Database Statistics:');
    console.log(`  \ud83d\udd11 Permissions: ${stats.permissions}`);
    console.log(`  \ud83d\udee1\ufe0f  Roles: ${stats.roles}`);
    console.log(`  \ud83c\udfe2 Company Settings: ${stats.companySettings}`);
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

    if (isProduction) {
      console.log('\u26a0\ufe0f  REMINDER: No test users were created.');
      console.log('\u26a0\ufe0f  Create your admin account manually or use seed-production.ts');
    }

  } catch (error) {
    console.error('\u274c Seeding failed:', error);
    throw error;
  }
}

async function getStats() {
  const [
    permissions,
    roles,
    companySettings,
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
    prisma.permission.count(),
    prisma.role.count(),
    prisma.companySettings.count(),
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
    permissions,
    roles,
    companySettings,
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
