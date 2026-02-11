/**
 * Menu Templates Seed
 * 
 * Creates 30 diverse menu templates for different event types
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface MenuTemplateData {
  eventTypeName: string;
  name: string;
  description: string;
  variant: string | null;
  validFrom: Date | null;
  validTo: Date | null;
  isActive: boolean;
  displayOrder: number;
}

const templates: MenuTemplateData[] = [
  // Wesela (10 szablonów)
  {
    eventTypeName: 'Wesele',
    name: 'Menu Weselne Premium',
    description: 'Ekskluzywne menu weselne z daniami gourmet i wykwintnym wyborem alkoholi',
    variant: 'Premium',
    validFrom: null,
    validTo: null,
    isActive: true,
    displayOrder: 1,
  },
  {
    eventTypeName: 'Wesele',
    name: 'Menu Weselne Standard',
    description: 'Klasyczne menu weselne z tradycyjnymi daniami polskimi',
    variant: 'Standard',
    validFrom: null,
    validTo: null,
    isActive: true,
    displayOrder: 2,
  },
  {
    eventTypeName: 'Wesele',
    name: 'Menu Weselne Wiosenne',
    description: 'Sezonowe menu z świeżymi warzywami i lekkimi daniami',
    variant: 'Sezon Wiosenny',
    validFrom: new Date('2026-03-01'),
    validTo: new Date('2026-05-31'),
    isActive: true,
    displayOrder: 3,
  },
  {
    eventTypeName: 'Wesele',
    name: 'Menu Weselne Letnie',
    description: 'Letnie grillowanie i lekkie przekąski',
    variant: 'Sezon Letni',
    validFrom: new Date('2026-06-01'),
    validTo: new Date('2026-08-31'),
    isActive: true,
    displayOrder: 4,
  },
  {
    eventTypeName: 'Wesele',
    name: 'Menu Weselne Jesienne',
    description: 'Bogate smaki jesieni z dziczyzną i grzybami',
    variant: 'Sezon Jesienny',
    validFrom: new Date('2026-09-01'),
    validTo: new Date('2026-11-30'),
    isActive: true,
    displayOrder: 5,
  },
  {
    eventTypeName: 'Wesele',
    name: 'Menu Weselne Zimowe',
    description: 'Rozgrzewające dania zimowe i ciepłe napoie',
    variant: 'Sezon Zimowy',
    validFrom: new Date('2025-12-01'),
    validTo: new Date('2026-02-28'),
    isActive: true,
    displayOrder: 6,
  },
  {
    eventTypeName: 'Wesele',
    name: 'Menu Weselne VIP',
    description: 'Najwyższa półka - kawior, homary, szampan',
    variant: 'VIP',
    validFrom: null,
    validTo: null,
    isActive: true,
    displayOrder: 7,
  },
  {
    eventTypeName: 'Wesele',
    name: 'Menu Weselne Regionalne',
    description: 'Tradycyjne dania śląskie i regionalne',
    variant: 'Regionalne',
    validFrom: null,
    validTo: null,
    isActive: true,
    displayOrder: 8,
  },
  {
    eventTypeName: 'Wesele',
    name: 'Menu Weselne Międzynarodowe',
    description: 'Kuchnie świata - włoska, francuska, hiszpańska',
    variant: 'International',
    validFrom: null,
    validTo: null,
    isActive: true,
    displayOrder: 9,
  },
  {
    eventTypeName: 'Wesele',
    name: 'Menu Weselne Budget',
    description: 'Ekonomiczne menu bez kompromisów na jakości',
    variant: 'Budget',
    validFrom: null,
    validTo: null,
    isActive: true,
    displayOrder: 10,
  },

  // Urodziny (5 szablonów)
  {
    eventTypeName: 'Urodziny',
    name: 'Menu Urodzinowe Dziecięce',
    description: 'Kolorowe menu dla najmłodszych - pizza, frytki, soki',
    variant: 'Dla Dzieci',
    validFrom: null,
    validTo: null,
    isActive: true,
    displayOrder: 11,
  },
  {
    eventTypeName: 'Urodziny',
    name: 'Menu Urodzinowe Młodzieżowe',
    description: 'Burger bar, hot dogi, pizza - idealne dla nastolatków',
    variant: 'Młodzieżowe',
    validFrom: null,
    validTo: null,
    isActive: true,
    displayOrder: 12,
  },
  {
    eventTypeName: 'Urodziny',
    name: 'Menu Urodzinowe Dorosłe',
    description: 'Eleganckie przyjęcie z wykwintnymi przekąskami',
    variant: 'Dla Dorosłych',
    validFrom: null,
    validTo: null,
    isActive: true,
    displayOrder: 13,
  },
  {
    eventTypeName: 'Urodziny',
    name: 'Menu Urodzinowe Premium',
    description: 'Luksusowe przyjęcie urodzinowe z szampanem',
    variant: 'Premium',
    validFrom: null,
    validTo: null,
    isActive: true,
    displayOrder: 14,
  },
  {
    eventTypeName: 'Urodziny',
    name: 'Menu Urodzinowe Tematyczne',
    description: 'Motyw przewodni - hawajskie, meksykańskie, azjatyckie',
    variant: 'Tematyczne',
    validFrom: null,
    validTo: null,
    isActive: true,
    displayOrder: 15,
  },

  // Chrzciny (3 szablony)
  {
    eventTypeName: 'Chrzciny',
    name: 'Menu na Chrzciny Klasyczne',
    description: 'Tradycyjne menu na chrzciny z ciepłymi przekąskami',
    variant: 'Klasyczne',
    validFrom: null,
    validTo: null,
    isActive: true,
    displayOrder: 16,
  },
  {
    eventTypeName: 'Chrzciny',
    name: 'Menu na Chrzciny Premium',
    description: 'Eleganckie przyjęcie z wykwintnym menu',
    variant: 'Premium',
    validFrom: null,
    validTo: null,
    isActive: true,
    displayOrder: 17,
  },
  {
    eventTypeName: 'Chrzciny',
    name: 'Menu na Chrzciny Rodzinne',
    description: 'Rodzinne przyjęcie z menu dla każdego',
    variant: 'Rodzinne',
    validFrom: null,
    validTo: null,
    isActive: true,
    displayOrder: 18,
  },

  // Komunie (3 szablony)
  {
    eventTypeName: 'Komunia',
    name: 'Menu Komunijne Standard',
    description: 'Klasyczne menu komunijne dla rodziny i przyjaciół',
    variant: 'Standard',
    validFrom: null,
    validTo: null,
    isActive: true,
    displayOrder: 19,
  },
  {
    eventTypeName: 'Komunia',
    name: 'Menu Komunijne Premium',
    description: 'Uroczyste menu na pierwszą komunię świętą',
    variant: 'Premium',
    validFrom: null,
    validTo: null,
    isActive: true,
    displayOrder: 20,
  },
  {
    eventTypeName: 'Komunia',
    name: 'Menu Komunijne Wiosenne',
    description: 'Lekkie wiosenne menu na komunię majową',
    variant: 'Wiosenne',
    validFrom: new Date('2026-04-01'),
    validTo: new Date('2026-06-30'),
    isActive: true,
    displayOrder: 21,
  },

  // Rocznice (3 szablony)
  {
    eventTypeName: 'Rocznica',
    name: 'Menu Rocznicowe Romantyczne',
    description: 'Romantyczne menu na rocznicę ślubu',
    variant: 'Romantyczne',
    validFrom: null,
    validTo: null,
    isActive: true,
    displayOrder: 22,
  },
  {
    eventTypeName: 'Rocznica',
    name: 'Menu Rocznicowe Jubileusz',
    description: 'Uroczyste menu na okrągłe rocznice - 25, 50 lat',
    variant: 'Jubileusz',
    validFrom: null,
    validTo: null,
    isActive: true,
    displayOrder: 23,
  },
  {
    eventTypeName: 'Rocznica',
    name: 'Menu Rocznicowe Rodzinne',
    description: 'Menu dla całej rodziny z różnymi pokoleniami',
    variant: 'Rodzinne',
    validFrom: null,
    validTo: null,
    isActive: true,
    displayOrder: 24,
  },

  // Firmowe (3 szablony)
  {
    eventTypeName: 'Wydarzenie firmowe',
    name: 'Menu Firmowe Konferencja',
    description: 'Przerwy kawowe i lunch dla uczestników konferencji',
    variant: 'Konferencja',
    validFrom: null,
    validTo: null,
    isActive: true,
    displayOrder: 25,
  },
  {
    eventTypeName: 'Wydarzenie firmowe',
    name: 'Menu Firmowe Gala',
    description: 'Elegancka kolacja galowa dla partnerów biznesowych',
    variant: 'Gala',
    validFrom: null,
    validTo: null,
    isActive: true,
    displayOrder: 26,
  },
  {
    eventTypeName: 'Wydarzenie firmowe',
    name: 'Menu Firmowe Team Building',
    description: 'Nieformalne menu na integrację zespołu',
    variant: 'Team Building',
    validFrom: null,
    validTo: null,
    isActive: true,
    displayOrder: 27,
  },

  // Inne (3 szablony)
  {
    eventTypeName: 'Inne',
    name: 'Menu Wegetariańskie',
    description: 'Kompletne menu bez mięsa i ryb',
    variant: 'Wegetariańskie',
    validFrom: null,
    validTo: null,
    isActive: true,
    displayOrder: 28,
  },
  {
    eventTypeName: 'Inne',
    name: 'Menu Wegańskie',
    description: '100% roślinne menu na każdą okazję',
    variant: 'Wegańskie',
    validFrom: null,
    validTo: null,
    isActive: true,
    displayOrder: 29,
  },
  {
    eventTypeName: 'Inne',
    name: 'Menu Bezglutenowe',
    description: 'Menu dla osób z nietolerancją glutenu',
    variant: 'Bezglutenowe',
    validFrom: null,
    validTo: null,
    isActive: true,
    displayOrder: 30,
  },
];

async function main() {
  console.log('🌱 Seeding menu templates...');

  let created = 0;
  let skipped = 0;

  for (const templateData of templates) {
    // Find event type
    const eventType = await prisma.eventType.findFirst({
      where: { name: templateData.eventTypeName },
    });

    if (!eventType) {
      console.log(`⚠️  Event type "${templateData.eventTypeName}" not found, skipping template "${templateData.name}"`);
      skipped++;
      continue;
    }

    // Check if template already exists
    const existing = await prisma.menuTemplate.findFirst({
      where: {
        eventTypeId: eventType.id,
        name: templateData.name,
        variant: templateData.variant,
      },
    });

    if (existing) {
      skipped++;
      continue;
    }

    // Create template
    await prisma.menuTemplate.create({
      data: {
        eventTypeId: eventType.id,
        name: templateData.name,
        description: templateData.description,
        variant: templateData.variant,
        validFrom: templateData.validFrom,
        validTo: templateData.validTo,
        isActive: templateData.isActive,
        displayOrder: templateData.displayOrder,
      },
    });

    created++;
  }

  const total = await prisma.menuTemplate.count();

  console.log('\n✅ Seed complete!');
  console.log(`   Created: ${created} templates`);
  console.log(`   Skipped: ${skipped} templates (already exist)`);
  console.log(`   Total in database: ${total}`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding menu templates:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
