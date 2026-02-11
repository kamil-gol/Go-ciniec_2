/**
 * Advanced Menu Seed Data
 * 
 * Seed data for MenuOption, MenuTemplate, MenuPackage, and relationships
 * Run with: npm run db:seed:menu:advanced
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// ════════════════════════════════════════════════════════════════════════════
// OPCJE MENU (MenuOption)
// ════════════════════════════════════════════════════════════════════════════

type MenuOptionInput = {
  name: string
  description: string
  shortDescription: string
  category: string
  priceType: 'PER_PERSON' | 'PER_EVENT' | 'PERCENTAGE'
  priceAmount: number
  allowMultiple: boolean
  maxQuantity: number
  icon: string
  displayOrder: number
}

const MENU_OPTIONS: MenuOptionInput[] = [
  // ──────────────────────────────────────────────────────────────────────────
  // MUZYKA
  // ──────────────────────────────────────────────────────────────────────────
  {
    name: 'DJ - Pakiet podstawowy',
    description: 'DJ z profesjonalnym sprzętem nagłaśnieniowym i oświetleniem. Gra przez 5 godzin.',
    shortDescription: 'DJ - 5 godzin',
    category: 'MUSIC',
    priceType: 'PER_EVENT',
    priceAmount: 2000,
    allowMultiple: false,
    maxQuantity: 1,
    icon: '🎧',
    displayOrder: 1,
  },
  {
    name: 'DJ - Pakiet premium',
    description: 'DJ z pełnym wyposażeniem + oświetlenie LED + ciężki dym. Gra przez 7 godzin.',
    shortDescription: 'DJ Premium - 7 godzin',
    category: 'MUSIC',
    priceType: 'PER_EVENT',
    priceAmount: 3500,
    allowMultiple: false,
    maxQuantity: 1,
    icon: '🎶',
    displayOrder: 2,
  },
  {
    name: 'Zespół muzyczny',
    description: 'Zespół muzyczny na żywo (4-5 osób). Repertuar dostosowany do wydarzenia.',
    shortDescription: 'Zespół na żywo - 4h',
    category: 'MUSIC',
    priceType: 'PER_EVENT',
    priceAmount: 5000,
    allowMultiple: false,
    maxQuantity: 1,
    icon: '🎸',
    displayOrder: 3,
  },
  {
    name: 'Orkiestra',
    description: 'Orkiestra dęta (8-10 osób). Tradycyjna muzyka weselna.',
    shortDescription: 'Orkiestra - 4h',
    category: 'MUSIC',
    priceType: 'PER_EVENT',
    priceAmount: 6000,
    allowMultiple: false,
    maxQuantity: 1,
    icon: '🎺',
    displayOrder: 4,
  },
  {
    name: 'Dodatkowa godzina muzyki',
    description: 'Przedłużenie gry DJ lub zespołu o 1 godzinę',
    shortDescription: '+1 godzina',
    category: 'MUSIC',
    priceType: 'PER_EVENT',
    priceAmount: 400,
    allowMultiple: true,
    maxQuantity: 5,
    icon: '⏱️',
    displayOrder: 5,
  },

  // ──────────────────────────────────────────────────────────────────────────
  // DEKORACJE
  // ──────────────────────────────────────────────────────────────────────────
  {
    name: 'Dekoracja stołów',
    description: 'Profesjonalna dekoracja stołów: obrusy, serwetki, świece, kwiaty sezonowe',
    shortDescription: 'Dekoracja stołów',
    category: 'DECORATION',
    priceType: 'PER_EVENT',
    priceAmount: 1500,
    allowMultiple: false,
    maxQuantity: 1,
    icon: '🌺',
    displayOrder: 6,
  },
  {
    name: 'Dekoracja sali - podstawowa',
    description: 'Dekoracja sali: brama balonowa, dekoracja sceny, oświetlenie ambientowe',
    shortDescription: 'Dekoracja sali basic',
    category: 'DECORATION',
    priceType: 'PER_EVENT',
    priceAmount: 2000,
    allowMultiple: false,
    maxQuantity: 1,
    icon: '🎉',
    displayOrder: 7,
  },
  {
    name: 'Dekoracja sali - premium',
    description: 'Kompleksowa dekoracja: kwiaty świeże, tkaniny, oświetlenie LED, napis świetlny',
    shortDescription: 'Dekoracja premium',
    category: 'DECORATION',
    priceType: 'PER_EVENT',
    priceAmount: 4000,
    allowMultiple: false,
    maxQuantity: 1,
    icon: '✨',
    displayOrder: 8,
  },
  {
    name: 'Fotobudka',
    description: 'Fotobudka z nieskończoną ilością wydruków + rekwizyty + album gościnny',
    shortDescription: 'Fotobudka - 4h',
    category: 'DECORATION',
    priceType: 'PER_EVENT',
    priceAmount: 1200,
    allowMultiple: false,
    maxQuantity: 1,
    icon: '📸',
    displayOrder: 9,
  },

  // ──────────────────────────────────────────────────────────────────────────
  // NAPOJE
  // ──────────────────────────────────────────────────────────────────────────
  {
    name: 'Bar alkoholowy - podstawowy',
    description: 'Wódka, piwo, wino białe/czerwone. Napoje bezalkoholowe w cenie.',
    shortDescription: 'Bar podstawowy',
    category: 'DRINKS',
    priceType: 'PER_PERSON',
    priceAmount: 80,
    allowMultiple: false,
    maxQuantity: 1,
    icon: '🍺',
    displayOrder: 10,
  },
  {
    name: 'Bar alkoholowy - premium',
    description: 'Wódki markowe, whisky, likier, szampan, piwo kraftowe, wina włoskie',
    shortDescription: 'Bar premium',
    category: 'DRINKS',
    priceType: 'PER_PERSON',
    priceAmount: 150,
    allowMultiple: false,
    maxQuantity: 1,
    icon: '🥂',
    displayOrder: 11,
  },
  {
    name: 'Barman + drink bar',
    description: 'Profesjonalny barman przygotowujący drinki na żywo. Min. 50 osób.',
    shortDescription: 'Barman + drinki',
    category: 'DRINKS',
    priceType: 'PER_EVENT',
    priceAmount: 1500,
    allowMultiple: false,
    maxQuantity: 1,
    icon: '🍸',
    displayOrder: 12,
  },
  {
    name: 'Toast o północy',
    description: 'Szampan + przekąski na toast o północy',
    shortDescription: 'Toast szampan',
    category: 'DRINKS',
    priceType: 'PER_PERSON',
    priceAmount: 20,
    allowMultiple: false,
    maxQuantity: 1,
    icon: '🥂',
    displayOrder: 13,
  },

  // ──────────────────────────────────────────────────────────────────────────
  // TORTY & SŁODYCZE
  // ──────────────────────────────────────────────────────────────────────────
  {
    name: 'Tort weselny - 3 piętra',
    description: 'Tort 3-piętrowy z personalizacją. Smak do wyboru. Wystarczy na ~80 osób.',
    shortDescription: 'Tort 3-piętra',
    category: 'CAKE',
    priceType: 'PER_EVENT',
    priceAmount: 800,
    allowMultiple: false,
    maxQuantity: 1,
    icon: '🎂',
    displayOrder: 14,
  },
  {
    name: 'Tort urodzinowy - 2 piętra',
    description: 'Tort urodzinowy z personalizacją i dekoracjami. Wystarczy na ~50 osób.',
    shortDescription: 'Tort urodzinowy',
    category: 'CAKE',
    priceType: 'PER_EVENT',
    priceAmount: 500,
    allowMultiple: false,
    maxQuantity: 1,
    icon: '🎉',
    displayOrder: 15,
  },
  {
    name: 'Candy bar',
    description: 'Słodki stół: ciasteczka, muffiny, makaroniki, słodycze, owoce',
    shortDescription: 'Słodki stół',
    category: 'CAKE',
    priceType: 'PER_EVENT',
    priceAmount: 1200,
    allowMultiple: false,
    maxQuantity: 1,
    icon: '🍭',
    displayOrder: 16,
  },

  // ──────────────────────────────────────────────────────────────────────────
  // INNE
  // ──────────────────────────────────────────────────────────────────────────
  {
    name: 'Animacje dla dzieci',
    description: 'Profesjonalny animator z grami i zabawami dla dzieci (3h)',
    shortDescription: 'Animator - 3h',
    category: 'ENTERTAINMENT',
    priceType: 'PER_EVENT',
    priceAmount: 800,
    allowMultiple: false,
    maxQuantity: 1,
    icon: '🎨',
    displayOrder: 17,
  },
  {
    name: 'Noclegi dla gości',
    description: 'Pokoje gościnne w obiekcie lub hotelu partnerskim (cena za 1 osóbę)',
    shortDescription: 'Nocleg',
    category: 'ACCOMMODATION',
    priceType: 'PER_PERSON',
    priceAmount: 100,
    allowMultiple: true,
    maxQuantity: 50,
    icon: '🛌',
    displayOrder: 18,
  },
  {
    name: 'Koordynator ślubu',
    description: 'Profesjonalny koordynator - pełna obsługa wydarzenia od A do Z',
    shortDescription: 'Koordynator',
    category: 'SERVICE',
    priceType: 'PER_EVENT',
    priceAmount: 2000,
    allowMultiple: false,
    maxQuantity: 1,
    icon: '💼',
    displayOrder: 19,
  },
  {
    name: 'Fotograf + Kamerzysta',
    description: 'Profesjonalna para foto-video. Reportaż + sesja plenerowa + film 4K',
    shortDescription: 'Foto + Video',
    category: 'SERVICE',
    priceType: 'PER_EVENT',
    priceAmount: 4500,
    allowMultiple: false,
    maxQuantity: 1,
    icon: '📷',
    displayOrder: 20,
  },
]

// ════════════════════════════════════════════════════════════════════════════
// MAIN SEED FUNCTION
// ════════════════════════════════════════════════════════════════════════════

async function main() {
  console.log('🎉 Seedowanie zaawansowanych danych menu...\n')

  // ──────────────────────────────────────────────────────────────────────────
  // 0. Pobierz EventTypes i DishCategories z bazy
  // ──────────────────────────────────────────────────────────────────────────
  console.log('🔍 Pobieranie danych z bazy...')

  const eventTypes = await prisma.eventType.findMany()
  const dishCategories = await prisma.dishCategory.findMany()

  if (eventTypes.length === 0) {
    console.error('❌ Brak EventTypes w bazie! Uruchom najpierw db:seed')
    process.exit(1)
  }

  if (dishCategories.length === 0) {
    console.error('❌ Brak DishCategories w bazie! Uruchom najpierw db:seed:menu')
    process.exit(1)
  }

  console.log(`   ✓ EventTypes: ${eventTypes.length}`)
  console.log(`   ✓ DishCategories: ${dishCategories.length}\n`)

  // Twórz mapy dla łatwiejszego dostępu
  const eventTypeMap = new Map(eventTypes.map(et => [et.name, et.id]))
  const categoryMap = new Map(dishCategories.map(dc => [dc.slug, dc.id]))

  // ──────────────────────────────────────────────────────────────────────────
  // 1. Czyść istniejące dane zaawansowane
  // ──────────────────────────────────────────────────────────────────────────
  const existingOptions = await prisma.menuOption.count()
  const existingTemplates = await prisma.menuTemplate.count()
  const existingPackages = await prisma.menuPackage.count()

  if (existingOptions > 0 || existingTemplates > 0 || existingPackages > 0) {
    console.log('⚠️  Dane menu już istnieją:')
    console.log(`   - Opcje: ${existingOptions}`)
    console.log(`   - Szablony: ${existingTemplates}`)
    console.log(`   - Pakiety: ${existingPackages}\n`)
    console.log('🗑️  Czyszczenie...\n')

    // Usuń w odpowiedniej kolejności (FK)
    await prisma.packageCategorySettings.deleteMany()
    await prisma.menuPackageOption.deleteMany()
    await prisma.menuPackage.deleteMany()
    await prisma.menuTemplate.deleteMany()
    await prisma.menuOption.deleteMany()

    console.log('   ✓ Wyczyszczono\n')
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 2. Tworzenie MenuOptions
  // ──────────────────────────────────────────────────────────────────────────
  console.log('⚙️  Tworzenie opcji menu...')

  const optionMap = new Map<string, string>()

  for (const optionData of MENU_OPTIONS) {
    const option = await prisma.menuOption.create({
      data: {
        name: optionData.name,
        description: optionData.description,
        shortDescription: optionData.shortDescription,
        category: optionData.category,
        priceType: optionData.priceType,
        priceAmount: optionData.priceAmount,
        allowMultiple: optionData.allowMultiple,
        maxQuantity: optionData.maxQuantity,
        icon: optionData.icon,
        displayOrder: optionData.displayOrder,
        isActive: true,
      },
    })
    optionMap.set(option.name, option.id)
    console.log(`   ✓ ${option.icon} ${option.name}`)
  }

  console.log(`\n✅ Utworzono ${MENU_OPTIONS.length} opcji menu\n`)

  // ──────────────────────────────────────────────────────────────────────────
  // 3. Tworzenie MenuTemplates & MenuPackages
  // ──────────────────────────────────────────────────────────────────────────
  console.log('📋 Tworzenie szablonów menu i pakietów...\n')

  let templateCount = 0
  let packageCount = 0
  let settingsCount = 0

  // Szablon dla Wesele
  const weseleId = eventTypeMap.get('Wesele')
  if (weseleId) {
    const templateWesele = await prisma.menuTemplate.create({
      data: {
        eventTypeId: weseleId,
        name: 'Menu Weselne',
        description: 'Klasyczne menu weselne z pełną obsługą',
        isActive: true,
        displayOrder: 1,
      },
    })
    templateCount++

    // 3 pakiety dla wesela
    const packages = [
      {
        name: 'Pakiet Ekonomiczny',
        description: 'Podstawowe menu weselne w atrakcyjnej cenie',
        shortDescription: 'Dobre menu w przystępnej cenie',
        pricePerAdult: 200,
        pricePerChild: 140,
        color: '#22c55e',
        badgeText: 'OSZCZĘDNOŚĆ',
        displayOrder: 1,
        includedItems: [
          'Zupa do wyboru',
          'Danie główne',
          '2 dodatki',
          'Deser',
          'Kawa/Herbata',
        ],
      },
      {
        name: 'Pakiet Standard',
        description: 'Kompletne menu weselne z większym wyborem dań',
        shortDescription: 'Popularny wybór naszych klientów',
        pricePerAdult: 280,
        pricePerChild: 196,
        color: '#3b82f6',
        badgeText: 'POLECANE',
        isPopular: true,
        displayOrder: 2,
        includedItems: [
          'Przystawki zimne',
          'Zupa do wyboru',
          '2 dania główne',
          '3 dodatki',
          'Sałatki',
          'Deser',
          'Kawa/Herbata',
        ],
      },
      {
        name: 'Pakiet Premium',
        description: 'Ekskluzywne menu z najlepszych składników',
        shortDescription: 'Luksusowe doświadczenie kulinarne',
        pricePerAdult: 400,
        pricePerChild: 280,
        color: '#f59e0b',
        badgeText: 'PREMIUM',
        isRecommended: true,
        displayOrder: 3,
        includedItems: [
          'Przystawki zimne i ciepłe',
          'Zupa premium',
          '3 dania główne (w tym ryba)',
          '4 dodatki',
          'Sałatki i surówki',
          '2 desery',
          'Kawa/Herbata/Herbatki owocowe',
          'Toast o północy',
        ],
      },
    ]

    for (const pkgData of packages) {
      const pkg = await prisma.menuPackage.create({
        data: {
          menuTemplateId: templateWesele.id,
          ...pkgData,
        },
      })
      packageCount++

      // Dodaj ustawienia kategorii dla pakietu
      const categorySettings = [
        { categorySlug: 'SOUP', minSelect: 1, maxSelect: 1, isRequired: true },
        { categorySlug: 'APPETIZER', minSelect: 0, maxSelect: 2, isRequired: false },
        { categorySlug: 'MAIN_COURSE', minSelect: 1, maxSelect: 3, isRequired: true },
        { categorySlug: 'SIDE_DISH', minSelect: 2, maxSelect: 4, isRequired: true },
        { categorySlug: 'SALAD', minSelect: 0, maxSelect: 2, isRequired: false },
        { categorySlug: 'DESSERT', minSelect: 1, maxSelect: 2, isRequired: true },
      ]

      for (const setting of categorySettings) {
        const catId = categoryMap.get(setting.categorySlug)
        if (catId) {
          await prisma.packageCategorySettings.create({
            data: {
              packageId: pkg.id,
              categoryId: catId,
              minSelect: setting.minSelect,
              maxSelect: setting.maxSelect,
              isRequired: setting.isRequired,
              isEnabled: true,
              displayOrder: 0,
            },
          })
          settingsCount++
        }
      }
    }

    console.log(`   ✓ Wesele: 1 szablon, 3 pakiety`)
  }

  // Szablon dla Urodziny
  const urodzinyId = eventTypeMap.get('Urodziny')
  if (urodzinyId) {
    const templateUrodziny = await prisma.menuTemplate.create({
      data: {
        eventTypeId: urodzinyId,
        name: 'Menu Urodzinowe',
        description: 'Menu idealne na przyjęcie urodzinowe',
        isActive: true,
        displayOrder: 1,
      },
    })
    templateCount++

    const packages = [
      {
        name: 'Pakiet Rodzinny',
        description: 'Menu dla całej rodziny',
        shortDescription: 'Dla dzieci i dorosłych',
        pricePerAdult: 180,
        pricePerChild: 126,
        color: '#10b981',
        displayOrder: 1,
        includedItems: ['Przystawki', 'Danie główne', 'Dodatki', 'Tort urodzinowy', 'Napoje'],
      },
      {
        name: 'Pakiet Premium',
        description: 'Rozbudowane menu urodzinowe',
        shortDescription: 'Z większym wyborem',
        pricePerAdult: 250,
        pricePerChild: 175,
        color: '#f59e0b',
        isPopular: true,
        displayOrder: 2,
        includedItems: [
          'Zimne przystawki',
          'Zupa',
          '2 dania główne',
          'Dodatki',
          'Sałatki',
          'Tort + deser',
          'Kawa/Herbata',
        ],
      },
    ]

    for (const pkgData of packages) {
      const pkg = await prisma.menuPackage.create({
        data: {
          menuTemplateId: templateUrodziny.id,
          ...pkgData,
        },
      })
      packageCount++

      const categorySettings = [
        { categorySlug: 'APPETIZER', minSelect: 1, maxSelect: 2, isRequired: true },
        { categorySlug: 'MAIN_COURSE', minSelect: 1, maxSelect: 2, isRequired: true },
        { categorySlug: 'SIDE_DISH', minSelect: 1, maxSelect: 3, isRequired: true },
        { categorySlug: 'DESSERT', minSelect: 1, maxSelect: 1, isRequired: true },
      ]

      for (const setting of categorySettings) {
        const catId = categoryMap.get(setting.categorySlug)
        if (catId) {
          await prisma.packageCategorySettings.create({
            data: {
              packageId: pkg.id,
              categoryId: catId,
              minSelect: setting.minSelect,
              maxSelect: setting.maxSelect,
              isRequired: setting.isRequired,
              isEnabled: true,
              displayOrder: 0,
            },
          })
          settingsCount++
        }
      }
    }

    console.log(`   ✓ Urodziny: 1 szablon, 2 pakiety`)
  }

  // Szablon dla Komunia
  const komuniaId = eventTypeMap.get('Komunia')
  if (komuniaId) {
    const templateKomunia = await prisma.menuTemplate.create({
      data: {
        eventTypeId: komuniaId,
        name: 'Menu Komunijne',
        description: 'Specjalne menu na Pierwszą Komunię Świętą',
        isActive: true,
        displayOrder: 1,
      },
    })
    templateCount++

    const packages = [
      {
        name: 'Pakiet Komunijny',
        description: 'Klasyczne menu komunijne',
        shortDescription: 'Tradycyjne smaki',
        pricePerAdult: 220,
        pricePerChild: 154,
        color: '#87CEEB',
        isPopular: true,
        displayOrder: 1,
        includedItems: ['Rosół', 'Schabowy/Kurczak', 'Ziemniaki + surówka', 'Deser', 'Napoje'],
      },
      {
        name: 'Pakiet Rozszerzony',
        description: 'Większy wybór dań',
        shortDescription: 'Z większym wyborem',
        pricePerAdult: 280,
        pricePerChild: 196,
        color: '#3b82f6',
        displayOrder: 2,
        includedItems: [
          'Przystawki',
          'Rosół z makaronem',
          '2 dania główne',
          'Dodatki i sałatki',
          '2 desery',
          'Kawa/Herbata',
        ],
      },
    ]

    for (const pkgData of packages) {
      const pkg = await prisma.menuPackage.create({
        data: {
          menuTemplateId: templateKomunia.id,
          ...pkgData,
        },
      })
      packageCount++

      const categorySettings = [
        { categorySlug: 'SOUP', minSelect: 1, maxSelect: 1, isRequired: true },
        { categorySlug: 'MAIN_COURSE', minSelect: 1, maxSelect: 2, isRequired: true },
        { categorySlug: 'SIDE_DISH', minSelect: 1, maxSelect: 2, isRequired: true },
        { categorySlug: 'DESSERT', minSelect: 1, maxSelect: 2, isRequired: true },
      ]

      for (const setting of categorySettings) {
        const catId = categoryMap.get(setting.categorySlug)
        if (catId) {
          await prisma.packageCategorySettings.create({
            data: {
              packageId: pkg.id,
              categoryId: catId,
              minSelect: setting.minSelect,
              maxSelect: setting.maxSelect,
              isRequired: setting.isRequired,
              isEnabled: true,
              displayOrder: 0,
            },
          })
          settingsCount++
        }
      }
    }

    console.log(`   ✓ Komunia: 1 szablon, 2 pakiety`)
  }

  console.log(`\n✅ Utworzono ${templateCount} szablonów i ${packageCount} pakietów\n`)
  console.log(`✅ Utworzono ${settingsCount} ustawień kategorii\n`)

  // ──────────────────────────────────────────────────────────────────────────
  // 4. PODSUMOWANIE
  // ──────────────────────────────────────────────────────────────────────────
  const finalOptions = await prisma.menuOption.count()
  const finalTemplates = await prisma.menuTemplate.count()
  const finalPackages = await prisma.menuPackage.count()
  const finalSettings = await prisma.packageCategorySettings.count()

  console.log('═══════════════════════════════════════════════════════════')
  console.log('📊 PODSUMOWANIE ZAAWANSOWANEGO SEEDA MENU')
  console.log('═══════════════════════════════════════════════════════════')
  console.log(`⚙️  Opcje menu:          ${finalOptions}`)
  console.log(`📋 Szablony menu:       ${finalTemplates}`)
  console.log(`📦 Pakiety menu:        ${finalPackages}`)
  console.log(`⚙️  Ustawienia kategorii: ${finalSettings}`)
  console.log('\n🎉 Typy wydarzeń z menu:')
  console.log('   ✓ Wesele - 3 pakiety (Ekonomiczny, Standard, Premium)')
  console.log('   ✓ Urodziny - 2 pakiety (Rodzinny, Premium)')
  console.log('   ✓ Komunia - 2 pakiety (Komunijny, Rozszerzony)')
  console.log('\n═══════════════════════════════════════════════════════════')
  console.log('✅ Seed zaawansowanego menu zakończony pomyślnie!')
  console.log('═══════════════════════════════════════════════════════════\n')
}

main()
  .catch((e) => {
    console.error('❌ Błąd podczas seedowania zaawansowanego menu:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
