/**
 * Menu Templates, Packages & Options Seed
 * 
 * Seed data for:
 * - MenuTemplate (szablony menu dla typów wydarzeń)
 * - MenuPackage (pakiety w ramach szablonów)
 * - MenuOption (opcje dodatkowe)
 * - MenuPackageOption (połączenia pakietów z opcjami)
 * - PackageCategorySettings (ustawienia kategorii dań dla pakietów)
 * 
 * Run with: npm run db:seed:menu-templates
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// ════════════════════════════════════════════════════════════════════════════
// OPCJE MENU (MenuOption) - Dodatki do pakietów
// ════════════════════════════════════════════════════════════════════════════

const MENU_OPTIONS = [
  // ─────────────────────────────────────────────────────────────────────────
  // TORTY I DESERY
  // ─────────────────────────────────────────────────────────────────────────
  {
    name: 'Tort weselny 3-piętrowy',
    description: 'Elegancki tort weselny z dekoracjami cukrowymi',
    shortDescription: 'Tort 3-piętrowy z dekoracjami',
    category: 'DESSERT_UPGRADES',
    priceType: 'PER_PERSON',
    priceAmount: 25.00,
    icon: '🎂',
    displayOrder: 1,
  },
  {
    name: 'Tort urodzinowy',
    description: 'Tort urodzinowy z personalizacją',
    shortDescription: 'Tort z personalizacją',
    category: 'DESSERT_UPGRADES',
    priceType: 'PER_PERSON',
    priceAmount: 20.00,
    icon: '🍰',
    displayOrder: 2,
  },
  {
    name: 'Fontanna czekoladowa',
    description: 'Fontanna czekoladowa z owocami',
    shortDescription: 'Fontanna z owocami',
    category: 'DESSERT_UPGRADES',
    priceType: 'FIXED',
    priceAmount: 800.00,
    icon: '🍫',
    displayOrder: 3,
  },
  {
    name: 'Candy bar',
    description: 'Stół ze słodyczami i ciasteczkami',
    shortDescription: 'Stół ze słodyczami',
    category: 'DESSERT_UPGRADES',
    priceType: 'FIXED',
    priceAmount: 1200.00,
    icon: '🍭',
    displayOrder: 4,
  },

  // ─────────────────────────────────────────────────────────────────────────
  // NAPOJE I ALKOHOL
  // ─────────────────────────────────────────────────────────────────────────
  {
    name: 'Wino stołowe',
    description: 'Wino białe i czerwone do posiłku',
    shortDescription: 'Wino do posiłku',
    category: 'BEVERAGES',
    priceType: 'PER_PERSON',
    priceAmount: 15.00,
    icon: '🍷',
    displayOrder: 10,
  },
  {
    name: 'Szampan powitalny',
    description: 'Kieliszek szampana na powitanie',
    shortDescription: 'Szampan na powitanie',
    category: 'BEVERAGES',
    priceType: 'PER_PERSON',
    priceAmount: 12.00,
    icon: '🥂',
    displayOrder: 11,
  },
  {
    name: 'Bar open - standard',
    description: 'Nielimitowane napoje alkoholowe i bezalkoholowe',
    shortDescription: 'Bar open standard',
    category: 'BEVERAGES',
    priceType: 'PER_PERSON',
    priceAmount: 80.00,
    icon: '🍺',
    displayOrder: 12,
  },
  {
    name: 'Bar open - premium',
    description: 'Nielimitowane napoje premium + drinki',
    shortDescription: 'Bar open premium',
    category: 'BEVERAGES',
    priceType: 'PER_PERSON',
    priceAmount: 120.00,
    icon: '🍸',
    displayOrder: 13,
  },
  {
    name: 'Lemoniada domowa',
    description: 'Świeża lemoniada z cytryną i miętą',
    shortDescription: 'Lemoniada świeża',
    category: 'BEVERAGES',
    priceType: 'PER_PERSON',
    priceAmount: 5.00,
    icon: '🍋',
    displayOrder: 14,
  },

  // ─────────────────────────────────────────────────────────────────────────
  // PRZEKĄSKI I DODATKI
  // ─────────────────────────────────────────────────────────────────────────
  {
    name: 'Stół serwowany',
    description: 'Zimne przekąski na stole (pasztet, śledzie, wędliny)',
    shortDescription: 'Zimne przekąski',
    category: 'APPETIZERS',
    priceType: 'PER_PERSON',
    priceAmount: 30.00,
    icon: '🥘',
    displayOrder: 20,
  },
  {
    name: 'Bufet owocowy',
    description: 'Świeże owoce sezonowe na stole',
    shortDescription: 'Świeże owoce',
    category: 'APPETIZERS',
    priceType: 'FIXED',
    priceAmount: 600.00,
    icon: '🍇',
    displayOrder: 21,
  },
  {
    name: 'Grill na żywo',
    description: 'Grillowanie na żywo - kiełbaski, karkówka',
    shortDescription: 'Grill na żywo',
    category: 'APPETIZERS',
    priceType: 'PER_PERSON',
    priceAmount: 35.00,
    icon: '🔥',
    displayOrder: 22,
  },
  {
    name: 'Przekąska nocna',
    description: 'Rosół lub bigos o północy',
    shortDescription: 'Przekąska o północy',
    category: 'APPETIZERS',
    priceType: 'PER_PERSON',
    priceAmount: 18.00,
    icon: '🌙',
    displayOrder: 23,
  },

  // ─────────────────────────────────────────────────────────────────────────
  // DEKORACJE I USŁUGI
  // ─────────────────────────────────────────────────────────────────────────
  {
    name: 'Dekoracja stołów',
    description: 'Elegancka dekoracja stołów kwiatami i świecami',
    shortDescription: 'Dekoracja kwiatowa',
    category: 'DECORATIONS',
    priceType: 'FIXED',
    priceAmount: 1500.00,
    icon: '💐',
    displayOrder: 30,
  },
  {
    name: 'Ścianka Instagram',
    description: 'Ścianka z logo i dekoracjami do zdjęć',
    shortDescription: 'Ścianka do zdjęć',
    category: 'DECORATIONS',
    priceType: 'FIXED',
    priceAmount: 800.00,
    icon: '📸',
    displayOrder: 31,
  },
  {
    name: 'Fotobudka',
    description: 'Fotobudka z gadżetami na 4h',
    shortDescription: 'Fotobudka 4h',
    category: 'ENTERTAINMENT',
    priceType: 'FIXED',
    priceAmount: 1200.00,
    icon: '📷',
    displayOrder: 40,
  },
  {
    name: 'DJ + nagłośnienie',
    description: 'DJ z profesjonalnym nagłośnieniem',
    shortDescription: 'DJ profesjonalny',
    category: 'ENTERTAINMENT',
    priceType: 'FIXED',
    priceAmount: 2500.00,
    icon: '🎵',
    displayOrder: 41,
  },
  {
    name: 'Pokaz ogni sztucznych',
    description: 'Pokaz ogni sztucznych 5 min',
    shortDescription: 'Ognie sztuczne',
    category: 'ENTERTAINMENT',
    priceType: 'FIXED',
    priceAmount: 1800.00,
    icon: '🎆',
    displayOrder: 42,
  },

  // ─────────────────────────────────────────────────────────────────────────
  // MENU SPECJALNE
  // ─────────────────────────────────────────────────────────────────────────
  {
    name: 'Menu wegetariańskie',
    description: 'Pełne menu wegetariańskie zamiast standardowego',
    shortDescription: 'Menu wegetariańskie',
    category: 'SPECIAL_MENUS',
    priceType: 'PER_PERSON',
    priceAmount: 0.00,
    icon: '🌱',
    displayOrder: 50,
  },
  {
    name: 'Menu bezglutenowe',
    description: 'Menu bez glutenu',
    shortDescription: 'Menu bezglutenowe',
    category: 'SPECIAL_MENUS',
    priceType: 'PER_PERSON',
    priceAmount: 20.00,
    icon: '🌾',
    displayOrder: 51,
  },
  {
    name: 'Menu dziecięce',
    description: 'Specjalne menu dla dzieci (nuggetsy, frytki, lody)',
    shortDescription: 'Menu dla dzieci',
    category: 'SPECIAL_MENUS',
    priceType: 'PER_CHILD',
    priceAmount: 40.00,
    icon: '👶',
    displayOrder: 52,
  },
]

// ════════════════════════════════════════════════════════════════════════════
// MAIN SEED FUNCTION
// ════════════════════════════════════════════════════════════════════════════

async function main() {
  console.log('🎭 Seedowanie szablonów menu, pakietów i opcji...\n')

  // ──────────────────────────────────────────────────────────────────────────
  // 0. Pobierz EventTypes i DishCategories
  // ──────────────────────────────────────────────────────────────────────────
  console.log('📋 Pobieranie typów wydarzeń i kategorii dań...')
  
  const eventTypes = await prisma.eventType.findMany({
    where: { isActive: true },
  })
  
  const dishCategories = await prisma.dishCategory.findMany({
    where: { isActive: true },
    orderBy: { displayOrder: 'asc' },
  })

  if (eventTypes.length === 0) {
    console.error('❌ Brak typów wydarzeń w bazie! Uruchom najpierw główny seed.')
    process.exit(1)
  }

  if (dishCategories.length === 0) {
    console.error('❌ Brak kategorii dań w bazie! Uruchom najpierw seed-menu.ts')
    process.exit(1)
  }

  console.log(`✓ Znaleziono ${eventTypes.length} typów wydarzeń`)
  console.log(`✓ Znaleziono ${dishCategories.length} kategorii dań\n`)

  // ──────────────────────────────────────────────────────────────────────────
  // 1. Sprawdź czy dane już istnieją
  // ──────────────────────────────────────────────────────────────────────────
  const existingTemplates = await prisma.menuTemplate.count()
  const existingPackages = await prisma.menuPackage.count()
  const existingOptions = await prisma.menuOption.count()

  if (existingTemplates > 0 || existingPackages > 0 || existingOptions > 0) {
    console.log('⚠️  Dane menu już istnieją:')
    console.log(`   - Szablony: ${existingTemplates}`)
    console.log(`   - Pakiety: ${existingPackages}`)
    console.log(`   - Opcje: ${existingOptions}\n`)
    console.log('🗑️  Czyszczenie istniejących danych...\n')

    // Usuń w odpowiedniej kolejności (FK constraints)
    await prisma.menuPriceHistory.deleteMany()
    await prisma.packageCategorySettings.deleteMany()
    await prisma.menuPackageOption.deleteMany()
    await prisma.menuOption.deleteMany()
    await prisma.menuPackage.deleteMany()
    await prisma.menuTemplate.deleteMany()
    
    console.log('   ✓ Usunięto wszystkie dane menu\n')
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 2. Tworzenie MenuOption (opcje dodatkowe)
  // ──────────────────────────────────────────────────────────────────────────
  console.log('🎨 Tworzenie opcji menu...')
  
  const createdOptions: any[] = []
  for (const optionData of MENU_OPTIONS) {
    const option = await prisma.menuOption.create({
      data: {
        ...optionData,
        isActive: true,
      },
    })
    createdOptions.push(option)
    console.log(`   ✓ ${option.icon} ${option.name} (${option.priceAmount} zł)`)
  }

  console.log(`\n✅ Utworzono ${createdOptions.length} opcji menu\n`)

  // ──────────────────────────────────────────────────────────────────────────
  // 3. Tworzenie MenuTemplate dla każdego EventType
  // ──────────────────────────────────────────────────────────────────────────
  console.log('📋 Tworzenie szablonów menu...')

  const createdTemplates: any[] = []
  let packageCount = 0

  // Helper do mapowania kategorii
  const getCategoryBySlug = (slug: string) => 
    dishCategories.find(c => c.slug === slug)

  for (const eventType of eventTypes) {
    // Szablon dla typu wydarzenia
    const template = await prisma.menuTemplate.create({
      data: {
        eventTypeId: eventType.id,
        name: `Menu ${eventType.name} 2026`,
        description: `Kompleksowe menu na ${eventType.name.toLowerCase()} - 3 pakiety do wyboru`,
        variant: 'STANDARD',
        isActive: true,
        displayOrder: eventTypes.indexOf(eventType) + 1,
      },
    })

    createdTemplates.push(template)
    console.log(`   ✓ ${template.name}`)

    // ────────────────────────────────────────────────────────────────────────
    // Pakiety dla szablonu
    // ────────────────────────────────────────────────────────────────────────
    
    // PAKIET 1: STANDARD
    const packageStandard = await prisma.menuPackage.create({
      data: {
        menuTemplateId: template.id,
        name: 'Pakiet Standard',
        description: 'Klasyczne menu z tradycyjnymi daniami',
        shortDescription: 'Klasyka w przystępnej cenie',
        pricePerAdult: 250.00,
        pricePerChild: 175.00,
        pricePerToddler: 0.00,
        color: '#10b981',
        icon: '✨',
        displayOrder: 1,
        includedItems: [
          'Zupa do wyboru',
          '2 dania główne',
          '2 dodatki',
          'Surówki',
          'Deser',
          'Kawa/herbata',
        ],
      },
    })
    packageCount++

    // Ustawienia kategorii dla pakietu Standard
    const soupCat = getCategoryBySlug('SOUP')
    const mainCourseCat = getCategoryBySlug('MAIN_COURSE')
    const sideDishCat = getCategoryBySlug('SIDE_DISH')
    const saladCat = getCategoryBySlug('SALAD')
    const dessertCat = getCategoryBySlug('DESSERT')

    if (soupCat) {
      await prisma.packageCategorySettings.create({
        data: {
          packageId: packageStandard.id,
          categoryId: soupCat.id,
          minSelect: 1,
          maxSelect: 1,
          isRequired: true,
          displayOrder: 1,
          customLabel: 'Wybierz zupę',
        },
      })
    }

    if (mainCourseCat) {
      await prisma.packageCategorySettings.create({
        data: {
          packageId: packageStandard.id,
          categoryId: mainCourseCat.id,
          minSelect: 2,
          maxSelect: 2,
          isRequired: true,
          displayOrder: 2,
          customLabel: 'Wybierz 2 dania główne',
        },
      })
    }

    if (sideDishCat) {
      await prisma.packageCategorySettings.create({
        data: {
          packageId: packageStandard.id,
          categoryId: sideDishCat.id,
          minSelect: 2,
          maxSelect: 2,
          isRequired: true,
          displayOrder: 3,
          customLabel: 'Wybierz 2 dodatki',
        },
      })
    }

    if (saladCat) {
      await prisma.packageCategorySettings.create({
        data: {
          packageId: packageStandard.id,
          categoryId: saladCat.id,
          minSelect: 2,
          maxSelect: 3,
          isRequired: true,
          displayOrder: 4,
          customLabel: 'Wybierz 2-3 surówki',
        },
      })
    }

    if (dessertCat) {
      await prisma.packageCategorySettings.create({
        data: {
          packageId: packageStandard.id,
          categoryId: dessertCat.id,
          minSelect: 1,
          maxSelect: 1,
          isRequired: true,
          displayOrder: 5,
          customLabel: 'Wybierz deser',
        },
      })
    }

    // PAKIET 2: PREMIUM
    const packagePremium = await prisma.menuPackage.create({
      data: {
        menuTemplateId: template.id,
        name: 'Pakiet Premium',
        description: 'Rozszerzone menu z dodatkowymi opcjami',
        shortDescription: 'Więcej wyboru i elegancji',
        pricePerAdult: 320.00,
        pricePerChild: 224.00,
        pricePerToddler: 0.00,
        color: '#3b82f6',
        icon: '⭐',
        badgeText: 'Popularny',
        isPopular: true,
        displayOrder: 2,
        includedItems: [
          'Zupa do wyboru',
          'Przystawki',
          '3 dania główne',
          '3 dodatki',
          'Surówki + sałatka',
          '2 desery',
          'Kawa/herbata',
        ],
      },
    })
    packageCount++

    // Ustawienia kategorii dla pakietu Premium (więcej opcji)
    if (soupCat) {
      await prisma.packageCategorySettings.create({
        data: {
          packageId: packagePremium.id,
          categoryId: soupCat.id,
          minSelect: 1,
          maxSelect: 2,
          isRequired: true,
          displayOrder: 1,
          customLabel: 'Wybierz 1-2 zupy',
        },
      })
    }

    const appetizerCat = getCategoryBySlug('APPETIZER')
    if (appetizerCat) {
      await prisma.packageCategorySettings.create({
        data: {
          packageId: packagePremium.id,
          categoryId: appetizerCat.id,
          minSelect: 2,
          maxSelect: 3,
          isRequired: true,
          displayOrder: 2,
          customLabel: 'Wybierz 2-3 przystawki',
        },
      })
    }

    if (mainCourseCat) {
      await prisma.packageCategorySettings.create({
        data: {
          packageId: packagePremium.id,
          categoryId: mainCourseCat.id,
          minSelect: 3,
          maxSelect: 3,
          isRequired: true,
          displayOrder: 3,
          customLabel: 'Wybierz 3 dania główne',
        },
      })
    }

    if (sideDishCat) {
      await prisma.packageCategorySettings.create({
        data: {
          packageId: packagePremium.id,
          categoryId: sideDishCat.id,
          minSelect: 3,
          maxSelect: 3,
          isRequired: true,
          displayOrder: 4,
          customLabel: 'Wybierz 3 dodatki',
        },
      })
    }

    if (saladCat) {
      await prisma.packageCategorySettings.create({
        data: {
          packageId: packagePremium.id,
          categoryId: saladCat.id,
          minSelect: 3,
          maxSelect: 4,
          isRequired: true,
          displayOrder: 5,
          customLabel: 'Wybierz 3-4 surówki/sałatki',
        },
      })
    }

    if (dessertCat) {
      await prisma.packageCategorySettings.create({
        data: {
          packageId: packagePremium.id,
          categoryId: dessertCat.id,
          minSelect: 2,
          maxSelect: 2,
          isRequired: true,
          displayOrder: 6,
          customLabel: 'Wybierz 2 desery',
        },
      })
    }

    // PAKIET 3: VIP
    const packageVIP = await prisma.menuPackage.create({
      data: {
        menuTemplateId: template.id,
        name: 'Pakiet VIP',
        description: 'Ekskluzywne menu z najwyższej półki',
        shortDescription: 'Maksimum elegancji i smaku',
        pricePerAdult: 400.00,
        pricePerChild: 280.00,
        pricePerToddler: 0.00,
        color: '#f59e0b',
        icon: '👑',
        badgeText: 'Ekskluzywny',
        isRecommended: true,
        displayOrder: 3,
        includedItems: [
          '2 zupy do wyboru',
          'Przystawki premium',
          '4 dania główne w tym ryby',
          '4 dodatki',
          'Bufet sałatek',
          '3 desery',
          'Kawa/herbata/espresso',
          'Owoce świeże',
        ],
      },
    })
    packageCount++

    // Ustawienia kategorii dla pakietu VIP (maksymalny wybór)
    if (soupCat) {
      await prisma.packageCategorySettings.create({
        data: {
          packageId: packageVIP.id,
          categoryId: soupCat.id,
          minSelect: 2,
          maxSelect: 2,
          isRequired: true,
          displayOrder: 1,
          customLabel: 'Wybierz 2 zupy',
        },
      })
    }

    if (appetizerCat) {
      await prisma.packageCategorySettings.create({
        data: {
          packageId: packageVIP.id,
          categoryId: appetizerCat.id,
          minSelect: 3,
          maxSelect: 4,
          isRequired: true,
          displayOrder: 2,
          customLabel: 'Wybierz 3-4 przystawki premium',
        },
      })
    }

    if (mainCourseCat) {
      await prisma.packageCategorySettings.create({
        data: {
          packageId: packageVIP.id,
          categoryId: mainCourseCat.id,
          minSelect: 3,
          maxSelect: 4,
          isRequired: true,
          displayOrder: 3,
          customLabel: 'Wybierz 3-4 dania główne',
        },
      })
    }

    const fishCat = getCategoryBySlug('FISH')
    if (fishCat) {
      await prisma.packageCategorySettings.create({
        data: {
          packageId: packageVIP.id,
          categoryId: fishCat.id,
          minSelect: 1,
          maxSelect: 2,
          isRequired: true,
          displayOrder: 4,
          customLabel: 'Wybierz 1-2 dania rybne',
        },
      })
    }

    if (sideDishCat) {
      await prisma.packageCategorySettings.create({
        data: {
          packageId: packageVIP.id,
          categoryId: sideDishCat.id,
          minSelect: 4,
          maxSelect: 4,
          isRequired: true,
          displayOrder: 5,
          customLabel: 'Wybierz 4 dodatki',
        },
      })
    }

    if (saladCat) {
      await prisma.packageCategorySettings.create({
        data: {
          packageId: packageVIP.id,
          categoryId: saladCat.id,
          minSelect: 4,
          maxSelect: 6,
          isRequired: true,
          displayOrder: 6,
          customLabel: 'Bufet sałatek (4-6 rodzajów)',
        },
      })
    }

    if (dessertCat) {
      await prisma.packageCategorySettings.create({
        data: {
          packageId: packageVIP.id,
          categoryId: dessertCat.id,
          minSelect: 3,
          maxSelect: 3,
          isRequired: true,
          displayOrder: 7,
          customLabel: 'Wybierz 3 desery',
        },
      })
    }

    // ────────────────────────────────────────────────────────────────────────
    // Połączenia pakietów z opcjami (przykładowe dla każdego pakietu)
    // ────────────────────────────────────────────────────────────────────────
    
    // Standard - podstawowe opcje
    const basicOptions = createdOptions.filter(o => 
      ['BEVERAGES', 'DESSERT_UPGRADES', 'SPECIAL_MENUS'].includes(o.category)
    ).slice(0, 8)

    for (let i = 0; i < basicOptions.length; i++) {
      await prisma.menuPackageOption.create({
        data: {
          packageId: packageStandard.id,
          optionId: basicOptions[i].id,
          displayOrder: i + 1,
        },
      })
    }

    // Premium - więcej opcji
    const premiumOptions = createdOptions.filter(o => 
      ['BEVERAGES', 'DESSERT_UPGRADES', 'APPETIZERS', 'SPECIAL_MENUS'].includes(o.category)
    ).slice(0, 12)

    for (let i = 0; i < premiumOptions.length; i++) {
      await prisma.menuPackageOption.create({
        data: {
          packageId: packagePremium.id,
          optionId: premiumOptions[i].id,
          displayOrder: i + 1,
        },
      })
    }

    // VIP - wszystkie opcje
    for (let i = 0; i < createdOptions.length; i++) {
      await prisma.menuPackageOption.create({
        data: {
          packageId: packageVIP.id,
          optionId: createdOptions[i].id,
          displayOrder: i + 1,
        },
      })
    }
  }

  console.log(`\n✅ Utworzono ${createdTemplates.length} szablonów menu`)
  console.log(`✅ Utworzono ${packageCount} pakietów (po 3 dla każdego typu)\n`)

  // ──────────────────────────────────────────────────────────────────────────
  // 4. Podsumowanie
  // ──────────────────────────────────────────────────────────────────────────
  const finalTemplates = await prisma.menuTemplate.findMany({
    include: {
      _count: {
        select: { packages: true },
      },
      eventType: true,
    },
  })

  const finalPackages = await prisma.menuPackage.count()
  const finalOptions = await prisma.menuOption.count()
  const finalCategorySettings = await prisma.packageCategorySettings.count()
  const finalPackageOptions = await prisma.menuPackageOption.count()

  console.log('═══════════════════════════════════════════════════════════════')
  console.log('📊 PODSUMOWANIE SEEDA MENU')
  console.log('═══════════════════════════════════════════════════════════════')
  console.log(`📋 Szablony menu:        ${finalTemplates.length}`)
  console.log(`📦 Pakiety:              ${finalPackages}`)
  console.log(`🎨 Opcje dodatkowe:      ${finalOptions}`)
  console.log(`⚙️  Ustawienia kategorii: ${finalCategorySettings}`)
  console.log(`🔗 Połączenia opcji:     ${finalPackageOptions}\n`)

  console.log('📋 Szablony z liczbą pakietów:\n')
  for (const template of finalTemplates) {
    console.log(`   ${template.eventType.name.padEnd(20, ' ')} ${template._count.packages} pakiety`)
  }

  console.log('\n═══════════════════════════════════════════════════════════════')
  console.log('✅ Seed menu zako��czony pomyślnie!')
  console.log('═══════════════════════════════════════════════════════════════\n')
}

main()
  .catch((e) => {
    console.error('❌ Błąd podczas seedowania menu:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
