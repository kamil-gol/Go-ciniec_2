/**
 * Menu System Seed Data
 * 
 * Creates test menus for:
 * - Wesele (Wedding): 3 packages + 15 options
 * - Urodziny (Birthday): 2 packages + 10 options  
 * - Komunia (Communion): 2 packages + 8 options
 */

import { prisma } from '../lib/prisma.js';

async function seedMenuSystem() {
  console.log('\n🍽️ Seeding Menu System...');

  // Find event types
  const eventTypes = await prisma.eventType.findMany({
    where: {
      name: {
        in: ['Wesele', 'Urodziny', 'Komunia'],
      },
    },
  });

  const weddingType = eventTypes.find(e => e.name === 'Wesele');
  const birthdayType = eventTypes.find(e => e.name === 'Urodziny');
  const communionType = eventTypes.find(e => e.name === 'Komunia');

  if (!weddingType || !birthdayType || !communionType) {
    throw new Error('Event types not found. Run main seed first.');
  }

  // ═══════════════════════════════════════════════════════════
  // 💍 WEDDING MENU
  // ═══════════════════════════════════════════════════════════

  console.log('Creating Wedding Menu (Spring 2026)...');

  const weddingTemplate = await prisma.menuTemplate.create({
    data: {
      eventTypeId: weddingType.id,
      name: 'Menu Weselne Wiosna 2026',
      description: 'Eleganckie menu weselne z opcjami premium dla wiosennych uroczystąści',
      variant: 'Wiosna',
      validFrom: new Date('2026-03-01'),
      validTo: new Date('2026-06-30'),
      isActive: true,
      displayOrder: 1,
    },
  });

  // Wedding Packages
  const weddingPackages = await Promise.all([
    // Silver Package
    prisma.menuPackage.create({
      data: {
        menuTemplateId: weddingTemplate.id,
        name: 'Pakiet Srebrny',
        description: 'Podstawowy pakiet weselny dla mniejszych przyjęć',
        shortDescription: 'Klasyczne menu z podstawowymi usługami',
        pricePerAdult: 150,
        pricePerChild: 75,
        pricePerToddler: 0,
        color: '#C0C0C0',
        icon: 'medal',
        displayOrder: 1,
        isPopular: false,
        isRecommended: false,
        includedItems: [
          'Tort 2-piętrowy',
          'Obrus premium',
          'Serwis stołowy',
          'Dekoracje stołów (podstawowe)',
          'Kelner (1 osoba)',
        ],
        minGuests: 30,
        maxGuests: 60,
      },
    }),
    // Gold Package
    prisma.menuPackage.create({
      data: {
        menuTemplateId: weddingTemplate.id,
        name: 'Pakiet Złoty',
        description: 'Najpopularniejszy wybór par młodych z rozszerzonymi usługami',
        shortDescription: 'Pełen pakiet z dodatkowymi atrakcjami',
        pricePerAdult: 300,
        pricePerChild: 150,
        pricePerToddler: 0,
        color: '#FFD700',
        icon: 'star',
        badgeText: 'Najpopularniejszy',
        displayOrder: 2,
        isPopular: true,
        isRecommended: true,
        includedItems: [
          'Tort 3-piętrowy',
          'Obrus premium + biżuteria stołów',
          'Serwis stołowy porcelana',
          'Dekoracje stołów (premium)',
          'Kelnerzy (2 osoby)',
          'Kwiatowe kompozycje na stoły',
          'Podtrzymanie tortu',
        ],
        minGuests: 50,
        maxGuests: 120,
      },
    }),
    // Diamond Package
    prisma.menuPackage.create({
      data: {
        menuTemplateId: weddingTemplate.id,
        name: 'Pakiet Diamentowy',
        description: 'Luksusowy pakiet all-inclusive dla wymagających gości',
        shortDescription: 'Premium all-inclusive z szampanem i fotografem',
        pricePerAdult: 500,
        pricePerChild: 250,
        pricePerToddler: 0,
        color: '#B9F2FF',
        icon: 'gem',
        badgeText: 'Premium',
        displayOrder: 3,
        isPopular: false,
        isRecommended: false,
        includedItems: [
          'Tort 4-piętrowy artystyczny',
          'Obrus luksusowy + biżuteria premium',
          'Serwis stołowy krąglewski',
          'Dekoracje stołów (luksusowe)',
          'Kelnerzy (4 osoby)',
          'Kompozycje kwiatowe premium',
          'Fontanna szampana',
          'Fotograf (6h)',
          'Candy bar',
        ],
        minGuests: 80,
        maxGuests: 200,
      },
    }),
  ]);

  // Wedding Options
  const weddingOptions = await Promise.all([
    // Music
    prisma.menuOption.create({
      data: {
        name: 'DJ + Nagłośnienie',
        description: 'Profesjonalny DJ z pełnym wyposażeniem',
        shortDescription: 'DJ z nagłośnieniem 8h',
        category: 'Muzyka',
        priceType: 'FLAT',
        priceAmount: 2000,
        allowMultiple: false,
        icon: 'music',
        displayOrder: 1,
      },
    }),
    prisma.menuOption.create({
      data: {
        name: 'Zespół muzyczny (5 osób)',
        description: 'Zespół na żywo - klasyka i pop',
        shortDescription: 'Live band 6h',
        category: 'Muzyka',
        priceType: 'FLAT',
        priceAmount: 3500,
        allowMultiple: false,
        icon: 'music-2',
        displayOrder: 2,
      },
    }),
    prisma.menuOption.create({
      data: {
        name: 'Wodzirej',
        description: 'Profesjonalny konferansjer i animator',
        category: 'Muzyka',
        priceType: 'FLAT',
        priceAmount: 1000,
        allowMultiple: false,
        icon: 'mic',
        displayOrder: 3,
      },
    }),
    // Alcohol
    prisma.menuOption.create({
      data: {
        name: 'Bar Open',
        description: 'Nielimitowany alkohol przez całą noc',
        shortDescription: 'Open bar 8h - wódka, whisky, wino',
        category: 'Alkohol',
        priceType: 'PER_PERSON',
        priceAmount: 50,
        allowMultiple: false,
        icon: 'wine',
        displayOrder: 1,
      },
    }),
    prisma.menuOption.create({
      data: {
        name: 'Wino stołowe',
        description: 'Wino czerwone i białe do kolacji',
        category: 'Alkohol',
        priceType: 'PER_PERSON',
        priceAmount: 15,
        allowMultiple: false,
        icon: 'glass',
        displayOrder: 2,
      },
    }),
    prisma.menuOption.create({
      data: {
        name: 'Szampan premium',
        description: 'Szampan na przywiązanie tortu',
        category: 'Alkohol',
        priceType: 'PER_PERSON',
        priceAmount: 30,
        allowMultiple: false,
        icon: 'champagne',
        displayOrder: 3,
      },
    }),
    // Photo & Video
    prisma.menuOption.create({
      data: {
        name: 'Fotograf (6h)',
        description: 'Profesjonalny fotograf weselny + 300 zdjęć',
        category: 'Foto & Video',
        priceType: 'FLAT',
        priceAmount: 2500,
        allowMultiple: false,
        icon: 'camera',
        displayOrder: 1,
      },
    }),
    prisma.menuOption.create({
      data: {
        name: 'Filmowanie (cały dzień)',
        description: 'Kamerzysta + montaz + film 30min',
        category: 'Foto & Video',
        priceType: 'FLAT',
        priceAmount: 3000,
        allowMultiple: false,
        icon: 'video',
        displayOrder: 2,
      },
    }),
    prisma.menuOption.create({
      data: {
        name: 'Fotobudka (4h)',
        description: 'Fotobudka z rekwizytami + wydruki',
        category: 'Foto & Video',
        priceType: 'FLAT',
        priceAmount: 800,
        allowMultiple: false,
        icon: 'aperture',
        displayOrder: 3,
      },
    }),
    // Decorations
    prisma.menuOption.create({
      data: {
        name: 'Dodatkowe dekoracje',
        description: 'Światła LED, balony, napisy świetlne',
        category: 'Dekoracje',
        priceType: 'FLAT',
        priceAmount: 1200,
        allowMultiple: true,
        maxQuantity: 3,
        icon: 'sparkles',
        displayOrder: 1,
      },
    }),
    prisma.menuOption.create({
      data: {
        name: 'Ciężki dym na pierwszy taniec',
        description: 'Efekt ciężkiego dymu',
        category: 'Dekoracje',
        priceType: 'FLAT',
        priceAmount: 400,
        allowMultiple: false,
        icon: 'cloud',
        displayOrder: 2,
      },
    }),
    // Entertainment
    prisma.menuOption.create({
      data: {
        name: 'Animator dla dzieci',
        description: 'Animator z zabawami dla dzieci (4h)',
        category: 'Rozrywka',
        priceType: 'FLAT',
        priceAmount: 600,
        allowMultiple: false,
        icon: 'smile',
        displayOrder: 1,
      },
    }),
    prisma.menuOption.create({
      data: {
        name: 'Pokaz ogni sztucznych',
        description: '10-minutowy pokaz sztucznych ogni',
        category: 'Rozrywka',
        priceType: 'FLAT',
        priceAmount: 1500,
        allowMultiple: false,
        icon: 'zap',
        displayOrder: 2,
      },
    }),
    // Catering
    prisma.menuOption.create({
      data: {
        name: 'Północ - gorąca zupa',
        description: 'Żurek lub rosół serwowany o północy',
        category: 'Catering',
        priceType: 'PER_PERSON',
        priceAmount: 10,
        allowMultiple: false,
        icon: 'soup',
        displayOrder: 1,
      },
    }),
    prisma.menuOption.create({
      data: {
        name: 'Północ - grill',
        description: 'Kiełbaski z grilla o północy',
        category: 'Catering',
        priceType: 'PER_PERSON',
        priceAmount: 15,
        allowMultiple: false,
        icon: 'flame',
        displayOrder: 2,
      },
    }),
  ]);

  // Attach options to packages
  console.log('Attaching options to wedding packages...');
  
  // Silver - basic options (5)
  await Promise.all([
    prisma.menuPackageOption.create({
      data: {
        packageId: weddingPackages[0].id, // Silver
        optionId: weddingOptions[0].id, // DJ
        isDefault: false,
        displayOrder: 1,
      },
    }),
    prisma.menuPackageOption.create({
      data: {
        packageId: weddingPackages[0].id,
        optionId: weddingOptions[4].id, // Wino stołowe
        isDefault: false,
        displayOrder: 2,
      },
    }),
    prisma.menuPackageOption.create({
      data: {
        packageId: weddingPackages[0].id,
        optionId: weddingOptions[6].id, // Fotograf
        isDefault: false,
        displayOrder: 3,
      },
    }),
    prisma.menuPackageOption.create({
      data: {
        packageId: weddingPackages[0].id,
        optionId: weddingOptions[11].id, // Animator
        isDefault: false,
        displayOrder: 4,
      },
    }),
    prisma.menuPackageOption.create({
      data: {
        packageId: weddingPackages[0].id,
        optionId: weddingOptions[13].id, // Zupa północ
        isDefault: true,
        displayOrder: 5,
      },
    }),
  ]);

  // Gold - more options (12)
  const goldOptionIds = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 13];
  await Promise.all(
    goldOptionIds.map((idx, order) =>
      prisma.menuPackageOption.create({
        data: {
          packageId: weddingPackages[1].id, // Gold
          optionId: weddingOptions[idx].id,
          isDefault: idx === 13, // Zupa default
          displayOrder: order + 1,
        },
      })
    )
  );

  // Diamond - all options (15)
  await Promise.all(
    weddingOptions.map((opt, idx) =>
      prisma.menuPackageOption.create({
        data: {
          packageId: weddingPackages[2].id, // Diamond
          optionId: opt.id,
          isDefault: idx === 13, // Zupa default
          displayOrder: idx + 1,
        },
      })
    )
  );

  console.log('✓ Wedding menu created');

  // ═══════════════════════════════════════════════════════════
  // 🎂 BIRTHDAY MENU
  // ═══════════════════════════════════════════════════════════

  console.log('Creating Birthday Menu (2026)...');

  const birthdayTemplate = await prisma.menuTemplate.create({
    data: {
      eventTypeId: birthdayType.id,
      name: 'Menu Urodzinowe 2026',
      description: 'Pakiety urodzinowe dla dzieci i dorosłych',
      validFrom: new Date('2026-01-01'),
      validTo: new Date('2026-12-31'),
      isActive: true,
      displayOrder: 1,
    },
  });

  // Birthday Packages
  const birthdayPackages = await Promise.all([
    // Kids Package
    prisma.menuPackage.create({
      data: {
        menuTemplateId: birthdayTemplate.id,
        name: 'Pakiet Dziecięcy',
        description: 'Urodziny dla dzieci z animacjami',
        shortDescription: 'Pizza, słodycze, animacje',
        pricePerAdult: 80,
        pricePerChild: 60,
        pricePerToddler: 40,
        color: '#FF69B4',
        icon: 'cake',
        badgeText: 'Dla Dzieci',
        displayOrder: 1,
        isPopular: true,
        includedItems: [
          'Pizza dla każdego dziecka',
          'Tort urodzinowy',
          'Napoje (soki, woda)',
          'Dekoracje kolorowe',
          'Kapcie jednorazowe',
        ],
        minGuests: 10,
        maxGuests: 30,
      },
    }),
    // Adult Package
    prisma.menuPackage.create({
      data: {
        menuTemplateId: birthdayTemplate.id,
        name: 'Pakiet Dorosły',
        description: 'Elegancka przyjęcie urodzinowe',
        shortDescription: 'Przyjęcie z cateringiem i alkoholem',
        pricePerAdult: 120,
        pricePerChild: 60,
        pricePerToddler: 0,
        color: '#4169E1',
        icon: 'gift',
        displayOrder: 2,
        isPopular: false,
        includedItems: [
          'Catering ciepły (2 dania)',
          'Tort urodzinowy premium',
          'Napoje (kawa, herbata, soki)',
          'Dekoracje eleganckie',
          'Serwis stołowy',
        ],
        minGuests: 20,
        maxGuests: 60,
      },
    }),
  ]);

  // Birthday Options
  const birthdayOptions = await Promise.all([
    prisma.menuOption.create({
      data: {
        name: 'Animator dla dzieci (3h)',
        description: 'Animator z zabawami i konkursami',
        category: 'Rozrywka',
        priceType: 'FLAT',
        priceAmount: 400,
        icon: 'smile',
        displayOrder: 1,
      },
    }),
    prisma.menuOption.create({
      data: {
        name: 'Dmuchany zamek (4h)',
        description: 'Wielki dmuchany zamek dla dzieci',
        category: 'Rozrywka',
        priceType: 'FLAT',
        priceAmount: 300,
        icon: 'home',
        displayOrder: 2,
      },
    }),
    prisma.menuOption.create({
      data: {
        name: 'Malowanie twarzy',
        description: 'Malowanie buziek przez 2h',
        category: 'Rozrywka',
        priceType: 'FLAT',
        priceAmount: 200,
        icon: 'palette',
        displayOrder: 3,
      },
    }),
    prisma.menuOption.create({
      data: {
        name: 'DJ z muzyką dla dzieci',
        description: 'DJ z repertuarem dla młodszych',
        category: 'Muzyka',
        priceType: 'FLAT',
        priceAmount: 600,
        icon: 'music',
        displayOrder: 1,
      },
    }),
    prisma.menuOption.create({
      data: {
        name: 'Fotograf (3h)',
        description: 'Sesja zdjęciowa + 100 zdjęć',
        category: 'Foto & Video',
        priceType: 'FLAT',
        priceAmount: 800,
        icon: 'camera',
        displayOrder: 1,
      },
    }),
    prisma.menuOption.create({
      data: {
        name: 'Candy bar',
        description: 'Stół ze słodyczami',
        category: 'Catering',
        priceType: 'PER_PERSON',
        priceAmount: 15,
        icon: 'candy',
        displayOrder: 1,
      },
    }),
    prisma.menuOption.create({
      data: {
        name: 'Napoje gazowane',
        description: 'Coca-Cola, Sprite, Fanta',
        category: 'Catering',
        priceType: 'PER_PERSON',
        priceAmount: 5,
        icon: 'cup',
        displayOrder: 2,
      },
    }),
    prisma.menuOption.create({
      data: {
        name: 'Alkohol (bar otwarty)',
        description: 'Dorosłe urodziny - alkohol 4h',
        category: 'Alkohol',
        priceType: 'PER_PERSON',
        priceAmount: 40,
        icon: 'wine',
        displayOrder: 1,
      },
    }),
    prisma.menuOption.create({
      data: {
        name: 'Wiano premium',
        description: 'Dobrej jakości wino',
        category: 'Alkohol',
        priceType: 'PER_PERSON',
        priceAmount: 20,
        icon: 'glass',
        displayOrder: 2,
      },
    }),
    prisma.menuOption.create({
      data: {
        name: 'Dekoracje balonowe',
        description: 'Balony z helem + łuki balonowe',
        category: 'Dekoracje',
        priceType: 'FLAT',
        priceAmount: 250,
        icon: 'circle',
        displayOrder: 1,
      },
    }),
  ]);

  // Attach options to birthday packages
  console.log('Attaching options to birthday packages...');

  // Kids - entertainment focused (7 options)
  const kidsOptionIds = [0, 1, 2, 3, 4, 5, 6];
  await Promise.all(
    kidsOptionIds.map((idx, order) =>
      prisma.menuPackageOption.create({
        data: {
          packageId: birthdayPackages[0].id,
          optionId: birthdayOptions[idx].id,
          isDefault: idx === 0, // Animator default
          displayOrder: order + 1,
        },
      })
    )
  );

  // Adult - all options (10)
  await Promise.all(
    birthdayOptions.map((opt, idx) =>
      prisma.menuPackageOption.create({
        data: {
          packageId: birthdayPackages[1].id,
          optionId: opt.id,
          isDefault: false,
          displayOrder: idx + 1,
        },
      })
    )
  );

  console.log('✓ Birthday menu created');

  // ═══════════════════════════════════════════════════════════
  // ⛪ COMMUNION MENU
  // ═══════════════════════════════════════════════════════════

  console.log('Creating Communion Menu (2026)...');

  const communionTemplate = await prisma.menuTemplate.create({
    data: {
      eventTypeId: communionType.id,
      name: 'Menu Komunijne 2026',
      description: 'Eleganckie menu na Pierwszą Komunię Świętą',
      validFrom: new Date('2026-01-01'),
      validTo: new Date('2026-12-31'),
      isActive: true,
      displayOrder: 1,
    },
  });

  // Communion Packages
  const communionPackages = await Promise.all([
    // Basic Package
    prisma.menuPackage.create({
      data: {
        menuTemplateId: communionTemplate.id,
        name: 'Pakiet Basic',
        description: 'Podstawowe menu komunijne',
        shortDescription: 'Obiad + tort + dekoracje',
        pricePerAdult: 100,
        pricePerChild: 80,
        pricePerToddler: 50,
        color: '#87CEEB',
        icon: 'book-open',
        displayOrder: 1,
        isPopular: true,
        includedItems: [
          'Obiad 2-daniowy',
          'Tort komunijny',
          'Napoje (soki, woda, kawa)',
          'Dekoracje białe',
          'Serwis stołowy',
        ],
        minGuests: 30,
        maxGuests: 80,
      },
    }),
    // Premium Package
    prisma.menuPackage.create({
      data: {
        menuTemplateId: communionTemplate.id,
        name: 'Pakiet Premium',
        description: 'Rozszerzony pakiet komunijny',
        shortDescription: 'Obiad premium + animator + dodatki',
        pricePerAdult: 150,
        pricePerChild: 100,
        pricePerToddler: 50,
        color: '#DAA520',
        icon: 'award',
        badgeText: 'Polecany',
        displayOrder: 2,
        isPopular: false,
        isRecommended: true,
        includedItems: [
          'Obiad 3-daniowy premium',
          'Tort komunijny artystyczny',
          'Napoje (soki, woda, kawa, herbata)',
          'Dekoracje biało-złote',
          'Serwis stołowy porcelana',
          'Animator dla dzieci (2h)',
          'Candy bar',
        ],
        minGuests: 40,
        maxGuests: 100,
      },
    }),
  ]);

  // Communion Options
  const communionOptions = await Promise.all([
    prisma.menuOption.create({
      data: {
        name: 'Animator dla dzieci (3h)',
        description: 'Zabawy i konkursy dla dzieci',
        category: 'Rozrywka',
        priceType: 'FLAT',
        priceAmount: 400,
        icon: 'smile',
        displayOrder: 1,
      },
    }),
    prisma.menuOption.create({
      data: {
        name: 'DJ (6h)',
        description: 'DJ z muzyką rodzinną',
        category: 'Muzyka',
        priceType: 'FLAT',
        priceAmount: 1500,
        icon: 'music',
        displayOrder: 1,
      },
    }),
    prisma.menuOption.create({
      data: {
        name: 'Fotograf (4h)',
        description: 'Sesja komunijna + 200 zdjęć',
        category: 'Foto & Video',
        priceType: 'FLAT',
        priceAmount: 1200,
        icon: 'camera',
        displayOrder: 1,
      },
    }),
    prisma.menuOption.create({
      data: {
        name: 'Fotobudka (3h)',
        description: 'Fotobudka z rekwizytami',
        category: 'Foto & Video',
        priceType: 'FLAT',
        priceAmount: 600,
        icon: 'aperture',
        displayOrder: 2,
      },
    }),
    prisma.menuOption.create({
      data: {
        name: 'Candy bar',
        description: 'Stół ze słodyczami dla dzieci',
        category: 'Catering',
        priceType: 'PER_PERSON',
        priceAmount: 12,
        icon: 'candy',
        displayOrder: 1,
      },
    }),
    prisma.menuOption.create({
      data: {
        name: 'Dodatkowe dekoracje',
        description: 'Balony, napisy, kwiaty',
        category: 'Dekoracje',
        priceType: 'FLAT',
        priceAmount: 500,
        icon: 'sparkles',
        displayOrder: 1,
      },
    }),
    prisma.menuOption.create({
      data: {
        name: 'Wino stołowe',
        description: 'Wino do obiadu',
        category: 'Alkohol',
        priceType: 'PER_PERSON',
        priceAmount: 12,
        icon: 'wine',
        displayOrder: 1,
      },
    }),
    prisma.menuOption.create({
      data: {
        name: 'Dmuchany zamek (4h)',
        description: 'Dla dzieci na zewnątrz',
        category: 'Rozrywka',
        priceType: 'FLAT',
        priceAmount: 300,
        icon: 'home',
        displayOrder: 2,
      },
    }),
  ]);

  // Attach options to communion packages
  console.log('Attaching options to communion packages...');

  // Basic - essential options (5)
  const basicCommunionIds = [0, 1, 2, 4, 6];
  await Promise.all(
    basicCommunionIds.map((idx, order) =>
      prisma.menuPackageOption.create({
        data: {
          packageId: communionPackages[0].id,
          optionId: communionOptions[idx].id,
          isDefault: false,
          displayOrder: order + 1,
        },
      })
    )
  );

  // Premium - all options (8)
  await Promise.all(
    communionOptions.map((opt, idx) =>
      prisma.menuPackageOption.create({
        data: {
          packageId: communionPackages[1].id,
          optionId: opt.id,
          isDefault: idx === 0, // Animator default
          displayOrder: idx + 1,
        },
      })
    )
  );

  console.log('✓ Communion menu created');

  // ═══════════════════════════════════════════════════════════

  console.log('\n✅ Menu System Seed Complete!');
  console.log('\nCreated:');
  console.log('- 3 Menu Templates (Wedding, Birthday, Communion)');
  console.log('- 7 Packages total (3 + 2 + 2)');
  console.log('- 33 Options total (15 + 10 + 8)');
  console.log('- Multiple package-option associations');
}

export default seedMenuSystem;

// Run standalone
if (require.main === module) {
  seedMenuSystem()
    .then(() => {
      console.log('Seed completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Seed failed:', error);
      process.exit(1);
    })
    .finally(() => {
      prisma.$disconnect();
    });
}
