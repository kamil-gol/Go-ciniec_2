/**
 * Seed: Service Extras — example categories & items
 * Run: npx ts-node apps/backend/prisma/seed-service-extras.ts
 *
 * Creates demo catalog for development/testing.
 * Safe to re-run — uses upsert by slug.
 *
 * Updated: #139 — added PER_UNIT examples (Wyposażenie category)
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface SeedCategory {
  slug: string;
  name: string;
  icon: string;
  color: string;
  items: Array<{
    name: string;
    priceType: string;
    basePrice: number;
    icon: string;
    description?: string;
    requiresNote?: boolean;
    noteLabel?: string;
    isExclusive?: boolean;
  }>;
}

const CATEGORIES: SeedCategory[] = [
  {
    slug: 'muzyka',
    name: 'Muzyka i rozrywka',
    icon: '🎵',
    color: '#8B5CF6',
    items: [
      { name: 'DJ', priceType: 'FLAT', basePrice: 2500, icon: '🎧', description: 'Profesjonalny DJ z nagłośnieniem i oświetleniem' },
      { name: 'Zespół muzyczny', priceType: 'FLAT', basePrice: 5000, icon: '🎸', description: 'Zespół na żywo (4-5 osób)', isExclusive: false },
      { name: 'Oprawa muzyczna ceremonii', priceType: 'FLAT', basePrice: 1200, icon: '🎻', description: 'Skrzypce / kwartet smyczkowy na ceremonię' },
      { name: 'Karaoke', priceType: 'FLAT', basePrice: 800, icon: '🎤' },
    ],
  },
  {
    slug: 'torty-slodycze',
    name: 'Torty i słodycze',
    icon: '🎂',
    color: '#EC4899',
    items: [
      { name: 'Tort weselny', priceType: 'PER_PERSON', basePrice: 35, icon: '🎂', requiresNote: true, noteLabel: 'Smak i dekoracja' },
      { name: 'Tort urodzinowy', priceType: 'FLAT', basePrice: 250, icon: '🍰', requiresNote: true, noteLabel: 'Wiek / napis na torcie' },
      { name: 'Sweet table', priceType: 'PER_PERSON', basePrice: 25, icon: '🍪', description: 'Stół ze słodkościami (mini deserki, ciasteczka)' },
      { name: 'Candy bar', priceType: 'FLAT', basePrice: 600, icon: '🍬' },
      { name: 'Fontanna czekoladowa', priceType: 'FLAT', basePrice: 450, icon: '🍫' },
    ],
  },
  {
    slug: 'dekoracje',
    name: 'Dekoracje',
    icon: '💐',
    color: '#10B981',
    items: [
      { name: 'Dekoracja sali — standard', priceType: 'FLAT', basePrice: 1500, icon: '🌸', isExclusive: true },
      { name: 'Dekoracja sali — premium', priceType: 'FLAT', basePrice: 3500, icon: '🌺', isExclusive: true },
      { name: 'Dekoracja stołów (kwiaty)', priceType: 'FLAT', basePrice: 800, icon: '🌷' },
      { name: 'Ścianka do zdjęć', priceType: 'FLAT', basePrice: 600, icon: '📸' },
      { name: 'Balony helowe', priceType: 'PER_UNIT', basePrice: 5, icon: '🎈', description: 'Balon helowy z wstążką' },
      { name: 'Napis LED', priceType: 'FLAT', basePrice: 400, icon: '✨', requiresNote: true, noteLabel: 'Treść napisu' },
    ],
  },
  {
    slug: 'foto-video',
    name: 'Foto i Video',
    icon: '📷',
    color: '#F59E0B',
    items: [
      { name: 'Fotograf', priceType: 'FLAT', basePrice: 3000, icon: '📷', description: 'Reportaż fotograficzny (8h)' },
      { name: 'Kamerzysta', priceType: 'FLAT', basePrice: 4000, icon: '🎬', description: 'Filmowanie + montaż teledysku' },
      { name: 'Fotobudka', priceType: 'FLAT', basePrice: 1500, icon: '🤳', description: 'Fotobudka z rekwizytami (3h)' },
      { name: 'Dron', priceType: 'FLAT', basePrice: 1000, icon: '🚁', description: 'Ujęcia z drona' },
    ],
  },
  {
    slug: 'animacje',
    name: 'Animacje i atrakcje',
    icon: '🎉',
    color: '#EF4444',
    items: [
      { name: 'Animator dla dzieci', priceType: 'FLAT', basePrice: 600, icon: '🤹', description: 'Animator z programem 2h' },
      { name: 'Fajerwerki', priceType: 'FLAT', basePrice: 2000, icon: '🎆' },
      { name: 'Bańki mydlane (pokaz)', priceType: 'FLAT', basePrice: 500, icon: '🫧' },
      { name: 'Ciężki dym (taniec w chmurach)', priceType: 'FLAT', basePrice: 800, icon: '💨' },
      { name: 'Iskry zimne (fontanny)', priceType: 'FLAT', basePrice: 600, icon: '🎇' },
    ],
  },
  {
    slug: 'transport',
    name: 'Transport',
    icon: '🚗',
    color: '#6366F1',
    items: [
      { name: 'Limuzyna', priceType: 'FLAT', basePrice: 1200, icon: '🚗' },
      { name: 'Bus dla gości', priceType: 'FLAT', basePrice: 800, icon: '🚌', requiresNote: true, noteLabel: 'Trasa / liczba osób' },
      { name: 'Bryczka / dorożka', priceType: 'FLAT', basePrice: 600, icon: '🐴' },
    ],
  },
  // #139: New category with PER_UNIT items for testing quantity-based pricing
  {
    slug: 'wyposazenie',
    name: 'Wyposażenie dodatkowe',
    icon: '🪑',
    color: '#0EA5E9',
    items: [
      { name: 'Krzesło chiavari', priceType: 'PER_UNIT', basePrice: 15, icon: '🪑', description: 'Eleganckie krzesło na ceremonię / bankiet' },
      { name: 'Stolik koktajlowy', priceType: 'PER_UNIT', basePrice: 50, icon: '🍸', description: 'Wysoki stolik na drink bar / recepcję' },
      { name: 'Hussen na krzesła', priceType: 'PER_UNIT', basePrice: 8, icon: '🎀', description: 'Białe pokrowce na krzesła z kokardą' },
      { name: 'Lampion LED', priceType: 'PER_UNIT', basePrice: 12, icon: '🏮', description: 'Lampion dekoracyjny LED (ciepłe światło)' },
      { name: 'Namiot / parasol ogrodowy', priceType: 'PER_UNIT', basePrice: 80, icon: '⛱️', description: 'Parasol ogrodowy na ceremonię plenerową' },
    ],
  },
  {
    slug: 'inne',
    name: 'Inne usługi',
    icon: '📦',
    color: '#64748B',
    items: [
      { name: 'Barman / bar mobilny', priceType: 'PER_PERSON', basePrice: 45, icon: '🍸', description: 'Profesjonalny barman z barem mobilnym' },
      { name: 'Barista / kawa specialty', priceType: 'PER_PERSON', basePrice: 15, icon: '☕' },
      { name: 'Ochrona', priceType: 'FLAT', basePrice: 500, icon: '🛡️', description: 'Ochroniarz na wydarzenie' },
      { name: 'Szatnia', priceType: 'FREE', basePrice: 0, icon: '🧥' },
      { name: 'Parking', priceType: 'FREE', basePrice: 0, icon: '🅿️', description: 'Parking dla gości (bezpłatny)' },
      { name: 'Usługa niestandardowa', priceType: 'FLAT', basePrice: 0, icon: '📝', requiresNote: true, noteLabel: 'Opis usługi i ustalona cena' },
    ],
  },
];

async function seedServiceExtras() {
  console.log('🌱 Seeding service extras...');

  for (let catIdx = 0; catIdx < CATEGORIES.length; catIdx++) {
    const cat = CATEGORIES[catIdx];

    const category = await prisma.serviceCategory.upsert({
      where: { slug: cat.slug },
      update: {
        name: cat.name,
        icon: cat.icon,
        color: cat.color,
        displayOrder: catIdx,
      },
      create: {
        name: cat.name,
        slug: cat.slug,
        icon: cat.icon,
        color: cat.color,
        displayOrder: catIdx,
        isActive: true,
      },
    });

    console.log(`  ${cat.icon} ${cat.name} (${cat.items.length} items)`);

    for (let itemIdx = 0; itemIdx < cat.items.length; itemIdx++) {
      const item = cat.items[itemIdx];

      // Check if item already exists by name + category
      const existing = await prisma.serviceItem.findFirst({
        where: { name: item.name, categoryId: category.id },
      });

      if (existing) {
        await prisma.serviceItem.update({
          where: { id: existing.id },
          data: {
            priceType: item.priceType,
            basePrice: item.basePrice,
            icon: item.icon,
            description: item.description || null,
            requiresNote: item.requiresNote || false,
            noteLabel: item.noteLabel || null,
            isExclusive: item.isExclusive || false,
            displayOrder: itemIdx,
          },
        });
      } else {
        await prisma.serviceItem.create({
          data: {
            categoryId: category.id,
            name: item.name,
            priceType: item.priceType,
            basePrice: item.basePrice,
            icon: item.icon,
            description: item.description || null,
            requiresNote: item.requiresNote || false,
            noteLabel: item.noteLabel || null,
            isExclusive: item.isExclusive || false,
            displayOrder: itemIdx,
            isActive: true,
          },
        });
      }
    }
  }

  const totalCategories = await prisma.serviceCategory.count();
  const totalItems = await prisma.serviceItem.count();
  console.log(`\n✅ Done! ${totalCategories} categories, ${totalItems} items total.`);
}

seedServiceExtras()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
