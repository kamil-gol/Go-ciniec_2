/**
 * 🍽️ Menu System Seed Data
 * 
 * Test data for menu templates, packages, and options.
 * Creates comprehensive menu for 3 event types: Wesele, Urodziny, Komunia
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedMenuSystem() {
  console.log('🍽️  Starting menu system seed...');

  // ═════════════════════════════════════════════════
  // Get Event Types
  // ═════════════════════════════════════════════════

  const weseleType = await prisma.eventType.findFirst({ where: { name: 'Wesele' } });
  const urodzinyType = await prisma.eventType.findFirst({ where: { name: 'Urodziny' } });
  const komuniaType = await prisma.eventType.findFirst({ where: { name: 'Komunia' } });

  if (!weseleType || !urodzinyType || !komuniaType) {
    throw new Error('Event types not found. Run base seed first.');
  }

  // ═════════════════════════════════════════════════
  // Create Menu Options (Shared across all menus)
  // ═════════════════════════════════════════════════

  console.log('  ➡️ Creating menu options...');

  // Music Options
  const optionDJ = await prisma.menuOption.create({
    data: {
      name: 'DJ + Nagłośnienie',
      description: 'Profesjonalny DJ z pełnym sprzętem nagłaśniającym',
      shortDescription: 'DJ + sprzęt audio (6h)',
      category: 'Muzyka',
      priceType: 'FLAT',
      priceAmount: 2000,
      icon: 'music',
      displayOrder: 1,
    },
  });

  const optionBand = await prisma.menuOption.create({
    data: {
      name: 'Zespół muzyczny',
      description: 'Zespół muzyczny na żywo (5 osób)',
      shortDescription: 'Live band (6h)',
      category: 'Muzyka',
      priceType: 'FLAT',
      priceAmount: 3500,
      icon: 'guitar',
      displayOrder: 2,
    },
  });

  const optionMC = await prisma.menuOption.create({
    data: {
      name: 'Wodzirej',
      description: 'Profesjonalny wodzirej prowadzący zabawę',
      shortDescription: 'Animator zabawy (4h)',
      category: 'Muzyka',
      priceType: 'FLAT',
      priceAmount: 1000,
      icon: 'microphone',
      displayOrder: 3,
    },
  });

  // Alcohol Options
  const optionOpenBar = await prisma.menuOption.create({
    data: {
      name: 'Bar Open',
      description: 'Nieograniczony alkohol: wódka, whisky, gin, piwo, wino',
      shortDescription: 'Alkohol bez limitu',
      category: 'Alkohol',
      priceType: 'PER_PERSON',
      priceAmount: 50,
      icon: 'wine',
      displayOrder: 1,
    },
  });

  const optionTableWine = await prisma.menuOption.create({
    data: {
      name: 'Wino stołowe',
      description: 'Wino czerwone i białe do stołów',
      shortDescription: 'Wino czerwone/białe',
      category: 'Alkohol',
      priceType: 'PER_PERSON',
      priceAmount: 15,
      icon: 'grape',
      displayOrder: 2,
    },
  });

  const optionChampagne = await prisma.menuOption.create({
    data: {
      name: 'Szampan Premium',
      description: 'Szampan francuski do toastu',
      shortDescription: 'Szampan do toastu',
      category: 'Alkohol',
      priceType: 'PER_PERSON',
      priceAmount: 30,
      icon: 'champagne',
      displayOrder: 3,
    },
  });

  const optionBeer = await prisma.menuOption.create({
    data: {
      name: 'Piwo kraftowe',
      description: 'Wybór piw kraftowych (4 rodzaje)',
      shortDescription: 'Piwo specjalne',
      category: 'Alkohol',
      priceType: 'PER_PERSON',
      priceAmount: 20,
      icon: 'beer',
      displayOrder: 4,
    },
  });

  // Photo & Video Options
  const optionPhotographer = await prisma.menuOption.create({
    data: {
      name: 'Fotograf (6h)',
      description: 'Profesjonalny fotograf przez 6 godzin + 500 zdjęć w wersji cyfrowej',
      shortDescription: 'Fotograf + 500 zdjęć',
      category: 'Foto & Video',
      priceType: 'FLAT',
      priceAmount: 2500,
      icon: 'camera',
      displayOrder: 1,
    },
  });

  const optionVideographer = await prisma.menuOption.create({
    data: {
      name: 'Filmowanie',
      description: 'Profesjonalne filmowanie z dronem + montaż 30 min',
      shortDescription: 'Kamera + dron + montaż',
      category: 'Foto & Video',
      priceType: 'FLAT',
      priceAmount: 3000,
      icon: 'video',
      displayOrder: 2,
    },
  });

  const optionPhotobooth = await prisma.menuOption.create({
    data: {
      name: 'Fotobudka',
      description: 'Fotobudka z gadgetami i natychmiastowym wydrukiem',
      shortDescription: 'Fotobudka z wydrukami',
      category: 'Foto & Video',
      priceType: 'FLAT',
      priceAmount: 800,
      icon: 'polaroid',
      displayOrder: 3,
    },
  });

  // Decorations Options
  const optionFloralPremium = await prisma.menuOption.create({
    data: {
      name: 'Dekoracje kwiatowe Premium',
      description: 'Kompozycje kwiatowe na stoły + dekoracja sali',
      shortDescription: 'Kwiaty na stoły + dekoracje',
      category: 'Dekoracje',
      priceType: 'FLAT',
      priceAmount: 1500,
      icon: 'flower',
      displayOrder: 1,
    },
  });

  const optionLighting = await prisma.menuOption.create({
    data: {
      name: 'Oświetlenie LED',
      description: 'Profesjonalne oświetlenie LED z wibę do muzyki',
      shortDescription: 'LED party lighting',
      category: 'Dekoracje',
      priceType: 'FLAT',
      priceAmount: 600,
      icon: 'lightbulb',
      displayOrder: 2,
    },
  });

  const optionBalloons = await prisma.menuOption.create({
    data: {
      name: 'Balony z helem',
      description: '50 balonowych z helem w kolorach na wybrane',
      shortDescription: '50 balonow + hel',
      category: 'Dekoracje',
      priceType: 'FLAT',
      priceAmount: 300,
      icon: 'balloon',
      displayOrder: 3,
    },
  });

  // Entertainment Options
  const optionMagician = await prisma.menuOption.create({
    data: {
      name: 'Iluzjonista',
      description: 'Pokazy magiczne dla dorosłych (1h)',
      shortDescription: 'Pokazy magiczne (1h)',
      category: 'Rozrywka',
      priceType: 'FLAT',
      priceAmount: 800,
      icon: 'wand',
      displayOrder: 1,
    },
  });

  const optionAnimator = await prisma.menuOption.create({
    data: {
      name: 'Animator dla dzieci',
      description: 'Animator z zabawami i konkursami dla dzieci (3h)',
      shortDescription: 'Animator dziecięcy (3h)',
      category: 'Rozrywka',
      priceType: 'FLAT',
      priceAmount: 500,
      icon: 'smile',
      displayOrder: 2,
    },
  });

  const optionFireshow = await prisma.menuOption.create({
    data: {
      name: 'Pokaz ognisty',
      description: 'Spektakularny pokaz ognia (15 min)',
      shortDescription: 'Fire show (15 min)',
      category: 'Rozrywka',
      priceType: 'FLAT',
      priceAmount: 1200,
      icon: 'fire',
      displayOrder: 3,
    },
  });

  console.log(`  ✅ Created ${15} menu options`);

  // ═════════════════════════════════════════════════
  // 1. WESELE - Menu Template
  // ═════════════════════════════════════════════════

  console.log('\n  💍 Creating WESELE menu...');

  const weseleMenu = await prisma.menuTemplate.create({
    data: {
      eventTypeId: weseleType.id,
      name: 'Menu Weselne Wiosna 2026',
      description: 'Eleganckie menu weselne z tradycyjnymi i nowoczesnymi daniami',
      variant: 'Wiosenne',
      validFrom: new Date('2026-03-01'),
      validTo: new Date('2026-06-30'),
      displayOrder: 1,
    },
  });

  // Package 1: Srebrny
  const weseleSrebrny = await prisma.menuPackage.create({
    data: {
      menuTemplateId: weseleMenu.id,
      name: 'Pakiet Srebrny',
      description: 'Klasyczny pakiet weselny dla oszczędnych',
      shortDescription: 'Podstawowe menu z tradycyjnymi daniami',
      pricePerAdult: 150,
      pricePerChild: 75,
      pricePerToddler: 0,
      color: '#C0C0C0',
      icon: 'award',
      displayOrder: 1,
      includedItems: [
        'Tort 2-piętrowy',
        'Obrus biały',
        'Serwis podstawowy',
        'Kelner (1 osoba)',
        'Bufet zimny',
      ],
      minGuests: 30,
      maxGuests: 80,
    },
  });

  // Package 2: Złoty (Popular)
  const weseleZloty = await prisma.menuPackage.create({
    data: {
      menuTemplateId: weseleMenu.id,
      name: 'Pakiet Złoty',
      description: 'Najbardziej popularny pakiet z bogatym menu',
      shortDescription: 'Rozszerzone menu + dekoracje + obsługa',
      pricePerAdult: 300,
      pricePerChild: 150,
      pricePerToddler: 0,
      color: '#FFD700',
      icon: 'star',
      badgeText: 'Najpopularniejszy',
      displayOrder: 2,
      isPopular: true,
      includedItems: [
        'Tort 3-piętrowy premium',
        'Dekoracje stołów',
        'Serwis premium',
        'Kelnerzy (2 osoby)',
        'Bufet zimny i gorący',
        'Mistrz ceremonii',
      ],
      minGuests: 50,
      maxGuests: 150,
    },
  });

  // Package 3: Diamentowy
  const weseleDiamentowy = await prisma.menuPackage.create({
    data: {
      menuTemplateId: weseleMenu.id,
      name: 'Pakiet Diamentowy',
      description: 'Luksusowy pakiet dla wymagających',
      shortDescription: 'All-inclusive premium experience',
      pricePerAdult: 500,
      pricePerChild: 250,
      pricePerToddler: 0,
      color: '#B9F2FF',
      icon: 'diamond',
      badgeText: 'Premium',
      displayOrder: 3,
      isRecommended: true,
      includedItems: [
        'Tort 4-piętrowy ekskluzywny',
        'Dekoracje kwiatowe premium',
        'Serwis VIP',
        'Kelnerzy (3 osoby)',
        'Bufet gourmet',
        'Szampan w cenie',
        'Fotograf (4h)',
        'Koordinator wesela',
      ],
      minGuests: 80,
      maxGuests: 200,
    },
  });

  // Assign options to Srebrny
  await prisma.menuPackageOption.createMany({
    data: [
      { packageId: weseleSrebrny.id, optionId: optionDJ.id, displayOrder: 1 },
      { packageId: weseleSrebrny.id, optionId: optionBand.id, displayOrder: 2 },
      { packageId: weseleSrebrny.id, optionId: optionOpenBar.id, displayOrder: 3 },
      { packageId: weseleSrebrny.id, optionId: optionTableWine.id, displayOrder: 4, isDefault: true },
      { packageId: weseleSrebrny.id, optionId: optionPhotographer.id, displayOrder: 5 },
    ],
  });

  // Assign options to Złoty
  await prisma.menuPackageOption.createMany({
    data: [
      { packageId: weseleZloty.id, optionId: optionDJ.id, displayOrder: 1, isDefault: true },
      { packageId: weseleZloty.id, optionId: optionBand.id, displayOrder: 2 },
      { packageId: weseleZloty.id, optionId: optionMC.id, displayOrder: 3 },
      { packageId: weseleZloty.id, optionId: optionOpenBar.id, displayOrder: 4 },
      { packageId: weseleZloty.id, optionId: optionTableWine.id, displayOrder: 5, isDefault: true },
      { packageId: weseleZloty.id, optionId: optionChampagne.id, displayOrder: 6 },
      { packageId: weseleZloty.id, optionId: optionPhotographer.id, displayOrder: 7 },
      { packageId: weseleZloty.id, optionId: optionVideographer.id, displayOrder: 8 },
      { packageId: weseleZloty.id, optionId: optionPhotobooth.id, displayOrder: 9 },
      { packageId: weseleZloty.id, optionId: optionFloralPremium.id, displayOrder: 10 },
      { packageId: weseleZloty.id, optionId: optionLighting.id, displayOrder: 11 },
      { packageId: weseleZloty.id, optionId: optionFireshow.id, displayOrder: 12 },
    ],
  });

  // Assign options to Diamentowy (all options available)
  await prisma.menuPackageOption.createMany({
    data: [
      { packageId: weseleDiamentowy.id, optionId: optionDJ.id, displayOrder: 1 },
      { packageId: weseleDiamentowy.id, optionId: optionBand.id, displayOrder: 2, isDefault: true },
      { packageId: weseleDiamentowy.id, optionId: optionMC.id, displayOrder: 3, isDefault: true },
      { packageId: weseleDiamentowy.id, optionId: optionOpenBar.id, displayOrder: 4, isDefault: true },
      { packageId: weseleDiamentowy.id, optionId: optionChampagne.id, displayOrder: 5, customPrice: 25 }, // Discounted
      { packageId: weseleDiamentowy.id, optionId: optionBeer.id, displayOrder: 6 },
      { packageId: weseleDiamentowy.id, optionId: optionVideographer.id, displayOrder: 7 },
      { packageId: weseleDiamentowy.id, optionId: optionPhotobooth.id, displayOrder: 8, isDefault: true },
      { packageId: weseleDiamentowy.id, optionId: optionLighting.id, displayOrder: 9, customPrice: 0 }, // FREE
      { packageId: weseleDiamentowy.id, optionId: optionBalloons.id, displayOrder: 10 },
      { packageId: weseleDiamentowy.id, optionId: optionMagician.id, displayOrder: 11 },
      { packageId: weseleDiamentowy.id, optionId: optionFireshow.id, displayOrder: 12, isDefault: true },
    ],
  });

  console.log(`  ✅ Created WESELE menu with 3 packages`);

  // ═════════════════════════════════════════════════
  // 2. URODZINY - Menu Template
  // ═════════════════════════════════════════════════

  console.log('\n  🎂 Creating URODZINY menu...');

  const urodzinyMenu = await prisma.menuTemplate.create({
    data: {
      eventTypeId: urodzinyType.id,
      name: 'Menu Urodzinowe 2026',
      description: 'Menu urodzinowe dla dzieci i dorosłych',
      validFrom: new Date('2026-01-01'),
      validTo: new Date('2026-12-31'),
      displayOrder: 1,
    },
  });

  // Package 1: Dziecięce
  const urodzinyDzieciece = await prisma.menuPackage.create({
    data: {
      menuTemplateId: urodzinyMenu.id,
      name: 'Pakiet Dziecięce',
      description: 'Idealne urodziny dla dzieci z animacjami',
      shortDescription: 'Menu dla dzieci + animator + zabawy',
      pricePerAdult: 80,
      pricePerChild: 60,
      pricePerToddler: 30,
      color: '#FF69B4',
      icon: 'cake',
      displayOrder: 1,
      isPopular: true,
      includedItems: [
        'Tort urodzinowy',
        'Dekoracje balonowe',
        'Serwis jednorazowy kolorowy',
        'Napoje bezalkoholowe',
        'Pizza i nuggetsy',
      ],
      minGuests: 10,
      maxGuests: 40,
    },
  });

  // Package 2: Dorosłe
  const urodzinyDorosle = await prisma.menuPackage.create({
    data: {
      menuTemplateId: urodzinyMenu.id,
      name: 'Pakiet Dorosłe',
      description: 'Eleganckie przyjęcie urodzinowe',
      shortDescription: 'Menu premium + alkohol + muzyka',
      pricePerAdult: 120,
      pricePerChild: 60,
      pricePerToddler: 0,
      color: '#8B4513',
      icon: 'gift',
      displayOrder: 2,
      includedItems: [
        'Tort premium',
        'Dekoracje eleganckie',
        'Serwis porcelanowy',
        'Bufet zimny',
        'Grill (letnie miesiące)',
      ],
      minGuests: 20,
      maxGuests: 80,
    },
  });

  // Assign options to Dziecięce
  await prisma.menuPackageOption.createMany({
    data: [
      { packageId: urodzinyDzieciece.id, optionId: optionAnimator.id, displayOrder: 1, isDefault: true },
      { packageId: urodzinyDzieciece.id, optionId: optionMagician.id, displayOrder: 2 },
      { packageId: urodzinyDzieciece.id, optionId: optionPhotobooth.id, displayOrder: 3 },
      { packageId: urodzinyDzieciece.id, optionId: optionBalloons.id, displayOrder: 4, isDefault: true },
      { packageId: urodzinyDzieciece.id, optionId: optionPhotographer.id, displayOrder: 5 },
    ],
  });

  // Assign options to Dorosłe
  await prisma.menuPackageOption.createMany({
    data: [
      { packageId: urodzinyDorosle.id, optionId: optionDJ.id, displayOrder: 1 },
      { packageId: urodzinyDorosle.id, optionId: optionBand.id, displayOrder: 2 },
      { packageId: urodzinyDorosle.id, optionId: optionOpenBar.id, displayOrder: 3 },
      { packageId: urodzinyDorosle.id, optionId: optionTableWine.id, displayOrder: 4, isDefault: true },
      { packageId: urodzinyDorosle.id, optionId: optionBeer.id, displayOrder: 5 },
      { packageId: urodzinyDorosle.id, optionId: optionPhotographer.id, displayOrder: 6 },
      { packageId: urodzinyDorosle.id, optionId: optionPhotobooth.id, displayOrder: 7 },
      { packageId: urodzinyDorosle.id, optionId: optionFloralPremium.id, displayOrder: 8 },
      { packageId: urodzinyDorosle.id, optionId: optionLighting.id, displayOrder: 9 },
      { packageId: urodzinyDorosle.id, optionId: optionMagician.id, displayOrder: 10 },
    ],
  });

  console.log(`  ✅ Created URODZINY menu with 2 packages`);

  // ═════════════════════════════════════════════════
  // 3. KOMUNIA - Menu Template
  // ═════════════════════════════════════════════════

  console.log('\n  ⛪ Creating KOMUNIA menu...');

  const komuniaMenu = await prisma.menuTemplate.create({
    data: {
      eventTypeId: komuniaType.id,
      name: 'Menu Komunijne Wiosna 2026',
      description: 'Tradycyjne menu komunijne',
      validFrom: new Date('2026-04-01'),
      validTo: new Date('2026-06-30'),
      displayOrder: 1,
    },
  });

  // Package 1: Basic
  const komuniaBasic = await prisma.menuPackage.create({
    data: {
      menuTemplateId: komuniaMenu.id,
      name: 'Pakiet Basic',
      description: 'Podstawowe menu komunijne',
      shortDescription: 'Tradycyjne dania + dekoracje',
      pricePerAdult: 100,
      pricePerChild: 50,
      pricePerToddler: 0,
      color: '#87CEEB',
      icon: 'heart',
      displayOrder: 1,
      includedItems: [
        'Tort komunijny',
        'Dekoracje białe',
        'Serwis podstawowy',
        'Bufet zimny',
        'Napoje',
      ],
      minGuests: 30,
      maxGuests: 80,
    },
  });

  // Package 2: Premium
  const komuniaPremium = await prisma.menuPackage.create({
    data: {
      menuTemplateId: komuniaMenu.id,
      name: 'Pakiet Premium',
      description: 'Rozszerzone menu z dodatkami',
      shortDescription: 'Menu rozszerzone + animator + foto',
      pricePerAdult: 180,
      pricePerChild: 90,
      pricePerToddler: 0,
      color: '#FFD700',
      icon: 'star',
      badgeText: 'Polecany',
      displayOrder: 2,
      isRecommended: true,
      includedItems: [
        'Tort premium 2-piętrowy',
        'Dekoracje kwiatowe',
        'Serwis porcelanowy',
        'Bufet zimny i gorący',
        'Napoje + wino stołowe',
        'Animator dla dzieci (2h)',
      ],
      minGuests: 40,
      maxGuests: 120,
    },
  });

  // Assign options to Basic
  await prisma.menuPackageOption.createMany({
    data: [
      { packageId: komuniaBasic.id, optionId: optionDJ.id, displayOrder: 1 },
      { packageId: komuniaBasic.id, optionId: optionAnimator.id, displayOrder: 2 },
      { packageId: komuniaBasic.id, optionId: optionTableWine.id, displayOrder: 3 },
      { packageId: komuniaBasic.id, optionId: optionPhotographer.id, displayOrder: 4 },
      { packageId: komuniaBasic.id, optionId: optionBalloons.id, displayOrder: 5 },
    ],
  });

  // Assign options to Premium
  await prisma.menuPackageOption.createMany({
    data: [
      { packageId: komuniaPremium.id, optionId: optionDJ.id, displayOrder: 1, isDefault: true },
      { packageId: komuniaPremium.id, optionId: optionMC.id, displayOrder: 2 },
      { packageId: komuniaPremium.id, optionId: optionOpenBar.id, displayOrder: 3 },
      { packageId: komuniaPremium.id, optionId: optionPhotographer.id, displayOrder: 4, isDefault: true },
      { packageId: komuniaPremium.id, optionId: optionPhotobooth.id, displayOrder: 5 },
      { packageId: komuniaPremium.id, optionId: optionFloralPremium.id, displayOrder: 6 },
      { packageId: komuniaPremium.id, optionId: optionLighting.id, displayOrder: 7 },
      { packageId: komuniaPremium.id, optionId: optionMagician.id, displayOrder: 8 },
    ],
  });

  console.log(`  ✅ Created KOMUNIA menu with 2 packages`);

  console.log('\n✅ Menu system seed completed!');
  console.log(`\n📊 Summary:`);
  console.log(`  - 15 Menu Options created`);
  console.log(`  - 3 Event Types with menus (Wesele, Urodziny, Komunia)`);
  console.log(`  - 7 Total Packages`);
  console.log(`  - Wesele: 3 packages (Srebrny, Złoty, Diamentowy)`);
  console.log(`  - Urodziny: 2 packages (Dziecięce, Dorosłe)`);
  console.log(`  - Komunia: 2 packages (Basic, Premium)`);
}

// Run seed if called directly
if (require.main === module) {
  seedMenuSystem()
    .catch((e) => {
      console.error('❌ Error seeding menu system:', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
