/**
 * Dishes Seed Data
 * Sample Polish restaurant dishes for testing
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedDishes() {
  console.log('🍽️  Seeding dishes...');

  // Get categories first
  const categories = await prisma.dishCategory.findMany();
  const categoryMap = new Map(categories.map(cat => [cat.slug, cat.id]));

  const getCategoryId = (slug: string): string => {
    const id = categoryMap.get(slug);
    if (!id) throw new Error(`Category ${slug} not found. Run category seed first!`);
    return id;
  };

  const dishes = [
    // ZUPY (Soups)
    {
      name: 'Rosół z makaronem',
      description: 'Tradycyjny polski rosół z makaronem i warzywami',
      categoryId: getCategoryId('SOUP'),
      allergens: ['gluten', 'celery'],
      isActive: true,
    },
    {
      name: 'Żurek na zakwasie',
      description: 'Kwaśna zupa z kiełbasą, jajkiem i ziemniakami',
      categoryId: getCategoryId('SOUP'),
      allergens: ['gluten', 'eggs', 'mustard'],
      isActive: true,
    },
    {
      name: 'Barszcz czerwony',
      description: 'Klarowny barszcz z uszkami lub pasztencikami',
      categoryId: getCategoryId('SOUP'),
      allergens: ['gluten', 'eggs'],
      isActive: true,
    },
    {
      name: 'Pomidorowa z ryżem',
      description: 'Aksamitna zupa pomidorowa z ryżem',
      categoryId: getCategoryId('SOUP'),
      allergens: ['celery'],
      isActive: true,
    },

    // DANIA GŁÓWNE (Main Course)
    {
      name: 'Schabowy z kapustą i ziemniakami',
      description: 'Panierowany kotlet schabowy, kapusta zasmażana, ziemniaki gotowane',
      categoryId: getCategoryId('MAIN_COURSE'),
      allergens: ['gluten', 'eggs'],
      isActive: true,
    },
    {
      name: 'Pierogi ruskie',
      description: '10 pierogów z serem i ziemniakami',
      categoryId: getCategoryId('MAIN_COURSE'),
      allergens: ['gluten', 'eggs', 'dairy'],
      isActive: true,
    },
    {
      name: 'Gołąbki w sosie pomidorowym',
      description: 'Gołąbki z mięsem mielonym i ryżem w sosie pomidorowym',
      categoryId: getCategoryId('MAIN_COURSE'),
      allergens: ['gluten', 'celery'],
      isActive: true,
    },
    {
      name: 'De volaille z frytkami',
      description: 'Pierś z kurczaka faszerowana masłem ziołowym, frytki, surówka',
      categoryId: getCategoryId('MAIN_COURSE'),
      allergens: ['dairy', 'gluten'],
      isActive: true,
    },
    {
      name: 'Schab pieczony',
      description: 'Pieczony schab w sosie własnym z ziemniakami',
      categoryId: getCategoryId('MEAT'),
      allergens: [],
      isActive: true,
    },
    {
      name: 'Filet z kurczaka w sosie śmietanowym',
      description: 'Filet z kurczaka w sosie śmietanowo-pieczarkowym z ryżem',
      categoryId: getCategoryId('MEAT'),
      allergens: ['dairy'],
      isActive: true,
    },

    // DODATKI (Side Dishes)
    {
      name: 'Ziemniaki gotowane',
      description: 'Młode ziemniaki z masłem i koperkiem',
      categoryId: getCategoryId('SIDE_DISH'),
      allergens: ['dairy'],
      isActive: true,
    },
    {
      name: 'Frytki',
      description: 'Chrupiące frytki',
      categoryId: getCategoryId('SIDE_DISH'),
      allergens: [],
      isActive: true,
    },
    {
      name: 'Kasza gryczana',
      description: 'Kasza gryczana z cebulką',
      categoryId: getCategoryId('SIDE_DISH'),
      allergens: [],
      isActive: true,
    },
    {
      name: 'Ryż biały',
      description: 'Ryż biały gotowany',
      categoryId: getCategoryId('SIDE_DISH'),
      allergens: [],
      isActive: true,
    },
    {
      name: 'Surówka z kapusty',
      description: 'Surówka z białej kapusty',
      categoryId: getCategoryId('SIDE_DISH'),
      allergens: [],
      isActive: true,
    },
    {
      name: 'Mizeria',
      description: 'Surówka z ogórka ze śmietaną',
      categoryId: getCategoryId('SIDE_DISH'),
      allergens: ['dairy'],
      isActive: true,
    },

    // SAŁATKI (Salads)
    {
      name: 'Sałatka grecka',
      description: 'Pomidory, ogórek, papryka, cebula, oliwki, ser feta',
      categoryId: getCategoryId('SALAD'),
      allergens: ['dairy'],
      isActive: true,
    },
    {
      name: 'Sałatka Cezar',
      description: 'Sałata rzymska, kurczak, grzanki, parmezan, sos Cezar',
      categoryId: getCategoryId('SALAD'),
      allergens: ['gluten', 'dairy', 'eggs', 'fish'],
      isActive: true,
    },
    {
      name: 'Sałatka warzywna',
      description: 'Mix świeżych warzyw z sosem winegret',
      categoryId: getCategoryId('SALAD'),
      allergens: [],
      isActive: true,
    },

    // DESERY (Desserts)
    {
      name: 'Sernik na zimno',
      description: 'Klasyczny sernik na zimno z bitą śmietaną',
      categoryId: getCategoryId('DESSERT'),
      allergens: ['gluten', 'dairy', 'eggs'],
      isActive: true,
    },
    {
      name: 'Szarlotka z lodami',
      description: 'Ciepła szarlotka z lodami waniliowymi',
      categoryId: getCategoryId('DESSERT'),
      allergens: ['gluten', 'dairy', 'eggs'],
      isActive: true,
    },
    {
      name: 'Tiramisu',
      description: 'Włoski deser kawowy',
      categoryId: getCategoryId('DESSERT'),
      allergens: ['gluten', 'dairy', 'eggs'],
      isActive: true,
    },
    {
      name: 'Lody waniliowe',
      description: 'Trzy gałki lodów waniliowych',
      categoryId: getCategoryId('DESSERT'),
      allergens: ['dairy'],
      isActive: true,
    },

    // NAPOJE (Drinks)
    {
      name: 'Kawa espresso',
      description: 'Kawa espresso',
      categoryId: getCategoryId('DRINK'),
      allergens: [],
      isActive: true,
    },
    {
      name: 'Kawa latte',
      description: 'Kawa z mlekiem',
      categoryId: getCategoryId('DRINK'),
      allergens: ['dairy'],
      isActive: true,
    },
    {
      name: 'Herbata czarna',
      description: 'Herbata czarna',
      categoryId: getCategoryId('DRINK'),
      allergens: [],
      isActive: true,
    },
    {
      name: 'Sok pomarańczowy',
      description: 'Świeżo wyciskany sok pomarańczowy',
      categoryId: getCategoryId('DRINK'),
      allergens: [],
      isActive: true,
    },
    {
      name: 'Woda mineralna',
      description: 'Woda mineralna gazowana/niegazowana',
      categoryId: getCategoryId('DRINK'),
      allergens: [],
      isActive: true,
    },

    // WĘDLINY (Cold Cuts)
    {
      name: 'Talerz wędlin',
      description: 'Mix wędlin - szynka, salami, kabanosy',
      categoryId: getCategoryId('COLD_CUTS'),
      allergens: [],
      isActive: true,
    },
    {
      name: 'Szynka serówka',
      description: 'Plastry szynki serówki',
      categoryId: getCategoryId('COLD_CUTS'),
      allergens: [],
      isActive: true,
    },

    // PRZEKĄSKI (Snacks)
    {
      name: 'Paluchy serowe',
      description: 'Chrupiące paluchy z serem',
      categoryId: getCategoryId('SNACK'),
      allergens: ['gluten', 'dairy', 'eggs'],
      isActive: true,
    },
  ];

  let createdCount = 0;
  let skippedCount = 0;

  for (const dish of dishes) {
    const existing = await prisma.dish.findFirst({
      where: { name: dish.name },
    });

    if (existing) {
      console.log(`  ⏭️  Skipping "${dish.name}" - already exists`);
      skippedCount++;
      continue;
    }

    await prisma.dish.create({
      data: dish,
    });
    console.log(`  ✅ Created "${dish.name}"`);
    createdCount++;
  }

  console.log(`\n✨ Dishes seeding completed!`);
  console.log(`   Created: ${createdCount}`);
  console.log(`   Skipped: ${skippedCount}`);
  console.log(`   Total: ${createdCount + skippedCount}`);
}

// Run if executed directly
if (require.main === module) {
  seedDishes()
    .then(async () => {
      await prisma.$disconnect();
    })
    .catch(async (e) => {
      console.error(e);
      await prisma.$disconnect();
      process.exit(1);
    });
}
