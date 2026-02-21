/**
 * Seed script for Service Extras
 * Run: npx ts-node prisma/seed-service-extras.ts
 * 
 * Creates 7 categories with 25+ service items for "Gościniec Rodzinny"
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const CATEGORIES = [
  {
    name: 'Tort',
    slug: 'tort',
    description: 'Tort weselny — własny lub z naszej oferty',
    icon: '🎂',
    color: '#F472B6',
    items: [
      {
        name: 'Tort własny klienta',
        description: 'Klient dostarcza własny tort. Prosimy o podanie szczegółów.',
        priceType: 'FREE',
        basePrice: 0,
        icon: '🎂',
        isExclusive: true,
        requiresNote: true,
        noteLabel: 'Opis tortu (ilość pięter, smak, dostawca)',
      },
      {
        name: 'Tort klasyczny 3-piętrowy',
        description: 'Tort weselny 3-piętrowy z naszej cukierni',
        priceType: 'FLAT',
        basePrice: 800,
        icon: '🎂',
        isExclusive: true,
      },
      {
        name: 'Tort premium 5-piętrowy',
        description: 'Tort weselny 5-piętrowy, personalizowany design',
        priceType: 'FLAT',
        basePrice: 1500,
        icon: '🎂',
        isExclusive: true,
      },
      {
        name: 'Candy bar / Słodki stół',
        description: 'Słodki stół z deserami, ciasteczkami, babeczkami',
        priceType: 'PER_PERSON',
        basePrice: 25,
        icon: '🍬',
        isExclusive: false,
      },
    ],
  },
  {
    name: 'Oprawa muzyczna',
    slug: 'muzyka',
    description: 'Muzyka na wesele — DJ, zespół, nagłośnienie',
    icon: '🎵',
    color: '#818CF8',
    items: [
      {
        name: 'DJ',
        description: 'Profesjonalny DJ z nagłośnieniem i oświetleniem',
        priceType: 'FLAT',
        basePrice: 2500,
        icon: '🎧',
        isExclusive: true,
      },
      {
        name: 'Zespół na żywo',
        description: 'Zespół muzyczny (4-5 osób) z repertuarem weselnym',
        priceType: 'FLAT',
        basePrice: 5000,
        icon: '🎸',
        isExclusive: true,
      },
      {
        name: 'DJ + Zespół',
        description: 'DJ na drugą część wieczoru + zespół na pierwszą',
        priceType: 'FLAT',
        basePrice: 6500,
        icon: '🎵',
        isExclusive: true,
      },
      {
        name: 'Muzyka własna klienta',
        description: 'Klient organizuje muzykę we własnym zakresie',
        priceType: 'FREE',
        basePrice: 0,
        icon: '🔇',
        isExclusive: true,
        requiresNote: true,
        noteLabel: 'Opis (kto zapewnia nagłośnienie?)',
      },
    ],
  },
  {
    name: 'Wystrój sali',
    slug: 'wystoj',
    description: 'Dekoracja sali weselnej',
    icon: '💐',
    color: '#34D399',
    items: [
      {
        name: 'Dekoracja klasyczna',
        description: 'Obrusy, serwetki, świece, kwiaty na stołach',
        priceType: 'FLAT',
        basePrice: 1500,
        icon: '🕯️',
        isExclusive: true,
      },
      {
        name: 'Dekoracja premium',
        description: 'Pełna dekoracja florystyczna, napis LOVE, ścianka',
        priceType: 'FLAT',
        basePrice: 3500,
        icon: '💐',
        isExclusive: true,
      },
      {
        name: 'Dekoracja własna klienta',
        description: 'Klient dekoruje salę we własnym zakresie',
        priceType: 'FREE',
        basePrice: 0,
        icon: '🎨',
        isExclusive: true,
        requiresNote: true,
        noteLabel: 'Opis planowanej dekoracji',
      },
      {
        name: 'Oświetlenie dekoracyjne LED',
        description: 'Dodatkowe oświetlenie LED, girlandy świetlne',
        priceType: 'FLAT',
        basePrice: 600,
        icon: '💡',
        isExclusive: false,
      },
    ],
  },
  {
    name: 'Fotografia i wideo',
    slug: 'foto-wideo',
    description: 'Dokumentacja fotograficzna i wideo wydarzenia',
    icon: '📸',
    color: '#FB923C',
    items: [
      {
        name: 'Fotobudka',
        description: 'Fotobudka z rekwizytami i natychmiastowymi wydrukami',
        priceType: 'FLAT',
        basePrice: 1200,
        icon: '📸',
        isExclusive: false,
      },
      {
        name: 'Fotograf (8h)',
        description: 'Profesjonalny fotograf na cały dzień',
        priceType: 'FLAT',
        basePrice: 3500,
        icon: '📷',
        isExclusive: false,
      },
      {
        name: 'Kamerzysta',
        description: 'Profesjonalne wideo z wesela + teledysk',
        priceType: 'FLAT',
        basePrice: 4000,
        icon: '🎬',
        isExclusive: false,
      },
    ],
  },
  {
    name: 'Efekty specjalne',
    slug: 'efekty',
    description: 'Ciężki dym, iskry, bańki i inne efekty',
    icon: '🎆',
    color: '#A78BFA',
    items: [
      {
        name: 'Ciężki dym (pierwszy taniec)',
        description: 'Efekt ciężkiego dymu na parkiecie do pierwszego tańca',
        priceType: 'FLAT',
        basePrice: 500,
        icon: '🌫️',
      },
      {
        name: 'Fontanna iskier',
        description: 'Zimne ognie / fontanna iskier na tort lub pierwszy taniec',
        priceType: 'FLAT',
        basePrice: 400,
        icon: '✨',
      },
      {
        name: 'Bańki mydlane',
        description: 'Maszyna do baniek mydlanych',
        priceType: 'FLAT',
        basePrice: 300,
        icon: '🫧',
      },
      {
        name: 'Napis LOVE podświetlany',
        description: 'Duży podświetlany napis LOVE (120cm)',
        priceType: 'FLAT',
        basePrice: 350,
        icon: '💝',
      },
    ],
  },
  {
    name: 'Transport',
    slug: 'transport',
    description: 'Transport gości i pary młodej',
    icon: '🚗',
    color: '#64748B',
    items: [
      {
        name: 'Samochód do ślubu (limuzyna)',
        description: 'Elegancka limuzyna z kierowcą',
        priceType: 'FLAT',
        basePrice: 1200,
        icon: '🚙',
      },
      {
        name: 'Bus dla gości (do 20 os.)',
        description: 'Bus z kierowcą dla gości — transport na wesele i z powrotem',
        priceType: 'FLAT',
        basePrice: 800,
        icon: '🚌',
      },
    ],
  },
  {
    name: 'Atrakcje dodatkowe',
    slug: 'atrakcje',
    description: 'Animacje, pokazy, rozrywka',
    icon: '🎁',
    color: '#F59E0B',
    items: [
      {
        name: 'Animacje dla dzieci',
        description: 'Animator z programem dla dzieci (3h)',
        priceType: 'FLAT',
        basePrice: 600,
        icon: '🧒',
      },
      {
        name: 'Pokaz barmański (flair)',
        description: 'Pokaz barmański z drinkami dla gości',
        priceType: 'FLAT',
        basePrice: 1500,
        icon: '🍹',
      },
      {
        name: 'Barista / Kawa specialty',
        description: 'Mobilna kawiarnia z baristą (latte art, specialty)',
        priceType: 'PER_PERSON',
        basePrice: 15,
        icon: '☕',
      },
    ],
  },
];

async function main() {
  console.log('🎁 Seeding Service Extras...');

  for (let catIdx = 0; catIdx < CATEGORIES.length; catIdx++) {
    const cat = CATEGORIES[catIdx];

    const category = await prisma.serviceCategory.upsert({
      where: { slug: cat.slug },
      update: {
        name: cat.name,
        description: cat.description,
        icon: cat.icon,
        color: cat.color,
        displayOrder: catIdx,
      },
      create: {
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        icon: cat.icon,
        color: cat.color,
        displayOrder: catIdx,
      },
    });

    console.log(`  ✅ Category: ${cat.icon} ${cat.name} (${category.id})`);

    for (let itemIdx = 0; itemIdx < cat.items.length; itemIdx++) {
      const item = cat.items[itemIdx];

      // Check if item exists by name + category
      const existing = await prisma.serviceItem.findFirst({
        where: { name: item.name, categoryId: category.id },
      });

      if (existing) {
        await prisma.serviceItem.update({
          where: { id: existing.id },
          data: {
            description: item.description,
            priceType: item.priceType,
            basePrice: item.basePrice,
            icon: item.icon || null,
            displayOrder: itemIdx,
            isExclusive: item.isExclusive ?? false,
            requiresNote: item.requiresNote ?? false,
            noteLabel: item.noteLabel ?? null,
          },
        });
        console.log(`    ↻ Updated: ${item.name}`);
      } else {
        await prisma.serviceItem.create({
          data: {
            categoryId: category.id,
            name: item.name,
            description: item.description,
            priceType: item.priceType,
            basePrice: item.basePrice,
            icon: item.icon || null,
            displayOrder: itemIdx,
            isExclusive: item.isExclusive ?? false,
            requiresNote: item.requiresNote ?? false,
            noteLabel: item.noteLabel ?? null,
          },
        });
        console.log(`    ✅ Created: ${item.name}`);
      }
    }
  }

  console.log('\n🎉 Service Extras seeding complete!');
  console.log(`   ${CATEGORIES.length} categories`);
  console.log(`   ${CATEGORIES.reduce((sum, c) => sum + c.items.length, 0)} items`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
