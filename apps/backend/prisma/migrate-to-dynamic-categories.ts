/**
 * Migration Script: Convert DishCategory from ENUM to Dynamic Model
 * 
 * This script:
 * 1. Creates DishCategory table via Prisma migrate
 * 2. Seeds 13 default categories
 * 3. Maps all existing dishes to new categories
 * 4. Updates PackageCategorySettings
 * 5. Cleans up old enum columns
 */

import { prisma } from './lib/prisma.js';
import { seedDishCategories } from './seeds/dish-categories.seed';

const ENUM_TO_SLUG_MAP: Record<string, string> = {
  'SOUP': 'SOUP',
  'MAIN_COURSE': 'MAIN_COURSE',
  'MEAT': 'MEAT',
  'SIDE_DISH': 'SIDE_DISH',
  'SALAD': 'SALAD',
  'APPETIZER': 'APPETIZER',
  'DESSERT': 'DESSERT',
  'DRINK': 'DRINK',
  'COLD_CUTS': 'COLD_CUTS',
  'SNACK': 'SNACK',
  'BREAKFAST': 'BREAKFAST',
  'ADDON': 'ADDON',
  'OTHER': 'OTHER',
};

async function migrate() {
  console.log('✨ Starting migration to dynamic categories...\n');

  try {
    // Step 1: Seed categories
    console.log('🌱 Step 1: Seeding categories...');
    await seedDishCategories();

    // Step 2: Get all categories with their IDs
    console.log('\n📊 Step 2: Loading category mappings...');
    const categories = await prisma.dishCategory.findMany();
    const categoryMap = new Map<string, string>();
    categories.forEach(cat => categoryMap.set(cat.slug, cat.id));
    console.log(`   Loaded ${categories.length} categories`);

    // Step 3: Migrate Dish table
    console.log('\n🍽️  Step 3: Migrating dishes...');
    const dishes = await prisma.$queryRaw<Array<{ id: string; temp_category: string }>>`
      SELECT id, temp_category FROM "Dish" WHERE "categoryId" IS NULL
    `;
    
    console.log(`   Found ${dishes.length} dishes to migrate`);
    
    let dishCount = 0;
    for (const dish of dishes) {
      const categoryId = categoryMap.get(dish.temp_category);
      if (categoryId) {
        await prisma.$executeRaw`
          UPDATE "Dish" 
          SET "categoryId" = ${categoryId}::uuid 
          WHERE id = ${dish.id}::uuid
        `;
        dishCount++;
      } else {
        console.log(`   ⚠️  Warning: No category found for ${dish.temp_category}, using OTHER`);
        const otherId = categoryMap.get('OTHER');
        if (otherId) {
          await prisma.$executeRaw`
            UPDATE "Dish" 
            SET "categoryId" = ${otherId}::uuid 
            WHERE id = ${dish.id}::uuid
          `;
          dishCount++;
        }
      }
    }
    console.log(`   ✅ Migrated ${dishCount} dishes`);

    // Step 4: Migrate PackageCategorySettings
    console.log('\n📦 Step 4: Migrating package category settings...');
    const settings = await prisma.$queryRaw<Array<{ id: string; temp_category: string }>>`
      SELECT id, temp_category FROM "PackageCategorySettings" WHERE "categoryId" IS NULL
    `;
    
    console.log(`   Found ${settings.length} settings to migrate`);
    
    let settingsCount = 0;
    for (const setting of settings) {
      const categoryId = categoryMap.get(setting.temp_category);
      if (categoryId) {
        await prisma.$executeRaw`
          UPDATE "PackageCategorySettings" 
          SET "categoryId" = ${categoryId}::uuid 
          WHERE id = ${setting.id}::uuid
        `;
        settingsCount++;
      }
    }
    console.log(`   ✅ Migrated ${settingsCount} settings`);

    // Step 5: Cleanup (drop old columns and enum)
    console.log('\n🧹 Step 5: Cleaning up old columns...');
    await prisma.$executeRaw`ALTER TABLE "Dish" DROP COLUMN IF EXISTS "category"`;
    await prisma.$executeRaw`ALTER TABLE "Dish" DROP COLUMN IF EXISTS "temp_category"`;
    await prisma.$executeRaw`ALTER TABLE "PackageCategorySettings" DROP COLUMN IF EXISTS "category"`;
    await prisma.$executeRaw`ALTER TABLE "PackageCategorySettings" DROP COLUMN IF EXISTS "temp_category"`;
    await prisma.$executeRaw`DROP TYPE IF EXISTS "DishCategory"`;
    console.log('   ✅ Cleanup complete');

    console.log('\n✨✨✨ Migration completed successfully! ✨✨✨\n');
    console.log('📊 Summary:');
    console.log(`   - Categories created: ${categories.length}`);
    console.log(`   - Dishes migrated: ${dishCount}`);
    console.log(`   - Settings migrated: ${settingsCount}`);
    console.log('\n✅ All done! You can now manage categories dynamically.\n');

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration
if (require.main === module) {
  migrate()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { migrate };
