/**
 * Menu Advanced Seed Data
 * 
 * Seed data for MenuOption, MenuTemplate, MenuPackage, and MenuPackageOption
 * Run with: npm run db:seed:menu-advanced
 * 
 * Prerequisites:
 * - EventTypes must exist in database
 * - Run seed-menu.ts first (for DishCategory and Dish)
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// ════════════════════════════════════════════════════════════════════════════
// MENU OPTIONS - Opcje dodatkowe do pakietów
// ════════════════════════════════════════════════════════════════════════════

type MenuOptionInput = {
  name: string
  description: string
  shortDescription: string
  category: string
  priceType: 'PER_PERSON' | 'PER_ADULT' | 'FLAT_FEE' | 'FREE'
  priceAmount: number
  allowMultiple: boolean
  maxQuantity: number
  icon?: string
  displayOrder: number
}

const MENU_OPTIONS: MenuOptionInput[] = [
  // ────────────────────────────────────────────────────────────────────────────
  // NAPOJE (BEVERAGES)
  // ────────────────────────────────────────────────────────────────────────────
  {
    name: 'Bar alkoholowy - pełen',
    description: 'Pełen asortyment alkoholi: wódka, whisky, gin, rum, likery, wina',
    shortDescription: 'Pełen bar z alkoholami premium',
    category: 'BEVERAGES',
    priceType: 'PER_ADULT',
    priceAmount: 80,
    allowMultiple: false,
    maxQuantity: 1,
    icon: '🍸',
    displayOrder: 1,
  },
  {
    name: 'Bar alkoholowy - podstawowy',
    description: 'Podstawowy asortyment: wódka, piwo, wino białe i czerwone',
    shortDescription: 'Podstawowy bar alkoholowy',
    category: 'BEVERAGES',
    priceType: 'PER_ADULT',
    priceAmount: 50,
    allowMultiple: false,
    maxQuantity: 1,
    icon: '🍺',
    displayOrder: 2,
  },
  {
    name: 'Fontanna czekoladowa',
    description: 'Fontanna czekoladowa z owocami do maczania',
    shortDescription: 'Fontanna czekoladowa z owocami',
    category: 'BEVERAGES',
    priceType: 'FLAT_FEE',
    priceAmount: 800,
    allowMultiple: false,
    maxQuantity: 1,
    icon: '🍫',
    displayOrder: 3,
  },
  {
    name: 'Drink bar bezalkoholowy',
    description: 'Profesjonalny barman przygotowujący drinki bezalkoholowe',
    shortDescription: 'Drink bar bez alkoholu',
    category: 'BEVERAGES',
    priceType: 'FLAT_FEE',
    priceAmount: 600,
    allowMultiple: false,
    maxQuantity: 1,
    icon: '🍹',
    displayOrder: 4,
  },
  {
    name: 'Mobilny bar kawowy',
    description: 'Barista z mobilnym barem kawowym - kawa, herbata, cappuccino',
    shortDescription: 'Bar kawowy z baristą',
    category: 'BEVERAGES',
    priceType: 'FLAT_FEE',
    priceAmount: 500,
    allowMultiple: false,
    maxQuantity: 1,
    icon: '☕',
    displayOrder: 5,
  },

  // ────────────────────────────────────────────────────────────────────────────
  // ROZRYWKA (ENTERTAINMENT)
  // ────────────────────────────────────────────────────────────────────────────
  {
    name: 'DJ + Oprawa muzyczna',
    description: 'Profesjonalny DJ z pełnym sprzętem nagłośnieniowym i oświetleniem',
    shortDescription: 'DJ z nagłośnieniem',
    category: 'ENTERTAINMENT',
    priceType: 'FLAT_FEE',
    priceAmount: 2000,
    allowMultiple: false,
    maxQuantity: 1,
    icon: '🎧',
    displayOrder: 1,
  },
  {
    name: 'Zespół muzyczny - coverband',
    description: 'Zespół muzyczny grający covery znanych utworów (3-5 osób)',
    shortDescription: 'Zespół coverowy',
    category: 'ENTERTAINMENT',
    priceType: 'FLAT_FEE',
    priceAmount: 3500,
    allowMultiple: false,
    maxQuantity: 1,
    icon: '🎸',
    displayOrder: 2,
  },
  {
    name: 'Wodzirej + zabawy dla dzieci',
    description: 'Profesjonalny wodzirej z animacjami dla dzieci',
    shortDescription: 'Wodzirej z animacjami',
    category: 'ENTERTAINMENT',
    priceType: 'FLAT_FEE',
    priceAmount: 800,
    allowMultiple: false,
    maxQuantity: 1,
    icon: '🤡',
    displayOrder: 3,
  },
  {
    name: 'Fotobudka',
    description: 'Profesjonalna fotobudka z wydrukami i rekwizytami (4h)',
    shortDescription: 'Fotobudka z wydrukami',
    category: 'ENTERTAINMENT',
    priceType: 'FLAT_FEE',
    priceAmount: 1200,
    allowMultiple: false,
    maxQuantity: 1,
    icon: '📸',
    displayOrder: 4,
  },
  {
    name: 'Ciężki dym - taniec w chmurach',
    description: 'Efekt ciężkiego dymu do pierwszego tańca',
    shortDescription: 'Ciężki dym',
    category: 'ENTERTAINMENT',
    priceType: 'FLAT_FEE',
    priceAmount: 400,
    allowMultiple: false,
    maxQuantity: 1,
    icon: '☁️',
    displayOrder: 5,
  },
  {
    name: 'Pokaz ognia/fireshow',
    description: 'Profesjonalny pokaz tańca z ogniem (15-20 minut)',
    shortDescription: 'Pokaz ognia',
    category: 'ENTERTAINMENT',
    priceType: 'FLAT_FEE',
    priceAmount: 1000,
    allowMultiple: false,
    maxQuantity: 1,
    icon: '🔥',
    displayOrder: 6,
  },

  // ────────────────────────────────────────────────────────────────────────────
  // DEKORACJE (DECORATIONS)
  // ────────────────────────────────────────────────────────────────────────────
  {
    name: 'Dekoracja sali - podstawowa',
    description: 'Podstawowa dekoracja stołów i sali (obrusy, serwetki, świece)',
    shortDescription: 'Podstawowa dekoracja',
    category: 'DECORATIONS',
    priceType: 'FLAT_FEE',
    priceAmount: 800,
    allowMultiple: false,
    maxQuantity: 1,
    icon: '🎀',
    displayOrder: 1,
  },
  {
    name: 'Dekoracja sali - premium',
    description: 'Premium dekoracja z kompozycjami kwiatowymi i designerskimi elementami',
    shortDescription: 'Premium dekoracja',
    category: 'DECORATIONS',
    priceType: 'FLAT_FEE',
    priceAmount: 2000,
    allowMultiple: false,
    maxQuantity: 1,
    icon: '💐',
    displayOrder: 2,
  },
  {
    name: 'Napis LED z imionami',
    description: 'Podświetlany napis LED z imionami lub inicjałami',
    shortDescription: 'Napis LED',
    category: 'DECORATIONS',
    priceType: 'FLAT_FEE',
    priceAmount: 500,
    allowMultiple: false,
    maxQuantity: 1,
    icon: '💡',
    displayOrder: 3,
  },
  {
    name: 'Balony z helem',
    description: 'Zestaw balonów z helem w wybranej kolorystyce',
    shortDescription: 'Balony z helem',
    category: 'DECORATIONS',
    priceType: 'FLAT_FEE',
    priceAmount: 300,
    allowMultiple: true,
    maxQuantity: 5,
    icon: '🎈',
    displayOrder: 4,
  },

  // ────────────────────────────────────────────────────────────────────────────
  // DODATKI KULINARNE (CULINARY)
  // ────────────────────────────────────────────────────────────────────────────
  {
    name: 'Tort weselny (3-piętrowy)',
    description: 'Elegancki tort weselny 3-piętrowy (1kg na 10 osób)',
    shortDescription: 'Tort 3-piętrowy',
    category: 'CULINARY',
    priceType: 'PER_PERSON',
    priceAmount: 15,
    allowMultiple: false,
    maxQuantity: 1,
    icon: '🎂',
    displayOrder: 1,
  },
  {
    name: 'Candy bar',
    description: 'Słodki stół z różnorodnymi deserami, ciastkami i słodyczami',
    shortDescription: 'Słodki stół',
    category: 'CULINARY',
    priceType: 'PER_PERSON',
    priceAmount: 20,
    allowMultiple: false,
    maxQuantity: 1,
    icon: '🍭',
    displayOrder: 2,
  },
  {
    name: 'Stacja sushi',
    description: 'Live cooking - świeże sushi przygotowywane na miejscu',
    shortDescription: 'Live sushi',
    category: 'CULINARY',
    priceType: 'PER_ADULT',
    priceAmount: 35,
    allowMultiple: false,
    maxQuantity: 1,
    icon: '🍣',
    displayOrder: 3,
  },
  {
    name: 'Grill na żywo',
    description: 'Grillmaster z mobilnym grillem - kiełbaski, karkówka, warzywa',
    shortDescription: 'Live grill',
    category: 'CULINARY',
    priceType: 'FLAT_FEE',
    priceAmount: 1500,
    allowMultiple: false,
    maxQuantity: 1,
    icon: '🍖',
    displayOrder: 4,
  },
  {
    name: 'Stół wiejski',
    description: 'Tradycyjny stół wiejski z wędlinami, serami, oscypkami',
    shortDescription: 'Stół wiejski',
    category: 'CULINARY',
    priceType: 'FLAT_FEE',
    priceAmount: 1200,
    allowMultiple: false,
    maxQuantity: 1,
    icon: '🧀',
    displayOrder: 5,
  },
  {
    name: 'Posiłek nocny (poczęstunek)',
    description: 'Gorący poczęstunek w późnych godzinach (zupa, kiełbaski, bigos)',
    shortDescription: 'Poczęstunek nocny',
    category: 'CULINARY',
    priceType: 'PER_PERSON',
    priceAmount: 25,
    allowMultiple: false,
    maxQuantity: 1,
    icon: '🍲',
    displayOrder: 6,
  },

  // ────────────────────────────────────────────────────────────────────────────
  // USŁUGI (SERVICES)
  // ────────────────────────────────────────────────────────────────────────────
  {
    name: 'Obsługa kelnerska - standard',
    description: 'Profesjonalna obsługa kelnerska (1 kelner na 20 osób)',
    shortDescription: 'Kelnerzy standard',
    category: 'SERVICES',
    priceType: 'FREE',
    priceAmount: 0,
    allowMultiple: false,
    maxQuantity: 1,
    icon: '🤵',
    displayOrder: 1,
  },
  {
    name: 'Obsługa kelnerska - premium',
    description: 'Premium obsługa kelnerska (1 kelner na 15 osób)',
    shortDescription: 'Kelnerzy premium',
    category: 'SERVICES',
    priceType: 'PER_PERSON',
    priceAmount: 10,
    allowMultiple: false,
    maxQuantity: 1,
    icon: '👔',
    displayOrder: 2,
  },
  {
    name: 'Parking z obsługą valet',
    description: 'Profesjonalna obsługa parkingowa valet parking',
    shortDescription: 'Valet parking',
    category: 'SERVICES',
    priceType: 'FLAT_FEE',
    priceAmount: 800,
    allowMultiple: false,
    maxQuantity: 1,
    icon: '🚗',
    displayOrder: 3,
  },
  {
    name: 'Koordynator wesela',
    description: 'Profesjonalny koordynator/konsultant ślubny',
    shortDescription: 'Koordynator',
    category: 'SERVICES',
    priceType: 'FLAT_FEE',
    priceAmount: 1500,
    allowMultiple: false,
    maxQuantity: 1,
    icon: '📋',
    displayOrder: 4,
  },
]

// ════════════════════════════════════════════════════════════════════════════
// MENU TEMPLATES - Szablony menu dla różnych typów wydarzeń
// ════════════════════════════════════════════════════════════════════════════

type MenuTemplateInput = {
  eventTypeName: string
  name: string
  description: string
  variant: string
  isActive: boolean
  displayOrder: number
}

const MENU_TEMPLATES: MenuTemplateInput[] = [
  // ────────────────────────────────────────────────────────────────────────────
  // WESELE
  // ────────────────────────────────────────────────────────────────────────────
  {
    eventTypeName: 'Wesele',
    name: 'Menu Weselne Klasyczne',
    description: 'Tradycyjne menu weselne z klasycznymi daniami polskiej kuchni',
    variant: 'CLASSIC',
    isActive: true,
    displayOrder: 1,
  },
  {
    eventTypeName: 'Wesele',
    name: 'Menu Weselne Premium',
    description: 'Ekskluzywne menu weselne z wykwintnymi daniami i dodatkami',
    variant: 'PREMIUM',
    isActive: true,
    displayOrder: 2,
  },
  {
    eventTypeName: 'Wesele',
    name: 'Menu Weselne Rustykalne',
    description: 'Menu w stylu rustykalnym z daniami regionalnymi',
    variant: 'RUSTIC',
    isActive: true,
    displayOrder: 3,
  },

  // ────────────────────────────────────────────────────────────────────────────
  // URODZINY
  // ────────────────────────────────────────────────────────────────────────────
  {
    eventTypeName: 'Urodziny',
    name: 'Menu Urodzinowe Standard',
    description: 'Klasyczne menu na przyjęcie urodzinowe',
    variant: 'STANDARD',
    isActive: true,
    displayOrder: 1,
  },
  {
    eventTypeName: 'Urodziny',
    name: 'Menu Urodzinowe Premium',
    description: 'Wyjątkowe menu na specjalne urodziny',
    variant: 'PREMIUM',
    isActive: true,
    displayOrder: 2,
  },

  // ────────────────────────────────────────────────────────────────────────────
  // KOMUNIA
  // ────────────────────────────────────────────────────────────────────────────
  {
    eventTypeName: 'Komunia',
    name: 'Menu Komunijne Rodzinne',
    description: 'Menu dostosowane do rodzinnego przyjęcia komunijnego',
    variant: 'FAMILY',
    isActive: true,
    displayOrder: 1,
  },
  {
    eventTypeName: 'Komunia',
    name: 'Menu Komunijne Eleganckie',
    description: 'Eleganckie menu na uroczystość Pierwszej Komunii',
    variant: 'ELEGANT',
    isActive: true,
    displayOrder: 2,
  },

  // ────────────────────────────────────────────────────────────────────────────
  // CHRZEST/ROCZEK
  // ────────────────────────────────────────────────────────────────────────────
  {
    eventTypeName: 'Chrzest/Roczek',
    name: 'Menu na Chrzest',
    description: 'Delikatne menu na uroczystość Chrztu Świętego',
    variant: 'GENTLE',
    isActive: true,
    displayOrder: 1,
  },

  // ────────────────────────────────────────────────────────────────────────────
  // ROCZNICA/JUBILEUSZ
  // ────────────────────────────────────────────────────────────────────────────
  {
    eventTypeName: 'Rocznica/Jubileusz',
    name: 'Menu Jubileuszowe',
    description: 'Eleganckie menu na rocznicę lub jubileusz',
    variant: 'ELEGANT',
    isActive: true,
    displayOrder: 1,
  },
]

// ════════════════════════════════════════════════════════════════════════════
// MENU PACKAGES - Pakiety menu z cenami
// ════════════════════════════════════════════════════════════════════════════

type MenuPackageInput = {
  templateVariant: string
  name: string
  description: string
  shortDescription: string
  pricePerAdult: number
  pricePerChild: number
  pricePerToddler: number
  color?: string
  icon?: string
  badgeText?: string
  displayOrder: number
  isPopular: boolean
  isRecommended: boolean
  includedItems: string[]
  optionCategories: string[] // Categories of options to link
}

const MENU_PACKAGES: MenuPackageInput[] = [
  // ────────────────────────────────────────────────────────────────────────────
  // WESELE - CLASSIC
  // ────────────────────────────────────────────────────────────────────────────
  {
    templateVariant: 'CLASSIC',
    name: 'Pakiet Standard',
    description: 'Klasyczne menu weselne z tradycyjnymi daniami polskiej kuchni',
    shortDescription: 'Tradycyjne dania polskie',
    pricePerAdult: 180,
    pricePerChild: 90,
    pricePerToddler: 0,
    color: '#10b981',
    icon: '🍽️',
    displayOrder: 1,
    isPopular: false,
    isRecommended: false,
    includedItems: [
      'Rosół z makaronem',
      'Karkówka w ziołach + Kotlet schabowy',
      'Ziemniaki pieczone + Surówka z kapusty',
      'Sałatka jarzynowa',
      'Sernik + Szarlotka',
      'Kompot',
    ],
    optionCategories: ['BEVERAGES', 'CULINARY'],
  },
  {
    templateVariant: 'CLASSIC',
    name: 'Pakiet Komfort',
    description: 'Rozszerzone menu z dodatkowymi daniami i lepszymi składnikami',
    shortDescription: 'Więcej wyborów i lepsze składniki',
    pricePerAdult: 220,
    pricePerChild: 110,
    pricePerToddler: 0,
    color: '#3b82f6',
    icon: '⭐',
    badgeText: 'Popularne',
    displayOrder: 2,
    isPopular: true,
    isRecommended: true,
    includedItems: [
      'Rosół z makaronem + Żurek staropolski (do wyboru)',
      'Polędwica wołowa + De volaille (do wyboru)',
      'Ziemniaki pieczone + Kasza gryczana',
      'Sałatka grecka + Coleslaw',
      'Przystawki (tatar, carpaccio)',
      'Tort weselny + Sernik',
      'Bar alkoholowy podstawowy',
    ],
    optionCategories: ['BEVERAGES', 'ENTERTAINMENT', 'CULINARY', 'DECORATIONS'],
  },
  {
    templateVariant: 'CLASSIC',
    name: 'Pakiet Premium',
    description: 'Ekskluzywne menu z najlepszymi daniami i pełnym serwisem',
    shortDescription: 'Najwyższa jakość i pełen serwis',
    pricePerAdult: 280,
    pricePerChild: 140,
    pricePerToddler: 0,
    color: '#8b5cf6',
    icon: '👑',
    badgeText: 'Premium',
    displayOrder: 3,
    isPopular: false,
    isRecommended: false,
    includedItems: [
      '2 zupy do wyboru (rosół, żurek, krem)',
      '3 dania główne (polędwica, de volaille, ryba)',
      'Dodatki: ziemniaki + kasza + warzywa z grilla',
      '3 sałatki (grecka, caprese, cezar)',
      'Przystawki premium (tatar, carpaccio, śledź)',
      'Tort weselny + Candy bar',
      'Bar alkoholowy pełen',
      'Obsługa kelnerska premium',
      'Posiłek nocny',
    ],
    optionCategories: ['BEVERAGES', 'ENTERTAINMENT', 'CULINARY', 'DECORATIONS', 'SERVICES'],
  },

  // ────────────────────────────────────────────────────────────────────────────
  // WESELE - PREMIUM
  // ────────────────────────────────────────────────────────────────────────────
  {
    templateVariant: 'PREMIUM',
    name: 'Pakiet Exclusive',
    description: 'Najwyższy poziom menu z wykwintnymi daniami i pełną obsługą',
    shortDescription: 'Ekskluzywne dania i obsługa',
    pricePerAdult: 350,
    pricePerChild: 175,
    pricePerToddler: 0,
    color: '#f59e0b',
    icon: '💎',
    badgeText: 'Exclusive',
    displayOrder: 1,
    isPopular: true,
    isRecommended: true,
    includedItems: [
      'Wybór z 3 zup premium',
      '4 dania główne + łosoś pieczony',
      'Stacja sushi na żywo',
      'Przystawki deluxe',
      '4 rodzaje sałatek',
      'Tort weselny 3-piętrowy',
      'Candy bar + Fontanna czekoladowa',
      'Bar alkoholowy pełen + Mobilny bar kawowy',
      'Obsługa kelnerska premium',
      'Posiłek nocny + Stół wiejski',
    ],
    optionCategories: ['ENTERTAINMENT', 'DECORATIONS', 'SERVICES'],
  },

  // ────────────────────────────────────────────────────────────────────────────
  // WESELE - RUSTIC
  // ────────────────────────────────────────────────────────────────────────────
  {
    templateVariant: 'RUSTIC',
    name: 'Pakiet Regionalne Smaki',
    description: 'Menu z daniami regionalnymi w rustykalnym stylu',
    shortDescription: 'Tradycja i smaki regionalne',
    pricePerAdult: 200,
    pricePerChild: 100,
    pricePerToddler: 0,
    color: '#92400e',
    icon: '🏡',
    displayOrder: 1,
    isPopular: false,
    isRecommended: true,
    includedItems: [
      'Żurek staropolski',
      'Golonka pieczona + Kaczka z jabłkami',
      'Kopytka + Buraczki zasmażane',
      'Stół wiejski (wędliny, sery, oscypki)',
      'Makowiec + Szarlotka',
      'Grill na żywo',
      'Kompot domowy',
    ],
    optionCategories: ['BEVERAGES', 'ENTERTAINMENT', 'DECORATIONS'],
  },

  // ────────────────────────────────────────────────────────────────────────────
  // URODZINY
  // ────────────────────────────────────────────────────────────────────────────
  {
    templateVariant: 'STANDARD',
    name: 'Pakiet Urodzinowy Basic',
    description: 'Podstawowe menu na przyjęcie urodzinowe',
    shortDescription: 'Klasyczne dania urodzinowe',
    pricePerAdult: 120,
    pricePerChild: 60,
    pricePerToddler: 0,
    color: '#ec4899',
    icon: '🎂',
    displayOrder: 1,
    isPopular: true,
    isRecommended: false,
    includedItems: [
      'Zupa do wyboru',
      '2 dania główne',
      'Dodatki (ziemniaki, warzywa)',
      'Sałatka',
      'Tort urodzinowy',
      'Napoje bezalkoholowe',
    ],
    optionCategories: ['BEVERAGES', 'ENTERTAINMENT', 'CULINARY'],
  },

  // ────────────────────────────────────────────────────────────────────────────
  // KOMUNIA
  // ────────────────────────────────────────────────────────────────────────────
  {
    templateVariant: 'FAMILY',
    name: 'Pakiet Komunijny Rodzinny',
    description: 'Menu dostosowane do rodzinnego przyjęcia komunijnego',
    shortDescription: 'Dla całej rodziny',
    pricePerAdult: 150,
    pricePerChild: 75,
    pricePerToddler: 0,
    color: '#60a5fa',
    icon: '⛪',
    displayOrder: 1,
    isPopular: true,
    isRecommended: true,
    includedItems: [
      'Rosół z makaronem',
      'De volaille + Kotlet schabowy',
      'Frytki + Surówki',
      'Sałatka',
      'Lody + Ciasto',
      'Napoje',
    ],
    optionCategories: ['BEVERAGES', 'ENTERTAINMENT', 'CULINARY', 'DECORATIONS'],
  },
]

// ════════════════════════════════════════════════════════════════════════════
// MAIN SEED FUNCTION
// ════════════════════════════════════════════════════════════════════════════

async function main() {
  console.log('🎯 Seedowanie zaawansowanych danych menu...\n')

  // ────────────────────────────────────────────────────────────────────────────
  // 1. Sprawdź czy EventTypes istnieją
  // ────────────────────────────────────────────────────────────────────────────
  console.log('📋 Sprawdzanie EventTypes...')
  const eventTypes = await prisma.eventType.findMany()
  
  if (eventTypes.length === 0) {
    console.error('❌ Błąd: Brak EventTypes w bazie!')
    console.error('   Uruchom najpierw główny seed: npm run db:seed\n')
    process.exit(1)
  }
  
  console.log(`✅ Znaleziono ${eventTypes.length} EventTypes\n`)

  // ────────────────────────────────────────────────────────────────────────────
  // 2. Sprawdź istniejące dane i wyczyść
  // ────────────────────────────────────────────────────────────────────────────
  const existingOptions = await prisma.menuOption.count()
  const existingTemplates = await prisma.menuTemplate.count()
  const existingPackages = await prisma.menuPackage.count()

  if (existingOptions > 0 || existingTemplates > 0 || existingPackages > 0) {
    console.log('⚠️  Dane już istnieją:')
    console.log(`   - Opcje: ${existingOptions}`)
    console.log(`   - Szablony: ${existingTemplates}`)
    console.log(`   - Pakiety: ${existingPackages}\n`)
    console.log('🗑️  Czyszczenie istniejących danych...\n')

    // Usuń w odpowiedniej kolejności (FK constraints)
    await prisma.menuPackageOption.deleteMany()
    console.log('   ✓ Usunięto MenuPackageOption')
    
    await prisma.menuPackage.deleteMany()
    console.log('   ✓ Usunięto MenuPackage')
    
    await prisma.menuTemplate.deleteMany()
    console.log('   ✓ Usunięto MenuTemplate')
    
    await prisma.menuOption.deleteMany()
    console.log('   ✓ Usunięto MenuOption\n')
  }

  // ────────────────────────────────────────────────────────────────────────────
  // 3. Tworzenie MenuOptions
  // ────────────────────────────────────────────────────────────────────────────
  console.log('🎨 Tworzenie opcji menu...')
  
  const optionMap = new Map<string, string>() // name -> id

  for (const optionData of MENU_OPTIONS) {
    const option = await prisma.menuOption.create({
      data: {
        ...optionData,
        isActive: true,
      },
    })
    optionMap.set(option.name, option.id)
    console.log(`   ✓ ${optionData.icon} ${optionData.name} (${optionData.category})`)
  }

  console.log(`\n✅ Utworzono ${MENU_OPTIONS.length} opcji menu\n`)

  // ────────────────────────────────────────────────────────────────────────────
  // 4. Tworzenie MenuTemplates
  // ────────────────────────────────────────────────────────────────────────────
  console.log('📋 Tworzenie szablonów menu...')
  
  const templateMap = new Map<string, string>() // variant -> id
  const eventTypeMap = new Map<string, string>() // name -> id
  eventTypes.forEach(et => eventTypeMap.set(et.name, et.id))

  for (const templateData of MENU_TEMPLATES) {
    const eventTypeId = eventTypeMap.get(templateData.eventTypeName)
    
    if (!eventTypeId) {
      console.warn(`   ⚠️  Pominięto szablon (brak EventType): ${templateData.name}`)
      continue
    }

    const template = await prisma.menuTemplate.create({
      data: {
        eventTypeId,
        name: templateData.name,
        description: templateData.description,
        variant: templateData.variant,
        isActive: templateData.isActive,
        displayOrder: templateData.displayOrder,
      },
    })
    
    templateMap.set(template.variant, template.id)
    console.log(`   ✓ ${templateData.name} (${templateData.eventTypeName})`)
  }

  console.log(`\n✅ Utworzono ${templateMap.size} szablonów menu\n`)

  // ────────────────────────────────────────────────────────────────────────────
  // 5. Tworzenie MenuPackages + łączenie z opcjami
  // ────────────────────────────────────────────────────────────────────────────
  console.log('📦 Tworzenie pakietów menu...')
  
  let packageCount = 0
  let linkCount = 0

  for (const packageData of MENU_PACKAGES) {
    const templateId = templateMap.get(packageData.templateVariant)
    
    if (!templateId) {
      console.warn(`   ⚠️  Pominięto pakiet (brak szablonu): ${packageData.name}`)
      continue
    }

    const pkg = await prisma.menuPackage.create({
      data: {
        menuTemplateId: templateId,
        name: packageData.name,
        description: packageData.description,
        shortDescription: packageData.shortDescription,
        pricePerAdult: packageData.pricePerAdult,
        pricePerChild: packageData.pricePerChild,
        pricePerToddler: packageData.pricePerToddler,
        color: packageData.color,
        icon: packageData.icon,
        badgeText: packageData.badgeText,
        displayOrder: packageData.displayOrder,
        isPopular: packageData.isPopular,
        isRecommended: packageData.isRecommended,
        includedItems: packageData.includedItems,
      },
    })

    packageCount++
    console.log(`   ✓ ${packageData.icon || '📦'} ${packageData.name}`)

    // Linkowanie z opcjami (tylko dla określonych kategorii)
    const optionsToLink = MENU_OPTIONS.filter(opt => 
      packageData.optionCategories.includes(opt.category)
    )

    for (const option of optionsToLink) {
      const optionId = optionMap.get(option.name)
      if (!optionId) continue

      await prisma.menuPackageOption.create({
        data: {
          packageId: pkg.id,
          optionId: optionId,
          isRequired: false,
          isDefault: false,
          displayOrder: option.displayOrder,
        },
      })
      linkCount++
    }
  }

  console.log(`\n✅ Utworzono ${packageCount} pakietów menu`)
  console.log(`✅ Utworzono ${linkCount} połączeń pakiet-opcja\n`)

  // ────────────────────────────────────────────────────────────────────────────
  // 6. Podsumowanie
  // ────────────────────────────────────────────────────────────────────────────
  const finalStats = {
    options: await prisma.menuOption.count(),
    templates: await prisma.menuTemplate.count(),
    packages: await prisma.menuPackage.count(),
    links: await prisma.menuPackageOption.count(),
  }

  console.log('═══════════════════════════════════════════════════════════')
  console.log('📊 PODSUMOWANIE SEEDA MENU ADVANCED')
  console.log('═══════════════════════════════════════════════════════════')
  console.log(`🎨 Opcje menu:         ${finalStats.options}`)
  console.log(`📋 Szablony menu:      ${finalStats.templates}`)
  console.log(`📦 Pakiety menu:       ${finalStats.packages}`)
  console.log(`🔗 Połączenia:         ${finalStats.links}\n`)

  console.log('📋 Szablony według EventType:\n')
  const templatesWithEventTypes = await prisma.menuTemplate.findMany({
    include: { eventType: true, _count: { select: { packages: true } } },
    orderBy: { displayOrder: 'asc' },
  })

  let currentEventType = ''
  for (const template of templatesWithEventTypes) {
    if (template.eventType.name !== currentEventType) {
      currentEventType = template.eventType.name
      console.log(`\n   ${currentEventType}:`)
    }
    console.log(`      • ${template.name} (${template._count.packages} pakietów)`)
  }

  console.log('\n═══════════════════════════════════════════════════════════')
  console.log('✅ Seed menu advanced zakończony pomyślnie!')
  console.log('═══════════════════════════════════════════════════════════\n')
}

main()
  .catch((e) => {
    console.error('❌ Błąd podczas seedowania menu advanced:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
