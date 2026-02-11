/**
 * Dish Categories Seed
 * Creates default 13 categories
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DEFAULT_CATEGORIES = [
  {
    slug: 'SOUP',
    name: 'Zupy',
    icon: '🍜',
    color: 'bg-orange-100 text-orange-700',
    displayOrder: 1,
  },
  {
    slug: 'MAIN_COURSE',
    name: 'Dania główne',
    icon: '🍽️',
    color: 'bg-blue-100 text-blue-700',
    displayOrder: 2,
  },
  {
    slug: 'MEAT',
    name: 'Mięsa',
    icon: '🥩',
    color: 'bg-red-100 text-red-700',
    displayOrder: 3,
  },
  {
    slug: 'SIDE_DISH',
    name: 'Dodatki',
    icon: '🥔',
    color: 'bg-yellow-100 text-yellow-700',
    displayOrder: 4,
  },
  {
    slug: 'SALAD',
    name: 'Sałatki',
    icon: '🥗',
    color: 'bg-green-100 text-green-700',
    displayOrder: 5,
  },
  {
    slug: 'APPETIZER',
    name: 'Przystawki',
    icon: '🍤',
    color: 'bg-purple-100 text-purple-700',
    displayOrder: 6,
  },
  {
    slug: 'DESSERT',
    name: 'Desery',
    icon: '🍰',
    color: 'bg-pink-100 text-pink-700',
    displayOrder: 7,
  },
  {
    slug: 'DRINK',
    name: 'Napoje',
    icon: '☕',
    color: 'bg-cyan-100 text-cyan-700',
    displayOrder: 8,
  },
  {
    slug: 'COLD_CUTS',
    name: 'Wędliny',
    icon: '🥓',
    color: 'bg-amber-100 text-amber-700',
    displayOrder: 9,
  },
  {
    slug: 'SNACK',
    name: 'Przekąski',
    icon: '🍿',
    color: 'bg-lime-100 text-lime-700',
    displayOrder: 10,
  },
  {
    slug: 'BREAKFAST',
    name: 'Śniadania',
    icon: '🍳',
    color: 'bg-rose-100 text-rose-700',
    displayOrder: 11,
  },
  {
    slug: 'ADDON',
    name: 'Dodatki specjalne',
    icon: '➕',
    color: 'bg-indigo-100 text-indigo-700',
    displayOrder: 12,
  },
  {
    slug: 'OTHER',
    name: 'Inne',
    icon: '📋',
    color: 'bg-gray-100 text-gray-700',
    displayOrder: 13,
  },
];

export async function seedDishCategories() {
  console.log('🏷️  Seeding dish categories...');

  let createdCount = 0;
  let skippedCount = 0;

  for (const category of DEFAULT_CATEGORIES) {
    const existing = await prisma.dishCategory.findUnique({
      where: { slug: category.slug },
    });

    if (existing) {
      console.log(`  ⏭️  Skipping "${category.name}" (${category.slug}) - already exists`);
      skippedCount++;
      continue;
    }

    await prisma.dishCategory.create({
      data: category,
    });
    console.log(`  ✅ Created "${category.name}" (${category.slug})`);
    createdCount++;
  }

  console.log(`\n✨ Dish categories seeding completed!`);
  console.log(`   Created: ${createdCount}`);
  console.log(`   Skipped: ${skippedCount}`);
  console.log(`   Total: ${createdCount + skippedCount}`);
}

// Run if executed directly
if (require.main === module) {
  seedDishCategories()
    .then(async () => {
      await prisma.$disconnect();
    })
    .catch(async (e) => {
      console.error(e);
      await prisma.$disconnect();
      process.exit(1);
    });
}
