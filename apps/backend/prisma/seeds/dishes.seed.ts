/**
 * Dishes Seed Data
 * Sample Polish restaurant dishes for testing
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedDishes() {
  console.log('🍽️  Seeding dishes...');

  const dishes = [
    // ZUPY (Soups)
    {
      name: 'Rosół z makaronem',
      description: 'Tradycyjny polski rosół z makaronem i warzywami',
      category: 'SOUP',
      allergens: ['gluten', 'celery'],
      isActive: true,
    },
    {
      name: 'Żurek na zakwasie',
      description: 'Kwaśna zupa z kiełbasą, jajkiem i ziemniakami',
      category: 'SOUP',
      allergens: ['gluten', 'eggs', 'mustard'],
      isActive: true,
    },
    {
      name: 'Barszcz czerwony',
      description: 'Klarowny barszcz z uszkami lub pasztencikami',
      category: 'SOUP',
      allergens: ['gluten', 'eggs'],
      isActive: true,
    },
    {
      name: 'Pomidorowa z ryżem',
      description: 'Aksamitna zupa pomidorowa z ryżem',
      category: 'SOUP',
      allergens: ['celery'],
      isActive: true,
    },

    // DANIA GŁÓWNE (Main Course)
    {
      name: 'Schabowy z kapustą i ziemniakami',
      description: 'Panierowany kotlet schabowy, kapusta zasmażana, ziemniaki gotowane',
      category: 'MAIN_COURSE',
      allergens: ['gluten', 'eggs'],
      isActive: true,
    },
    {
      name: 'Pierogi ruskie',
      description: '10 pierogów z serem i ziemniakami',
      category: 'MAIN_COURSE',
      allergens: ['gluten', 'eggs', 'dairy'],
      isActive: true,
    },
    {
      name: 'Gołąbki w sosie pomidorowym',
      description: 'Gołąbki z mięsem mielonym i ryżem w sosie pomidorowym',
      category: 'MAIN_COURSE',
      allergens: ['gluten', 'celery'],
      isActive: true,
    },
    {
      name: 'De volaille z frytkami',
      description: 'Pierś z kurczaka faszerowana masłem ziołowym, frytki, surówka',
      category: 'MAIN_COURSE',
      allergens: ['dairy', 'gluten'],
      isActive: true,
    },
    {
      name: 'Schab pieczony',
      description: 'Pieczony schab w sosie własnym z ziemniakami',
      category: 'MEAT',
      allergens: [],
      isActive: true,
    },
    {
      name: 'Filet z kurczaka w sosie śmietanowym',
      description: 'Filet z kurczaka w sosie śmietanowo-pieczarkowym z ryżem',
      category: 'MEAT',
      allergens: ['dairy'],
      isActive: true,
    },

    // DODATKI (Side Dishes)
    {
      name: 'Ziemniaki gotowane',
      description: 'Młode ziemniaki z masłem i koperkiem',
      category: 'SIDE_DISH',
      allergens: ['dairy'],
      isActive: true,
    },
    {
      name: 'Frytki',
      description: 'Chrupiące frytki',
      category: 'SIDE_DISH',
      allergens: [],
      isActive: true,
    },
    {
      name: 'Kasza gryczana',
      description: 'Kasza gryczana z cebulką',
      category: 'SIDE_DISH',
      allergens: [],
      isActive: true,
    },
    {
      name: 'Ryż biały',
      description: 'Ryż biały gotowany',
      category: 'SIDE_DISH',
      allergens: [],
      isActive: true,
    },
    {
      name: 'Surówka z kapusty',
      description: 'Surówka z białej kapusty',
      category: 'SIDE_DISH',
      allergens: [],
      isActive: true,
    },
    {
      name: 'Mizeria',
      description: 'Surówka z ogórka ze śmietaną',
      category: 'SIDE_DISH',
      allergens: ['dairy'],
      isActive: true,
    },

    // SAŁATKI (Salads)
    {
      name: 'Sałatka grecka',
      description: 'Pomidory, ogórek, papryka, cebula, oliwki, ser feta',
      category: 'SALAD',
      allergens: ['dairy'],
      isActive: true,
    },
    {
      name: 'Sałatka Cezar',
      description: 'Sałata rzymska, kurczak, grzanki, parmezan, sos Cezar',
      category: 'SALAD',
      allergens: ['gluten', 'dairy', 'eggs', 'fish'],
      isActive: true,
    },
    {
      name: 'Sałatka warzywna',
      description: 'Mix świeżych warzyw z sosem winegret',
      category: 'SALAD',
      allergens: [],
      isActive: true,
    },

    // DESERY (Desserts)
    {
      name: 'Sernik na zimno',
      description: 'Klasyczny sernik na zimno z bitą śmietaną',
      category: 'DESSERT',
      allergens: ['gluten', 'dairy', 'eggs'],
      isActive: true,
    },
    {
      name: 'Szarlotka z lodami',
      description: 'Ciepła szarlotka z lodami waniliowymi',
      category: 'DESSERT',
      allergens: ['gluten', 'dairy', 'eggs'],
      isActive: true,
    },
    {
      name: 'Tiramisu',
      description: 'Włoski deser kawowy',
      category: 'DESSERT',
      allergens: ['gluten', 'dairy', 'eggs'],
      isActive: true,
    },
    {
      name: 'Lody waniliowe',
      description: 'Trzy gałki lodów waniliowych',
      category: 'DESSERT',
      allergens: ['dairy'],
      isActive: true,
    },

    // NAPOJE (Drinks)
    {
      name: 'Kawa espresso',
      description: 'Kawa espresso',
      category: 'DRINK',
      allergens: [],
      isActive: true,
    },
    {
      name: 'Kawa latte',
      description: 'Kawa z mlekiem',
      category: 'DRINK',
      allergens: ['dairy'],
      isActive: true,
    },
    {
      name: 'Herbata czarna',
      description: 'Herbata czarna',
      category: 'DRINK',
      allergens: [],
      isActive: true,
    },
    {
      name: 'Sok pomarańczowy',
      description: 'Świeżo wyciskany sok pomarańczowy',
      category: 'DRINK',
      allergens: [],
      isActive: true,
    },
    {
      name: 'Woda mineralna',
      description: 'Woda mineralna gazowana/niegazowana',
      category: 'DRINK',
      allergens: [],
      isActive: true,
    },

    // WĘDLINY (Cold Cuts)
    {
      name: 'Talerz wędlin',
      description: 'Mix wędlin - szynka, salami, kabanosy',
      category: 'COLD_CUTS',
      allergens: [],
      isActive: true,
    },
    {
      name: 'Szynka serówka',
      description: 'Plastry szynki serówki',
      category: 'COLD_CUTS',
      allergens: [],
      isActive: true,
    },

    // PRZEKASKI (Snacks)
    {
      name: 'Paluchy serowe',
      description: 'Chrupiące paluchy z serem',
      category: 'SNACK',
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
