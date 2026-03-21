/**
 * Menu System Seed Data
 * 
 * Creates test menus for 3 event types:
 * 1. Wesele (Wedding) - 3 packages, 15 options
 * 2. Urodziny (Birthday) - 2 packages, 10 options
 * 3. Komunia (First Communion) - 2 packages, 8 options
 */

import { prisma } from '../lib/prisma.js';

// Helper for Decimal fields — Prisma accepts plain numbers
const dec = (num: number) => num;

export async function seedMenuSystem() {
  console.log('🍽️  Starting menu system seed...');

  // Get event types
  const weddingType = await prisma.eventType.findFirst({ where: { name: 'Wesele' } });
  const birthdayType = await prisma.eventType.findFirst({ where: { name: 'Urodziny' } });
  const communionType = await prisma.eventType.findFirst({ where: { name: 'Komunia' } });

  if (!weddingType || !birthdayType || !communionType) {
    console.error('❌ Event types not found! Run base seed first.');
    return;
  }

  // ══════════════════════════════════════════════════
  // 1. WESELE (WEDDING)
  // ══════════════════════════════════════════════════

  console.log('💍 Creating Wedding menu...');

  const weddingMenu = await prisma.menuTemplate.create({
    data: {
      eventTypeId: weddingType.id,
      name: 'Menu Weselne Wiosna 2026',
      description: 'Eleganckie menu weselne z opcjami dopasowanymi do wiosennych uroczystości',
      variant: 'Wiosenne',
      validFrom: new Date('2026-03-01'),
      validTo: new Date('2026-06-30'),
      isActive: true,
      displayOrder: 1,
      imageUrl: '/images/menus/wedding-spring-2026.jpg',
    },
  });

  // Wedding Packages
  const weddingPackageSilver = await prisma.menuPackage.create({
    data: {
      menuTemplateId: weddingMenu.id,
      name: 'Pakiet Srebrny',
      description: 'Klasyczny pakiet weselny idealny dla kameralnych uroczystości',
      shortDescription: 'Elegancja w przystępnej cenie - wszystko czego potrzebujesz',
      pricePerAdult: dec(200),
      pricePerChild: dec(100),
      pricePerToddler: dec(0),
      color: '#C0C0C0',
      icon: 'medal',
      displayOrder: 1,
      isPopular: false,
      isRecommended: false,
      includedItems: [
        'Tort weselny 2-piętrowy',
        'Obrus biały + serwetki',
        'Podstawowy serwis stołowy',
        'Woda mineralna na stołach',
        'Kelner (1 osoba)',
      ],
      minGuests: 30,
      maxGuests: 60,
    },
  });

  const weddingPackageGold = await prisma.menuPackage.create({
    data: {
      menuTemplateId: weddingMenu.id,
      name: 'Pakiet Złoty',
      description: 'Najpopularniejszy wybór par młodych - elegancja i styl w jednym',
      shortDescription: 'Kompleksowa obsługa + dekoracje - żaden szczegół nie zostanie pominięty',
      pricePerAdult: dec(300),
      pricePerChild: dec(150),
      pricePerToddler: dec(0),
      color: '#FFD700',
      icon: 'star',
      badgeText: 'Najpopularniejszy',
      displayOrder: 2,
      isPopular: true,
      isRecommended: true,
      includedItems: [
        'Tort weselny 3-piętrowy',
        'Obrus premium + serwetki kolorowe',
        'Serwis stołowy porcelana',
        'Woda + soki na stołach',
        'Kelnerzy (2 osoby)',
        'Dekoracje stołów (kwiaty + świece)',
        'Podświetlenie LED sali',
        'Napis LED z imionami',
      ],
      minGuests: 50,
      maxGuests: 120,
    },
  });

  const weddingPackageDiamond = await prisma.menuPackage.create({
    data: {
      menuTemplateId: weddingMenu.id,
      name: 'Pakiet Diamentowy',
      description: 'Luksusowy pakiet all-inclusive - spełnienie marzeń każdej pary młodej',
      shortDescription: 'Premium w każdym detalu - VIP obsługa + dodatki ekskluzywne',
      pricePerAdult: dec(500),
      pricePerChild: dec(250),
      pricePerToddler: dec(50),
      color: '#B9F2FF',
      icon: 'gem',
      badgeText: 'Premium',
      displayOrder: 3,
      isPopular: false,
      isRecommended: false,
      includedItems: [
        'Tort weselny 4-piętrowy z figurkami',
        'Obrus premium + krzesła z pokrowcami',
        'Serwis stołowy porcelana premium',
        'Woda + soki + wino stołowe',
        'Kelnerzy (3 osoby) + Sommelier',
        'Dekoracje ekskluzywne (kwiaty premium + świece)',
        'Fontanna czekoladowa',
        'Stół z fontanną szampana',
        'Podświetlenie LED + projekcje',
        'Napis LED + ścianka z inicjałami',
        'Koordynator wesela',
      ],
      minGuests: 80,
      maxGuests: 200,
    },
  });

  // Wedding Options
  const weddingOptions = await prisma.menuOption.createMany({
    data: [
      // Muzyka
      {
        name: 'DJ + Nagłośnienie',
        description: 'Profesjonalny DJ z własnym sprzętem nagłaśniającym i oświetleniem',
        shortDescription: 'DJ na całą noc + efekty świetlne',
        category: 'Muzyka',
        priceType: 'FLAT',
        priceAmount: dec(2000),
        icon: 'music',
        isActive: true,
        displayOrder: 1,
      },
      {
        name: 'Zespół muzyczny na żywo',
        description: 'Zespół 4-5 osobowy grający na żywo (5 godzin)',
        shortDescription: 'Live music band - coverband',
        category: 'Muzyka',
        priceType: 'FLAT',
        priceAmount: dec(3500),
        icon: 'music',
        isActive: true,
        displayOrder: 2,
      },
      {
        name: 'Wodzirej',
        description: 'Profesjonalny wodzirej prowadzący całą zabawę',
        shortDescription: 'Animacja + gry + konkursy',
        category: 'Muzyka',
        priceType: 'FLAT',
        priceAmount: dec(1000),
        icon: 'mic',
        isActive: true,
        displayOrder: 3,
      },
      
      // Alkohol
      {
        name: 'Bar Open',
        description: 'Nielimitowany alkohol przez całą noc (wódka, whisky, gin, piwo, wino)',
        shortDescription: 'Open bar na całą noc',
        category: 'Alkohol',
        priceType: 'PER_PERSON',
        priceAmount: dec(50),
        icon: 'wine',
        isActive: true,
        displayOrder: 1,
      },
      {
        name: 'Wino stołowe',
        description: 'Wino białe i czerwone na stołach (0.5L na osobę)',
        shortDescription: 'Wino białe + czerwone',
        category: 'Alkohol',
        priceType: 'PER_PERSON',
        priceAmount: dec(15),
        icon: 'wine',
        isActive: true,
        displayOrder: 2,
      },
      {
        name: 'Szampan premium',
        description: 'Szampan na toast dla wszystkich gości (1 kieliszek/osoba)',
        shortDescription: 'Toast szampanem',
        category: 'Alkohol',
        priceType: 'PER_PERSON',
        priceAmount: dec(30),
        icon: 'champagne',
        isActive: true,
        displayOrder: 3,
      },
      
      // Foto & Video
      {
        name: 'Fotograf (6h)',
        description: 'Profesjonalny fotograf ślubny (6 godzin + 300 obrobionych zdjęć)',
        shortDescription: 'Fotografia ślubna 6h',
        category: 'Foto & Video',
        priceType: 'FLAT',
        priceAmount: dec(2500),
        icon: 'camera',
        isActive: true,
        displayOrder: 1,
      },
      {
        name: 'Filmowanie (cały dzień)',
        description: 'Profesjonalne filmowanie ślubu i wesela z montażem (10+ godzin)',
        shortDescription: 'Film ślubny HD',
        category: 'Foto & Video',
        priceType: 'FLAT',
        priceAmount: dec(3000),
        icon: 'video',
        isActive: true,
        displayOrder: 2,
      },
      {
        name: 'Fotobudka',
        description: 'Fotobudka z rekwizytami (4 godziny)',
        shortDescription: 'Fotobudka z drukiem',
        category: 'Foto & Video',
        priceType: 'FLAT',
        priceAmount: dec(800),
        icon: 'camera',
        isActive: true,
        displayOrder: 3,
      },
      
      // Dekoracje
      {
        name: 'Balony LED',
        description: '50 balonów LED z helem do dekoracji sali',
        shortDescription: 'Balony świecące',
        category: 'Dekoracje',
        priceType: 'FLAT',
        priceAmount: dec(400),
        icon: 'balloon',
        isActive: true,
        displayOrder: 1,
      },
      {
        name: 'Ścianka kwiatowa 3D',
        description: 'Ścianka z kwiatów do zdjęć (2m × 2.5m)',
        shortDescription: 'Fotobudka z kwiatami',
        category: 'Dekoracje',
        priceType: 'FLAT',
        priceAmount: dec(600),
        icon: 'flower',
        isActive: true,
        displayOrder: 2,
      },
      
      // Dodatkowe
      {
        name: 'Parking valet',
        description: 'Obsługa parkingowa dla gości (2 osoby)',
        shortDescription: 'Valet parking',
        category: 'Dodatkowe',
        priceType: 'FLAT',
        priceAmount: dec(500),
        icon: 'car',
        isActive: true,
        displayOrder: 1,
      },
      {
        name: 'Midnight snack',
        description: 'Przekąski o północy (hot dogi, zapiekanki, frytki)',
        shortDescription: 'Drugie danie o 24:00',
        category: 'Dodatkowe',
        priceType: 'PER_PERSON',
        priceAmount: dec(25),
        icon: 'pizza',
        isActive: true,
        displayOrder: 2,
      },
      {
        name: 'Tort z fajerwerkami',
        description: 'Tort z fontannami iskier (cold sparks)',
        shortDescription: 'Efekt WOW przy torcie',
        category: 'Dodatkowe',
        priceType: 'FLAT',
        priceAmount: dec(300),
        icon: 'sparkles',
        isActive: true,
        displayOrder: 3,
      },
    ],
  });

  // Assign options to wedding packages
  const weddingOptionsList = await prisma.menuOption.findMany({
    where: { category: { in: ['Muzyka', 'Alkohol', 'Foto & Video', 'Dekoracje', 'Dodatkowe'] } },
  });

  // Silver Package - 8 options
  const silverOptions = weddingOptionsList.filter(opt => 
    ['DJ + Nagłośnienie', 'Wodzirej', 'Bar Open', 'Wino stołowe', 
     'Fotograf (6h)', 'Fotobudka', 'Balony LED', 'Midnight snack'].includes(opt.name)
  );
  
  for (const [index, option] of silverOptions.entries()) {
    await prisma.menuPackageOption.create({
      data: {
        packageId: weddingPackageSilver.id,
        optionId: option.id,
        displayOrder: index,
        isRequired: false,
        isDefault: false,
      },
    });
  }

  // Gold Package - 12 options
  const goldOptions = weddingOptionsList.filter(opt => 
    !['Parking valet', 'Zespół muzyczny na żywo', 'Szampan premium'].includes(opt.name)
  );
  
  for (const [index, option] of goldOptions.entries()) {
    await prisma.menuPackageOption.create({
      data: {
        packageId: weddingPackageGold.id,
        optionId: option.id,
        displayOrder: index,
        isRequired: false,
        isDefault: option.name === 'DJ + Nagłośnienie', // Pre-selected
      },
    });
  }

  // Diamond Package - All options
  for (const [index, option] of weddingOptionsList.entries()) {
    await prisma.menuPackageOption.create({
      data: {
        packageId: weddingPackageDiamond.id,
        optionId: option.id,
        displayOrder: index,
        isRequired: false,
        isDefault: ['DJ + Nagłośnienie', 'Bar Open', 'Fotograf (6h)'].includes(option.name),
      },
    });
  }

  console.log('✅ Wedding menu created: 3 packages, 15 options');

  // ══════════════════════════════════════════════════
  // 2. URODZINY (BIRTHDAY)
  // ══════════════════════════════════════════════════

  console.log('🎂 Creating Birthday menu...');

  const birthdayMenu = await prisma.menuTemplate.create({
    data: {
      eventTypeId: birthdayType.id,
      name: 'Menu Urodzinowe 2026',
      description: 'Różnorodne opcje na urodziny dziecięce i dorosłe',
      validFrom: new Date('2026-01-01'),
      validTo: new Date('2026-12-31'),
      isActive: true,
      displayOrder: 1,
    },
  });

  // Birthday Packages
  const birthdayPackageKids = await prisma.menuPackage.create({
    data: {
      menuTemplateId: birthdayMenu.id,
      name: 'Pakiet Dziecięcy',
      description: 'Kolorowa zabawa dla najmłodszych',
      shortDescription: 'Animator + dekoracje + tort',
      pricePerAdult: dec(80),
      pricePerChild: dec(50),
      pricePerToddler: dec(0),
      color: '#FF69B4',
      icon: 'cake',
      displayOrder: 1,
      isPopular: true,
      isRecommended: true,
      includedItems: [
        'Tort urodzinowy z figurką',
        'Balony kolorowe (50 szt)',
        'Dekoracje stołów (motyw bajkowy)',
        'Soki + woda',
        'Zastawa jednorazowa kolorowa',
      ],
      minGuests: 10,
      maxGuests: 40,
    },
  });

  const birthdayPackageAdult = await prisma.menuPackage.create({
    data: {
      menuTemplateId: birthdayMenu.id,
      name: 'Pakiet Dorosły',
      description: 'Eleganckie przyjęcie urodzinowe',
      shortDescription: 'DJ + bar + dekoracje',
      pricePerAdult: dec(120),
      pricePerChild: dec(60),
      pricePerToddler: dec(0),
      color: '#4169E1',
      icon: 'party',
      displayOrder: 2,
      isPopular: false,
      isRecommended: false,
      includedItems: [
        'Tort urodzinowy premium',
        'Dekoracje sali',
        'Alkohol podstawowy',
        'Serwis stołowy',
        'Kelner',
      ],
      minGuests: 20,
      maxGuests: 80,
    },
  });

  // Birthday Options
  const birthdayOptions = await prisma.menuOption.createMany({
    data: [
      // Animacje
      {
        name: 'Animator dla dzieci',
        description: 'Profesjonalny animator z programem zabaw (3h)',
        category: 'Animacje',
        priceType: 'FLAT',
        priceAmount: dec(400),
        icon: 'smile',
        isActive: true,
        displayOrder: 1,
      },
      {
        name: 'Malowanie twarzy',
        description: 'Facepainting dla dzieci',
        category: 'Animacje',
        priceType: 'FLAT',
        priceAmount: dec(200),
        icon: 'palette',
        isActive: true,
        displayOrder: 2,
      },
      {
        name: 'Bańki mydlane show',
        description: 'Pokaz baniek mydlanych',
        category: 'Animacje',
        priceType: 'FLAT',
        priceAmount: dec(300),
        icon: 'bubble',
        isActive: true,
        displayOrder: 3,
      },
      
      // Rozrywka
      {
        name: 'DJ + Muzyka',
        description: 'DJ z muzyką dostosowaną do wieku',
        category: 'Rozrywka',
        priceType: 'FLAT',
        priceAmount: dec(1000),
        icon: 'music',
        isActive: true,
        displayOrder: 1,
      },
      {
        name: 'Karaoke',
        description: 'Zestaw karaoke z mikrofonami',
        category: 'Rozrywka',
        priceType: 'FLAT',
        priceAmount: dec(300),
        icon: 'mic',
        isActive: true,
        displayOrder: 2,
      },
      {
        name: 'Konsola do gier',
        description: 'PlayStation 5 z grami + ekran',
        category: 'Rozrywka',
        priceType: 'FLAT',
        priceAmount: dec(200),
        icon: 'gamepad',
        isActive: true,
        displayOrder: 3,
      },
      
      // Dodatki
      {
        name: 'Słodki stół',
        description: 'Candy bar z cukierkami i słodyczami',
        category: 'Dodatki',
        priceType: 'PER_PERSON',
        priceAmount: dec(15),
        icon: 'candy',
        isActive: true,
        displayOrder: 1,
      },
      {
        name: 'Fotobudka',
        description: 'Fotobudka z rekwizytami (3h)',
        category: 'Dodatki',
        priceType: 'FLAT',
        priceAmount: dec(500),
        icon: 'camera',
        isActive: true,
        displayOrder: 2,
      },
      {
        name: 'Popcorn machine',
        description: 'Maszyna do popcornu + operator',
        category: 'Dodatki',
        priceType: 'FLAT',
        priceAmount: dec(250),
        icon: 'popcorn',
        isActive: true,
        displayOrder: 3,
      },
      {
        name: 'Dodatkowa godzina',
        description: 'Przedłużenie imprezy o 1 godzinę',
        category: 'Dodatki',
        priceType: 'FLAT',
        priceAmount: dec(200),
        icon: 'clock',
        isActive: true,
        displayOrder: 4,
      },
    ],
  });

  // Assign options to birthday packages
  const birthdayOptionsList = await prisma.menuOption.findMany({
    where: { category: { in: ['Animacje', 'Rozrywka', 'Dodatki'] } },
  });

  // Kids Package - animation focused
  const kidsOptions = birthdayOptionsList.filter(opt => 
    ['Animator dla dzieci', 'Malowanie twarzy', 'Bańki mydlane show', 
     'Słodki stół', 'Fotobudka', 'Popcorn machine', 'Konsola do gier'].includes(opt.name)
  );
  
  for (const [index, option] of kidsOptions.entries()) {
    await prisma.menuPackageOption.create({
      data: {
        packageId: birthdayPackageKids.id,
        optionId: option.id,
        displayOrder: index,
        isDefault: option.name === 'Animator dla dzieci',
      },
    });
  }

  // Adult Package - entertainment focused
  const adultOptions = birthdayOptionsList.filter(opt => 
    ['DJ + Muzyka', 'Karaoke', 'Fotobudka', 'Słodki stół', 'Dodatkowa godzina'].includes(opt.name)
  );
  
  for (const [index, option] of adultOptions.entries()) {
    await prisma.menuPackageOption.create({
      data: {
        packageId: birthdayPackageAdult.id,
        optionId: option.id,
        displayOrder: index,
        isDefault: option.name === 'DJ + Muzyka',
      },
    });
  }

  console.log('✅ Birthday menu created: 2 packages, 10 options');

  // ══════════════════════════════════════════════════
  // 3. KOMUNIA (FIRST COMMUNION)
  // ══════════════════════════════════════════════════

  console.log('⛪ Creating Communion menu...');

  const communionMenu = await prisma.menuTemplate.create({
    data: {
      eventTypeId: communionType.id,
      name: 'Menu Komunijne 2026',
      description: 'Uroczyste menu na Pierwszą Komunię Świętą',
      validFrom: new Date('2026-04-01'),
      validTo: new Date('2026-06-30'),
      isActive: true,
      displayOrder: 1,
    },
  });

  // Communion Packages
  const communionPackageBasic = await prisma.menuPackage.create({
    data: {
      menuTemplateId: communionMenu.id,
      name: 'Pakiet Podstawowy',
      description: 'Kameralne przyjęcie komunijne',
      shortDescription: 'Klasyka w przystępnej cenie',
      pricePerAdult: dec(100),
      pricePerChild: dec(60),
      pricePerToddler: dec(0),
      color: '#87CEEB',
      icon: 'cross',
      displayOrder: 1,
      isPopular: false,
      includedItems: [
        'Tort komunijny',
        'Dekoracje religijne',
        'Serwis stołowy',
        'Soki + woda',
      ],
      minGuests: 20,
      maxGuests: 50,
    },
  });

  const communionPackagePremium = await prisma.menuPackage.create({
    data: {
      menuTemplateId: communionMenu.id,
      name: 'Pakiet Premium',
      description: 'Uroczyste przyjęcie z programem dla dzieci',
      shortDescription: 'Kompleksowa obsługa + animacje',
      pricePerAdult: dec(150),
      pricePerChild: dec(90),
      pricePerToddler: dec(0),
      color: '#FFD700',
      icon: 'star',
      badgeText: 'Polecany',
      displayOrder: 2,
      isPopular: true,
      isRecommended: true,
      includedItems: [
        'Tort komunijny 2-piętrowy',
        'Dekoracje premium (kwiaty + świece)',
        'Serwis porcelanowy',
        'Soki + woda + wino dla dorosłych',
        'Kelner',
        'Animator dla dzieci (2h)',
      ],
      minGuests: 30,
      maxGuests: 80,
    },
  });

  // Communion Options
  const communionOptions = await prisma.menuOption.createMany({
    data: [
      // Animacje
      {
        name: 'Animator komunijny',
        description: 'Animator z programem dla dzieci (3h)',
        category: 'Animacje',
        priceType: 'FLAT',
        priceAmount: dec(400),
        icon: 'smile',
        isActive: true,
        displayOrder: 1,
      },
      {
        name: 'Malowanie buziek',
        description: 'Artystyczne malowanie twarzy',
        category: 'Animacje',
        priceType: 'FLAT',
        priceAmount: dec(200),
        icon: 'palette',
        isActive: true,
        displayOrder: 2,
      },
      
      // Rozrywka
      {
        name: 'Fotograf komunijny',
        description: 'Sesja zdjęciowa + reportaż (4h)',
        category: 'Rozrywka',
        priceType: 'FLAT',
        priceAmount: dec(1500),
        icon: 'camera',
        isActive: true,
        displayOrder: 1,
      },
      {
        name: 'Fotobudka',
        description: 'Fotobudka z drukiem (3h)',
        category: 'Rozrywka',
        priceType: 'FLAT',
        priceAmount: dec(500),
        icon: 'camera',
        isActive: true,
        displayOrder: 2,
      },
      
      // Dekoracje
      {
        name: 'Balony helowe',
        description: '50 balonów z helem w kolorach komunijnych',
        category: 'Dekoracje',
        priceType: 'FLAT',
        priceAmount: dec(300),
        icon: 'balloon',
        isActive: true,
        displayOrder: 1,
      },
      {
        name: 'Ścianka komunijna',
        description: 'Dekoracyjna ścianka do zdjęć',
        category: 'Dekoracje',
        priceType: 'FLAT',
        priceAmount: dec(400),
        icon: 'frame',
        isActive: true,
        displayOrder: 2,
      },
      
      // Dodatki
      {
        name: 'Słodki stół',
        description: 'Candy bar + ciasteczka',
        category: 'Dodatki',
        priceType: 'PER_PERSON',
        priceAmount: dec(12),
        icon: 'candy',
        isActive: true,
        displayOrder: 1,
      },
      {
        name: 'Upominki dla gości',
        description: 'Pamiątkowe upominki dla każdego gościa',
        category: 'Dodatki',
        priceType: 'PER_PERSON',
        priceAmount: dec(8),
        icon: 'gift',
        isActive: true,
        displayOrder: 2,
      },
    ],
  });

  // Assign options to communion packages
  const communionOptionsList = await prisma.menuOption.findMany({
    where: {
      OR: [
        { name: { contains: 'komunijny' } },
        { name: { contains: 'komunijna' } },
        { name: { in: ['Malowanie buziek', 'Fotobudka', 'Balony helowe', 
                       'Ścianka komunijna', 'Słodki stół', 'Upominki dla gości'] } },
      ],
    },
  });

  // Basic Package - 4 options
  const basicOptions = communionOptionsList.filter(opt => 
    ['Animator komunijny', 'Fotobudka', 'Balony helowe', 'Słodki stół'].includes(opt.name)
  );
  
  for (const [index, option] of basicOptions.entries()) {
    await prisma.menuPackageOption.create({
      data: {
        packageId: communionPackageBasic.id,
        optionId: option.id,
        displayOrder: index,
      },
    });
  }

  // Premium Package - all options
  for (const [index, option] of communionOptionsList.entries()) {
    await prisma.menuPackageOption.create({
      data: {
        packageId: communionPackagePremium.id,
        optionId: option.id,
        displayOrder: index,
        isDefault: option.name === 'Animator komunijny',
      },
    });
  }

  console.log('✅ Communion menu created: 2 packages, 8 options');

  // ══════════════════════════════════════════════════

  console.log('\n🎉 Menu system seed completed successfully!');
  console.log('\n📊 Summary:');
  console.log('  • Wesele: 3 packages, 15 options');
  console.log('  • Urodziny: 2 packages, 10 options');
  console.log('  • Komunia: 2 packages, 8 options');
  console.log('  • Total: 7 packages, 33 unique options\n');
}

// Run seed if executed directly
if (require.main === module) {
  seedMenuSystem()
    .then(() => {
      console.log('✅ Seed completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Seed failed:', error);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
