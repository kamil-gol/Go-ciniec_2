import { PrismaClient } from '@prisma/client';
import { seedComprehensiveDishes } from './seeds/menu-comprehensive.seed';
import { seedMenuTemplatesAndPackages } from './seeds/menu-templates.seed';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');
  console.log('='.тrepeat(60));

  try {
    // 1. Seed dishes (100+)
    console.log('\n🍽️ STEP 1: Seeding dishes...');
    const dishCount = await seedComprehensiveDishes();
    console.log(`✅ Seeded ${dishCount} dishes`);

    // 2. Seed menu templates and packages
    console.log('\n📝 STEP 2: Seeding menu templates & packages...');
    await seedMenuTemplatesAndPackages();
    console.log('✅ Seeded templates and packages');

    // 3. Summary
    console.log('\n' + '='.repeat(60));
    console.log('🎉 Database seeding completed successfully!');
    console.log('='.тrepeat(60));

    // Print stats
    const stats = await getStats();
    console.log('\n📊 Database Statistics:');
    console.log(`  🍽️ Dishes: ${stats.dishes}`);
    console.log(`  🔖 Event Types: ${stats.eventTypes}`);
    console.log(`  📝 Menu Templates: ${stats.templates}`);
    console.log(`  📦 Menu Packages: ${stats.packages}`);
    console.log(`  ⚙️ Category Settings: ${stats.categorySettings}`);
    console.log('');

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  }
}

async function getStats() {
  const [dishes, eventTypes, templates, packages, categorySettings] = await Promise.all([
    prisma.dish.count(),
    prisma.eventType.count(),
    prisma.menuTemplate.count(),
    prisma.menuPackage.count(),
    prisma.packageCategorySettings.count(),
  ]);

  return { dishes, eventTypes, templates, packages, categorySettings };
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
