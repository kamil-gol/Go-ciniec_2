/**
 * Menu Packages Seed
 * 
 * Creates 30+ diverse menu packages for templates
 */

import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma.js';

interface PackageData {
  templateNamePattern: string;
  name: string;
  description: string;
  shortDescription: string;
  pricePerAdult: number;
  pricePerChild: number;
  pricePerToddler: number;
  color: string;
  icon: string;
  badgeText: string | null;
  isPopular: boolean;
  isRecommended: boolean;
  includedItems: string[];
  minGuests: number | null;
  maxGuests: number | null;
}

const packages: PackageData[] = [
  // Pakiety Weselne
  {
    templateNamePattern: 'Menu Weselne Premium',
    name: 'Pakiet Diamentowy',
    description: 'Najwyższa półka kulinarna - wykwintne dania i najlepsze alkohole',
    shortDescription: 'Ekskluzywne menu z daniami gourmet',
    pricePerAdult: 250,
    pricePerChild: 120,
    pricePerToddler: 60,
    color: '#9333EA',
    icon: '💎',
    badgeText: 'VIP',
    isPopular: true,
    isRecommended: true,
    includedItems: [
      'Przystawka złota - tatar z łososia',
      'Zupa krem z homara',
      'Polędwica wołowa w sosie trufli',
      'Deser molten lava cake',
      'Open bar premium 8h',
    ],
    minGuests: 50,
    maxGuests: 150,
  },
  {
    templateNamePattern: 'Menu Weselne Standard',
    name: 'Pakiet Złoty',
    description: 'Klasyczne polskie wesele z tradycyjnymi daniami',
    shortDescription: 'Tradycyjne menu polskie',
    pricePerAdult: 180,
    pricePerChild: 90,
    pricePerToddler: 45,
    color: '#EAB308',
    icon: '🍽️',
    badgeText: 'HIT!',
    isPopular: true,
    isRecommended: false,
    includedItems: [
      'Przystawka tradycyjna',
      'Rosół z makaronem',
      'Schabowy ze zbirem',
      'Tort weselny',
      'Open bar standard 6h',
    ],
    minGuests: 50,
    maxGuests: 200,
  },
  {
    templateNamePattern: 'Menu Weselne Standard',
    name: 'Pakiet Sróbriany',
    description: 'Ekonomiczne menu weselne bez kompromisów na jakości',
    shortDescription: 'Optymalne menu weselne',
    pricePerAdult: 150,
    pricePerChild: 75,
    pricePerToddler: 40,
    color: '#6B7280',
    icon: '🍴',
    badgeText: null,
    isPopular: false,
    isRecommended: true,
    includedItems: [
      'Przystawka ciepła',
      'Zupa pomidorowa',
      'Kurczak pieczony',
      'Ciasto domowe',
      'Bar z limitem 4h',
    ],
    minGuests: 30,
    maxGuests: 150,
  },
  {
    templateNamePattern: 'Menu Weselne Wiosenne',
    name: 'Pakiet Wiosenny',
    description: 'Świeże sezonowe produkty w lekkiej odsłonie',
    shortDescription: 'Lekkie menu wiosenne',
    pricePerAdult: 170,
    pricePerChild: 85,
    pricePerToddler: 45,
    color: '#10B981',
    icon: '🌸',
    badgeText: 'SEZON',
    isPopular: false,
    isRecommended: true,
    includedItems: [
      'Carpaccio z młodych warzyw',
      'Zupa krem ze szparagów',
      'Łosośż ze świeżymi ziołami',
      'Deser owocowy',
      'Lemoniady i soki sezonowe',
    ],
    minGuests: 40,
    maxGuests: 120,
  },

  // Pakiety Urodzinowe
  {
    templateNamePattern: 'Menu Urodzinowe Dziecięce',
    name: 'Pakiet Małego Smakosza',
    description: 'Kolorowe i smaczne menu dla najmłodszych',
    shortDescription: 'Menu dla dzieci',
    pricePerAdult: 80,
    pricePerChild: 60,
    pricePerToddler: 40,
    color: '#F59E0B',
    icon: '🎉',
    badgeText: 'DZIECI',
    isPopular: true,
    isRecommended: false,
    includedItems: [
      'Pizza Margherita',
      'Frytki i nuggetsy',
      'Mini burgery',
      'Soki i napoje',
      'Tort urodzinowy',
    ],
    minGuests: 10,
    maxGuests: 40,
  },
  {
    templateNamePattern: 'Menu Urodzinowe Młodzieżowe',
    name: 'Pakiet Party',
    description: 'Imprezowe menu dla młodych ludzi',
    shortDescription: 'Menu imprezowe',
    pricePerAdult: 100,
    pricePerChild: 80,
    pricePerToddler: 0,
    color: '#EC4899',
    icon: '🎈',
    badgeText: 'PARTY',
    isPopular: true,
    isRecommended: true,
    includedItems: [
      'Burger bar',
      'Hot dogi premium',
      'Pizza XXL',
      'Napoje gazowane unlimited',
      'Candy bar',
    ],
    minGuests: 15,
    maxGuests: 50,
  },
  {
    templateNamePattern: 'Menu Urodzinowe Dorosłe',
    name: 'Pakiet Elegancki',
    description: 'Eleganckie przyjęcie urodzinowe dla dorosłych',
    shortDescription: 'Eleganckie menu',
    pricePerAdult: 140,
    pricePerChild: 70,
    pricePerToddler: 40,
    color: '#8B5CF6',
    icon: '🍾',
    badgeText: null,
    isPopular: false,
    isRecommended: true,
    includedItems: [
      'Przekąski na zimno',
      'Dania ciepłe bufet',
      'Desery autorskie',
      'Wina i alkohole',
      'Tort autorski',
    ],
    minGuests: 20,
    maxGuests: 80,
  },

  // Pakiety Chrzciny
  {
    templateNamePattern: 'Menu na Chrzciny Klasyczne',
    name: 'Pakiet Rodzinny',
    description: 'Tradycyjne menu na chrzciny dla rodziny',
    shortDescription: 'Klasyczne menu chrzciny',
    pricePerAdult: 120,
    pricePerChild: 60,
    pricePerToddler: 30,
    color: '#3B82F6',
    icon: '👶',
    badgeText: null,
    isPopular: true,
    isRecommended: false,
    includedItems: [
      'Przekąski na stoły',
      'Zupa pomidorowa',
      'Kotlet schabowy',
      'Ciasto domowe',
      'Kawa i herbata',
    ],
    minGuests: 20,
    maxGuests: 60,
  },
  {
    templateNamePattern: 'Menu na Chrzciny Premium',
    name: 'Pakiet Anielski',
    description: 'Eleganckie przyjęcie z wykwintnym menu',
    shortDescription: 'Premium menu chrzciny',
    pricePerAdult: 160,
    pricePerChild: 80,
    pricePerToddler: 40,
    color: '#A78BFA',
    icon: '👼',
    badgeText: 'PREMIUM',
    isPopular: false,
    isRecommended: true,
    includedItems: [
      'Przystawki na zimno i ciepło',
      'Krem z pomarańczy',
      'Filet z dorsza',
      'Torty artystyczne',
      'Bar kawowy unlimited',
    ],
    minGuests: 30,
    maxGuests: 80,
  },

  // Pakiety Komunijne
  {
    templateNamePattern: 'Menu Komunijne Standard',
    name: 'Pakiet Komunijny Klasyczny',
    description: 'Tradycyjne menu na pierwszą komunię',
    shortDescription: 'Klasyczne menu komunijne',
    pricePerAdult: 130,
    pricePerChild: 80,
    pricePerToddler: 40,
    color: '#FBBF24',
    icon: '⛪',
    badgeText: null,
    isPopular: true,
    isRecommended: false,
    includedItems: [
      'Przystawki tradycyjne',
      'Rosół z makaronem',
      'Kurczak pieczony z ziemniakami',
      'Lody',
      'Napoje dla dzieci',
    ],
    minGuests: 30,
    maxGuests: 100,
  },
  {
    templateNamePattern: 'Menu Komunijne Premium',
    name: 'Pakiet Świętej Uroczystości',
    description: 'Uroczyste menu na pierwszą komunię świętą',
    shortDescription: 'Premium menu komunijne',
    pricePerAdult: 170,
    pricePerChild: 100,
    pricePerToddler: 50,
    color: '#F59E0B',
    icon: '🕊️',
    badgeText: 'PREMIUM',
    isPopular: false,
    isRecommended: true,
    includedItems: [
      'Przystawki zimne i ciepłe',
      'Zupa krem z kury',
      'Polędwiczki wieprzowe',
      'Tort komunijny',
      'Open bar bezalkoholowy',
    ],
    minGuests: 40,
    maxGuests: 120,
  },

  // Pakiety Rocznicowe
  {
    templateNamePattern: 'Menu Rocznicowe Romantyczne',
    name: 'Pakiet Romantyczny',
    description: 'Kameralne menu na rocznicę ślubu',
    shortDescription: 'Menu dla par',
    pricePerAdult: 190,
    pricePerChild: 95,
    pricePerToddler: 50,
    color: '#F43F5E',
    icon: '❤️',
    badgeText: 'LOVE',
    isPopular: true,
    isRecommended: true,
    includedItems: [
      'Owoce morza',
      'Krem z trufli',
      'Polędwica wołowa medium',
      'Deser tiramisu',
      'Wino musujące',
    ],
    minGuests: 20,
    maxGuests: 60,
  },
  {
    templateNamePattern: 'Menu Rocznicowe Jubileusz',
    name: 'Pakiet Złotych Godów',
    description: 'Uroczyste menu na 50-lecie małżeństwa',
    shortDescription: 'Menu jubileuszowe',
    pricePerAdult: 200,
    pricePerChild: 100,
    pricePerToddler: 50,
    color: '#EAB308',
    icon: '💍',
    badgeText: '50 LAT',
    isPopular: false,
    isRecommended: true,
    includedItems: [
      'Przystawki wykwintne',
      'Zupa French Onion',
      'Stek wołowy premium',
      'Deser flambé',
      'Szampan i wina',
    ],
    minGuests: 30,
    maxGuests: 100,
  },

  // Pakiety Firmowe
  {
    templateNamePattern: 'Menu Firmowe Konferencja',
    name: 'Pakiet Business',
    description: 'Przerwy kawowe i lunch biznesowy',
    shortDescription: 'Menu konferencyjne',
    pricePerAdult: 90,
    pricePerChild: 0,
    pricePerToddler: 0,
    color: '#374151',
    icon: '💼',
    badgeText: null,
    isPopular: true,
    isRecommended: false,
    includedItems: [
      'Przerwa kawowa 2x',
      'Lunch bufetowy',
      'Kawa unlimited',
      'Woda mineralna',
      'Owoce',
    ],
    minGuests: 20,
    maxGuests: 200,
  },
  {
    templateNamePattern: 'Menu Firmowe Gala',
    name: 'Pakiet Gala',
    description: 'Elegancka kolacja galowa',
    shortDescription: 'Menu gala',
    pricePerAdult: 220,
    pricePerChild: 0,
    pricePerToddler: 0,
    color: '#1F2937',
    icon: '🎩',
    badgeText: 'GALA',
    isPopular: false,
    isRecommended: true,
    includedItems: [
      'Przystawki wykwintne',
      'Zupa lobster bisque',
      'Filet mignon',
      'Deser autorski',
      'Premium bar 4h',
    ],
    minGuests: 50,
    maxGuests: 150,
  },
  {
    templateNamePattern: 'Menu Firmowe Team Building',
    name: 'Pakiet Integracyjny',
    description: 'Nieformalne menu na integrację',
    shortDescription: 'Menu team building',
    pricePerAdult: 110,
    pricePerChild: 0,
    pricePerToddler: 0,
    color: '#059669',
    icon: '🤝',
    badgeText: 'TEAM',
    isPopular: true,
    isRecommended: false,
    includedItems: [
      'BBQ grill',
      'Sałatki sezonowe',
      'Pizza z pieca',
      'Piwo kraftowe',
      'Napoje chłodzące',
    ],
    minGuests: 15,
    maxGuests: 80,
  },

  // Pakiety Specjalne
  {
    templateNamePattern: 'Menu Wegetariańskie',
    name: 'Pakiet Veggie',
    description: 'Kompletne menu roślinne bez mięsa',
    shortDescription: 'Menu wegetariańskie',
    pricePerAdult: 130,
    pricePerChild: 70,
    pricePerToddler: 40,
    color: '#22C55E',
    icon: '🥗',
    badgeText: 'VEGGIE',
    isPopular: false,
    isRecommended: true,
    includedItems: [
      'Przystawki warzywne',
      'Zupa krem z dyni',
      'Lasagne wegetariańska',
      'Deser wegański',
      'Soki naturalne',
    ],
    minGuests: 20,
    maxGuests: 100,
  },
  {
    templateNamePattern: 'Menu Wegańskie',
    name: 'Pakiet Plant-Based',
    description: '100% roślinne menu bez produktów zwierzęcych',
    shortDescription: 'Menu wegańskie',
    pricePerAdult: 140,
    pricePerChild: 75,
    pricePerToddler: 40,
    color: '#16A34A',
    icon: '🌱',
    badgeText: 'VEGAN',
    isPopular: false,
    isRecommended: false,
    includedItems: [
      'Hummus i falafel',
      'Zupa miso',
      'Curry z tofu',
      'Sernik wegański',
      'Mleka roślinne',
    ],
    minGuests: 15,
    maxGuests: 80,
  },
  {
    templateNamePattern: 'Menu Bezglutenowe',
    name: 'Pakiet Gluten-Free',
    description: 'Menu dla osób z celiakią',
    shortDescription: 'Menu bezglutenowe',
    pricePerAdult: 150,
    pricePerChild: 80,
    pricePerToddler: 45,
    color: '#F97316',
    icon: '🌾',
    badgeText: 'GF',
    isPopular: false,
    isRecommended: true,
    includedItems: [
      'Przystawki bezglutenowe',
      'Zupa jarzynowa',
      'Ryba z warzywami',
      'Tort bezglutenowy',
      'Pieczywo specjalistyczne',
    ],
    minGuests: 10,
    maxGuests: 60,
  },
];

async function main() {
  console.log('🌱 Seeding menu packages...');

  let created = 0;
  let skipped = 0;

  for (const pkgData of packages) {
    // Find template
    const template = await prisma.menuTemplate.findFirst({
      where: { name: pkgData.templateNamePattern },
    });

    if (!template) {
      console.log(`⚠️  Template "${pkgData.templateNamePattern}" not found, skipping package "${pkgData.name}"`);
      skipped++;
      continue;
    }

    // Check if package already exists
    const existing = await prisma.menuPackage.findFirst({
      where: {
        menuTemplateId: template.id,
        name: pkgData.name,
      },
    });

    if (existing) {
      skipped++;
      continue;
    }

    // Create package
    await prisma.menuPackage.create({
      data: {
        menuTemplateId: template.id,
        name: pkgData.name,
        description: pkgData.description,
        shortDescription: pkgData.shortDescription,
        pricePerAdult: new Prisma.Decimal(pkgData.pricePerAdult),
        pricePerChild: new Prisma.Decimal(pkgData.pricePerChild),
        pricePerToddler: new Prisma.Decimal(pkgData.pricePerToddler),
        color: pkgData.color,
        icon: pkgData.icon,
        badgeText: pkgData.badgeText,
        isPopular: pkgData.isPopular,
        isRecommended: pkgData.isRecommended,
        includedItems: pkgData.includedItems,
        minGuests: pkgData.minGuests,
        maxGuests: pkgData.maxGuests,
        displayOrder: created,
      },
    });

    created++;
  }

  const total = await prisma.menuPackage.count();

  console.log('\n✅ Seed complete!');
  console.log(`   Created: ${created} packages`);
  console.log(`   Skipped: ${skipped} packages (already exist or template not found)`);
  console.log(`   Total in database: ${total}`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding menu packages:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
