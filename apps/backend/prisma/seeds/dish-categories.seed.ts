/**
 * Dish Categories Seed
 * Creates default 13 categories and cleans up orphan categories
 */

import { prisma } from '../lib/prisma.js';

const DEFAULT_CATEGORIES = [
  {
    slug: 'SOUP',
    name: 'Zupy',
    icon: '\ud83c\udf5c',
    color: 'bg-orange-100 text-orange-700',
    displayOrder: 1,
  },
  {
    slug: 'MAIN_COURSE',
    name: 'Dania g\u0142\u00f3wne',
    icon: '\ud83c\udf7d\ufe0f',
    color: 'bg-blue-100 text-blue-700',
    displayOrder: 2,
  },
  {
    slug: 'MEAT',
    name: 'Mi\u0119sa',
    icon: '\ud83e\udd69',
    color: 'bg-red-100 text-red-700',
    displayOrder: 3,
  },
  {
    slug: 'SIDE_DISH',
    name: 'Dodatki',
    icon: '\ud83e\udd54',
    color: 'bg-yellow-100 text-yellow-700',
    displayOrder: 4,
  },
  {
    slug: 'SALAD',
    name: 'Sa\u0142atki',
    icon: '\ud83e\udd57',
    color: 'bg-green-100 text-green-700',
    displayOrder: 5,
  },
  {
    slug: 'APPETIZER',
    name: 'Przystawki',
    icon: '\ud83c\udf64',
    color: 'bg-purple-100 text-purple-700',
    displayOrder: 6,
  },
  {
    slug: 'DESSERT',
    name: 'Desery',
    icon: '\ud83c\udf70',
    color: 'bg-pink-100 text-pink-700',
    displayOrder: 7,
  },
  {
    slug: 'DRINK',
    name: 'Napoje',
    icon: '\u2615',
    color: 'bg-cyan-100 text-cyan-700',
    displayOrder: 8,
  },
  {
    slug: 'COLD_CUTS',
    name: 'W\u0119dliny',
    icon: '\ud83e\udd53',
    color: 'bg-amber-100 text-amber-700',
    displayOrder: 9,
  },
  {
    slug: 'SNACK',
    name: 'Przek\u0105ski',
    icon: '\ud83c\udf7f',
    color: 'bg-lime-100 text-lime-700',
    displayOrder: 10,
  },
  {
    slug: 'BREAKFAST',
    name: '\u015aniadania',
    icon: '\ud83c\udf73',
    color: 'bg-rose-100 text-rose-700',
    displayOrder: 11,
  },
  {
    slug: 'ADDON',
    name: 'Dodatki specjalne',
    icon: '\u2795',
    color: 'bg-indigo-100 text-indigo-700',
    displayOrder: 12,
  },
  {
    slug: 'OTHER',
    name: 'Inne',
    icon: '\ud83d\udccb',
    color: 'bg-gray-100 text-gray-700',
    displayOrder: 13,
  },
];

const KNOWN_SLUGS = DEFAULT_CATEGORIES.map(c => c.slug);

export async function seedDishCategories() {
  console.log('\ud83c\udff7\ufe0f  Seeding dish categories...');

  let createdCount = 0;
  let skippedCount = 0;

  for (const category of DEFAULT_CATEGORIES) {
    const existing = await prisma.dishCategory.findUnique({
      where: { slug: category.slug },
    });

    if (existing) {
      console.log(`  \u23ed\ufe0f  Skipping "${category.name}" (${category.slug}) - already exists`);
      skippedCount++;
      continue;
    }

    await prisma.dishCategory.create({
      data: category,
    });
    console.log(`  \u2705 Created "${category.name}" (${category.slug})`);
    createdCount++;
  }

  // Clean up orphan categories not in the known slug list
  const orphanCategories = await prisma.dishCategory.findMany({
    where: {
      slug: { notIn: KNOWN_SLUGS },
    },
    include: {
      _count: {
        select: {
          dishes: true,
          categorySettings: true,
        },
      },
    },
  });

  let deletedCount = 0;
  let keptCount = 0;

  for (const orphan of orphanCategories) {
    const hasRefs = orphan._count.dishes > 0 || orphan._count.categorySettings > 0;

    if (hasRefs) {
      console.log(`  \u26a0\ufe0f  Keeping orphan "${orphan.name}" (${orphan.slug}) - has ${orphan._count.dishes} dishes, ${orphan._count.categorySettings} settings`);
      keptCount++;
    } else {
      await prisma.dishCategory.delete({ where: { id: orphan.id } });
      console.log(`  \ud83d\uddd1\ufe0f  Deleted orphan "${orphan.name}" (${orphan.slug})`);
      deletedCount++;
    }
  }

  console.log(`\n\u2728 Dish categories seeding completed!`);
  console.log(`   Created: ${createdCount}`);
  console.log(`   Skipped: ${skippedCount}`);
  console.log(`   Deleted orphans: ${deletedCount}`);
  if (keptCount > 0) {
    console.log(`   Kept orphans (has references): ${keptCount}`);
  }
  console.log(`   Total active: ${KNOWN_SLUGS.length}`);
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
