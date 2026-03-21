/**
 * Migration Script: Menu Option Categories
 * 
 * Converts Polish category names to English for consistency.
 * Run this if you have existing menu options with Polish categories.
 * 
 * Usage:
 *   npx tsx scripts/migrate-menu-option-categories.ts
 */

import { PrismaClient } from '../src/generated/prisma/client.js';
import { MENU_OPTION_CATEGORIES, MenuOptionCategory } from '../src/constants/menuOptionCategories';

const prisma = new PrismaClient();

// Mapping from various formats to standard English
const CATEGORY_MAPPING: Record<string, string> = {
  // Polish to English
  'Alkohol': MENU_OPTION_CATEGORIES.ALCOHOL,
  'Animacje': MENU_OPTION_CATEGORIES.ANIMATIONS,
  'Dekoracje': MENU_OPTION_CATEGORIES.DECORATIONS,
  'Dodatki': MENU_OPTION_CATEGORIES.ADDITIONS,
  'Dodatkowe': MENU_OPTION_CATEGORIES.ADDITIONS,
  'Foto & Video': MENU_OPTION_CATEGORIES.PHOTO_VIDEO,
  'Muzyka': MENU_OPTION_CATEGORIES.MUSIC,
  'Rozrywka': MENU_OPTION_CATEGORIES.ENTERTAINMENT,
  'Jedzenie': MENU_OPTION_CATEGORIES.FOOD,
  'Napoje': MENU_OPTION_CATEGORIES.DRINKS,
  'Usługi': MENU_OPTION_CATEGORIES.SERVICES,
  'Sprzęt': MENU_OPTION_CATEGORIES.EQUIPMENT,
  'Inne': MENU_OPTION_CATEGORIES.OTHER,
  
  // Uppercase English to proper case
  'ALCOHOL': MENU_OPTION_CATEGORIES.ALCOHOL,
  'DRINK': MENU_OPTION_CATEGORIES.DRINKS,
  'DRINKS': MENU_OPTION_CATEGORIES.DRINKS,
  'DESSERT': MENU_OPTION_CATEGORIES.FOOD, // Desserts fall under Food
  'DESSERTS': MENU_OPTION_CATEGORIES.FOOD,
  'EXTRA_DISH': MENU_OPTION_CATEGORIES.FOOD,
  'FOOD': MENU_OPTION_CATEGORIES.FOOD,
  'SERVICE': MENU_OPTION_CATEGORIES.SERVICES,
  'SERVICES': MENU_OPTION_CATEGORIES.SERVICES,
  'DECORATION': MENU_OPTION_CATEGORIES.DECORATIONS,
  'DECORATIONS': MENU_OPTION_CATEGORIES.DECORATIONS,
  'ENTERTAINMENT': MENU_OPTION_CATEGORIES.ENTERTAINMENT,
  'MUSIC': MENU_OPTION_CATEGORIES.MUSIC,
  'ANIMATIONS': MENU_OPTION_CATEGORIES.ANIMATIONS,
  'PHOTO_VIDEO': MENU_OPTION_CATEGORIES.PHOTO_VIDEO,
  'EQUIPMENT': MENU_OPTION_CATEGORIES.EQUIPMENT,
  'OTHER': MENU_OPTION_CATEGORIES.OTHER,
};

const VALID_CATEGORIES = Object.values(MENU_OPTION_CATEGORIES);

async function migrateCategories() {
  console.log('🚀 Starting menu option category migration...\n');

  let totalUpdated = 0;
  let totalSkipped = 0;
  let totalErrors = 0;

  // Get all menu options
  const options = await prisma.menuOption.findMany({
    select: {
      id: true,
      name: true,
      category: true,
    },
  });

  console.log(`📋 Found ${options.length} menu options to check\n`);

  for (const option of options) {
    const { id, name, category } = option;

    // Check if category needs migration
    if (CATEGORY_MAPPING[category]) {
      const standardCategory = CATEGORY_MAPPING[category];

      // Skip if already in standard format
      if (category === standardCategory) {
        totalSkipped++;
        continue;
      }

      try {
        await prisma.menuOption.update({
          where: { id },
          data: { category: standardCategory },
        });

        console.log(`✅ Updated: "${name}"`);
        console.log(`   ${category} → ${standardCategory}\n`);
        totalUpdated++;
      } catch (error) {
        console.error(`❌ Error updating "${name}":`, error);
        totalErrors++;
      }
    } else if (VALID_CATEGORIES.includes(category as MenuOptionCategory)) {
      // Already in standard format - skip
      totalSkipped++;
    } else {
      // Unknown category
      console.warn(`⚠️  Unknown category: "${category}" for option "${name}"`);
      console.warn(`   Consider mapping this to a valid category\n`);
      totalSkipped++;
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('🎉 Migration complete!\n');
  console.log(`✅ Updated: ${totalUpdated}`);
  console.log(`⏭️  Skipped: ${totalSkipped}`);
  console.log(`❌ Errors:  ${totalErrors}`);
  console.log('='.repeat(60) + '\n');

  if (totalUpdated > 0) {
    console.log('📢 Remember to restart your frontend to see the changes!');
  }
}

// Run migration
migrateCategories()
  .catch((error) => {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
