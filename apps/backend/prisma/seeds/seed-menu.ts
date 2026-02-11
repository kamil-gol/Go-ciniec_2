/**
 * Menu Seed Data
 * 
 * Seed data for DishCategory and Dish models
 * Run with: npm run seed:menu
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// ════════════════════════════════════════════════════════════════════════════
// KATEGORIE DAŃ
// ════════════════════════════════════════════════════════════════════════════

const DISH_CATEGORIES = [
  {
    slug: 'SOUP',
    name: 'Zupy',
    icon: '🍲',
    color: '#f59e0b',
    displayOrder: 1,
    isActive: true,
  },
  {
    slug: 'APPETIZER',
    name: 'Przystawki',
    icon: '🥗',
    color: '#10b981',
    displayOrder: 2,
    isActive: true,
  },
  {
    slug: 'SALAD',
    name: 'Sałatki',
    icon: '🥬',
    color: '#22c55e',
    displayOrder: 3,
    isActive: true,
  },
  {
    slug: 'MAIN_COURSE',
    name: 'Dania główne',
    icon: '🍖',
    color: '#ef4444',
    displayOrder: 4,
    isActive: true,
  },
  {
    slug: 'SIDE_DISH',
    name: 'Dodatki',
    icon: '🍚',
    color: '#f97316',
    displayOrder: 5,
    isActive: true,
  },
  {
    slug: 'FISH',
    name: 'Ryby',
    icon: '🐟',
    color: '#06b6d4',
    displayOrder: 6,
    isActive: true,
  },
  {
    slug: 'DESSERT',
    name: 'Desery',
    icon: '🍰',
    color: '#ec4899',
    displayOrder: 7,
    isActive: true,
  },
  {
    slug: 'BEVERAGE',
    name: 'Napoje',
    icon: '🥤',
    color: '#8b5cf6',
    displayOrder: 8,
    isActive: true,
  },
  {
    slug: 'PASTRY',
    name: 'Wypieki',
    icon: '🥐',
    color: '#d97706',
    displayOrder: 9,
    isActive: true,
  },
  {
    slug: 'VEGETARIAN',
    name: 'Wegetariańskie',
    icon: '🌱',
    color: '#16a34a',
    displayOrder: 10,
    isActive: true,
  },
]

// ════════════════════════════════════════════════════════════════════════════
// DANIA (grouped by category slug)
// ════════════════════════════════════════════════════════════════════════════

type DishInput = {
  categorySlug: string
  name: string
  description: string
  allergens: string[]
  displayOrder: number
}

const DISHES: DishInput[] = [
  // ──────────────────────────────────────────────────────────────────────────
  // ZUPY (SOUP)
  // ──────────────────────────────────────────────────────────────────────────
  {
    categorySlug: 'SOUP',
    name: 'Rosół z makaronem',
    description: 'Tradycyjny rosół drobiowy z domowym makaronem',
    allergens: ['gluten', 'celery'],
    displayOrder: 1,
  },
  {
    categorySlug: 'SOUP',
    name: 'Żurek staropolski',
    description: 'Kwaśna zupa na zakwasie z jajkiem i białą kiełbasą',
    allergens: ['gluten', 'eggs'],
    displayOrder: 2,
  },
  {
    categorySlug: 'SOUP',
    name: 'Barszcz czerwony',
    description: 'Klarowny barszcz z uszkami',
    allergens: ['gluten'],
    displayOrder: 3,
  },
  {
    categorySlug: 'SOUP',
    name: 'Krem z pomidorów',
    description: 'Aksamitny krem pomidorowy z bazylią',
    allergens: ['dairy'],
    displayOrder: 4,
  },
  {
    categorySlug: 'SOUP',
    name: 'Krem z pieczarek',
    description: 'Delikatny krem grzybowy ze śmietaną',
    allergens: ['dairy'],
    displayOrder: 5,
  },

  // ──────────────────────────────────────────────────────────────────────────
  // PRZYSTAWKI (APPETIZER)
  // ──────────────────────────────────────────────────────────────────────────
  {
    categorySlug: 'APPETIZER',
    name: 'Tatar wołowy',
    description: 'Surowa wołowina z kaparami, cebulą i żółtkiem',
    allergens: ['eggs'],
    displayOrder: 1,
  },
  {
    categorySlug: 'APPETIZER',
    name: 'Carpaccio z polędwicy wołowej',
    description: 'Cienkie plastry polędwicy z rukolą i parmezanem',
    allergens: ['dairy'],
    displayOrder: 2,
  },
  {
    categorySlug: 'APPETIZER',
    name: 'Śledź w oleju',
    description: 'Filety śledziowe z cebulą w oleju',
    allergens: ['fish'],
    displayOrder: 3,
  },
  {
    categorySlug: 'APPETIZER',
    name: 'Koszyczki z łososiem',
    description: 'Kruche koszyczki z pastą z łososia',
    allergens: ['gluten', 'fish', 'dairy'],
    displayOrder: 4,
  },
  {
    categorySlug: 'APPETIZER',
    name: 'Pasta jajeczna',
    description: 'Domowa pasta z jajek ze szczypiorkiem',
    allergens: ['eggs'],
    displayOrder: 5,
  },

  // ──────────────────────────────────────────────────────────────────────────
  // SAŁATKI (SALAD)
  // ──────────────────────────────────────────────────────────────────────────
  {
    categorySlug: 'SALAD',
    name: 'Sałatka jarzynowa',
    description: 'Tradycyjna sałatka warzywna z majonezem',
    allergens: ['eggs'],
    displayOrder: 1,
  },
  {
    categorySlug: 'SALAD',
    name: 'Sałatka grecka',
    description: 'Mix świeżych warzyw z serem feta i oliwkami',
    allergens: ['dairy'],
    displayOrder: 2,
  },
  {
    categorySlug: 'SALAD',
    name: 'Sałatka Cezar',
    description: 'Rzymska sałata z kurczakiem, grzankami i parmezanem',
    allergens: ['gluten', 'dairy', 'fish'],
    displayOrder: 3,
  },
  {
    categorySlug: 'SALAD',
    name: 'Sałatka caprese',
    description: 'Pomidory malinowe z mozzarellą i bazylią',
    allergens: ['dairy'],
    displayOrder: 4,
  },
  {
    categorySlug: 'SALAD',
    name: 'Surówka z młodej kapusty',
    description: 'Lekka surówka z białej kapusty z marchewką',
    allergens: [],
    displayOrder: 5,
  },
  {
    categorySlug: 'SALAD',
    name: 'Sałatka coleslaw',
    description: 'Amerykańska surówka z kapusty z sosem majonezowym',
    allergens: ['eggs'],
    displayOrder: 6,
  },

  // ──────────────────────────────────────────────────────────────────────────
  // DANIA GŁÓWNE (MAIN_COURSE)
  // ──────────────────────────────────────────────────────────────────────────
  {
    categorySlug: 'MAIN_COURSE',
    name: 'Polędwica wołowa w sosie pieczarkowym',
    description: 'Soczysta polędwica z sosem grzybowym',
    allergens: ['dairy'],
    displayOrder: 1,
  },
  {
    categorySlug: 'MAIN_COURSE',
    name: 'Karkówka w ziołach',
    description: 'Grillowana karkówka marynowana w ziołach',
    allergens: [],
    displayOrder: 2,
  },
  {
    categorySlug: 'MAIN_COURSE',
    name: 'De volaille',
    description: 'Filet z kurczaka faszerowany szpinakiem i serem',
    allergens: ['dairy'],
    displayOrder: 3,
  },
  {
    categorySlug: 'MAIN_COURSE',
    name: 'Schab po staropolsku',
    description: 'Pieczony schab w sosie własnym',
    allergens: [],
    displayOrder: 4,
  },
  {
    categorySlug: 'MAIN_COURSE',
    name: 'Golonka pieczona',
    description: 'Pieczona golonka wieprzowa z sosem musztardowym',
    allergens: [],
    displayOrder: 5,
  },
  {
    categorySlug: 'MAIN_COURSE',
    name: 'Roladki schabowe',
    description: 'Roladki ze schabu nadziewane ogórkiem i boczkiem',
    allergens: [],
    displayOrder: 6,
  },
  {
    categorySlug: 'MAIN_COURSE',
    name: 'Zrazy wołowe',
    description: 'Zrazy zawijane z kaszą gryczaną',
    allergens: [],
    displayOrder: 7,
  },
  {
    categorySlug: 'MAIN_COURSE',
    name: 'Kaczka z jabłkami',
    description: 'Pieczona kaczka z jabłkami i śliwkami',
    allergens: [],
    displayOrder: 8,
  },
  {
    categorySlug: 'MAIN_COURSE',
    name: 'Kotlet schabowy',
    description: 'Tradycyjny kotlet schabowy panierowany',
    allergens: ['gluten', 'eggs'],
    displayOrder: 9,
  },
  {
    categorySlug: 'MAIN_COURSE',
    name: 'Żeberka BBQ',
    description: 'Żeberka wieprzowe w sosie barbecue',
    allergens: [],
    displayOrder: 10,
  },

  // ──────────────────────────────────────────────────────────────────────────
  // DODATKI (SIDE_DISH)
  // ──────────────────────────────────────────────────────────────────────────
  {
    categorySlug: 'SIDE_DISH',
    name: 'Ziemniaki pieczone',
    description: 'Pieczone ziemniaki z rozmarynem',
    allergens: [],
    displayOrder: 1,
  },
  {
    categorySlug: 'SIDE_DISH',
    name: 'Frytki',
    description: 'Chrupiące frytki',
    allergens: [],
    displayOrder: 2,
  },
  {
    categorySlug: 'SIDE_DISH',
    name: 'Kasza gryczana',
    description: 'Kasza gryczana z cebulką',
    allergens: [],
    displayOrder: 3,
  },
  {
    categorySlug: 'SIDE_DISH',
    name: 'Ryż biały',
    description: 'Ryż gotowany na sypko',
    allergens: [],
    displayOrder: 4,
  },
  {
    categorySlug: 'SIDE_DISH',
    name: 'Kopytka',
    description: 'Tradycyjne kopytka ziemniaczane',
    allergens: ['gluten', 'eggs'],
    displayOrder: 5,
  },
  {
    categorySlug: 'SIDE_DISH',
    name: 'Puree ziemniaczane',
    description: 'Kremowe puree z masłem',
    allergens: ['dairy'],
    displayOrder: 6,
  },
  {
    categorySlug: 'SIDE_DISH',
    name: 'Warzywa z grilla',
    description: 'Mix warzyw grillowanych',
    allergens: [],
    displayOrder: 7,
  },
  {
    categorySlug: 'SIDE_DISH',
    name: 'Buraczki zasmażane',
    description: 'Buraczki z cebulką i octem',
    allergens: [],
    displayOrder: 8,
  },

  // ──────────────────────────────────────────────────────────────────────────
  // RYBY (FISH)
  // ──────────────────────────────────────────────────────────────────────────
  {
    categorySlug: 'FISH',
    name: 'Łosoś pieczony',
    description: 'Filet z łososia pieczony z ziołami',
    allergens: ['fish'],
    displayOrder: 1,
  },
  {
    categorySlug: 'FISH',
    name: 'Dorsz w sosie maślano-cytrynowym',
    description: 'Dorsz w delikatnym sosie',
    allergens: ['fish', 'dairy'],
    displayOrder: 2,
  },
  {
    categorySlug: 'FISH',
    name: 'Pstrąg w migdałach',
    description: 'Pstrąg smażony w migdałach',
    allergens: ['fish', 'nuts'],
    displayOrder: 3,
  },
  {
    categorySlug: 'FISH',
    name: 'Karp smażony',
    description: 'Tradycyjny karp smażony w panierce',
    allergens: ['fish', 'gluten', 'eggs'],
    displayOrder: 4,
  },
  {
    categorySlug: 'FISH',
    name: 'Ryba z grilla',
    description: 'Świeża ryba grillowana z cytryną',
    allergens: ['fish'],
    displayOrder: 5,
  },

  // ──────────────────────────────────────────────────────────────────────────
  // DESERY (DESSERT)
  // ──────────────────────────────────────────────────────────────────────────
  {
    categorySlug: 'DESSERT',
    name: 'Tort czekoladowy',
    description: 'Tort czekoladowy z kremem',
    allergens: ['gluten', 'eggs', 'dairy'],
    displayOrder: 1,
  },
  {
    categorySlug: 'DESSERT',
    name: 'Sernik klasyczny',
    description: 'Sernik pieczony na kruchym cieście',
    allergens: ['gluten', 'eggs', 'dairy'],
    displayOrder: 2,
  },
  {
    categorySlug: 'DESSERT',
    name: 'Tiramisu',
    description: 'Włoski deser kawowy',
    allergens: ['gluten', 'eggs', 'dairy'],
    displayOrder: 3,
  },
  {
    categorySlug: 'DESSERT',
    name: 'Szarlotka z lodami',
    description: 'Ciepła szarlotka z lodami waniliowymi',
    allergens: ['gluten', 'dairy'],
    displayOrder: 4,
  },
  {
    categorySlug: 'DESSERT',
    name: 'Panna cotta',
    description: 'Włoski deser śmietankowy z sosem owocowym',
    allergens: ['dairy'],
    displayOrder: 5,
  },
  {
    categorySlug: 'DESSERT',
    name: 'Lody włoskie',
    description: 'Mix lodów w różnych smakach',
    allergens: ['dairy'],
    displayOrder: 6,
  },
  {
    categorySlug: 'DESSERT',
    name: 'Makowiec',
    description: 'Tradycyjny makowiec',
    allergens: ['gluten', 'eggs'],
    displayOrder: 7,
  },
  {
    categorySlug: 'DESSERT',
    name: 'Brownie',
    description: 'Czekoladowe ciasto brownie',
    allergens: ['gluten', 'eggs', 'dairy'],
    displayOrder: 8,
  },

  // ──────────────────────────────────────────────────────────────────────────
  // NAPOJE (BEVERAGE)
  // ──────────────────────────────────────────────────────────────────────────
  {
    categorySlug: 'BEVERAGE',
    name: 'Kawa espresso',
    description: 'Aromatyczna kawa espresso',
    allergens: [],
    displayOrder: 1,
  },
  {
    categorySlug: 'BEVERAGE',
    name: 'Herbata',
    description: 'Czarna lub zielona herbata',
    allergens: [],
    displayOrder: 2,
  },
  {
    categorySlug: 'BEVERAGE',
    name: 'Sok pomarańczowy',
    description: 'Świeżo wyciskany sok',
    allergens: [],
    displayOrder: 3,
  },
  {
    categorySlug: 'BEVERAGE',
    name: 'Kompot domowy',
    description: 'Kompot z owoców sezonowych',
    allergens: [],
    displayOrder: 4,
  },
  {
    categorySlug: 'BEVERAGE',
    name: 'Lemoniada domowa',
    description: 'Lemoniada z cytryną i miętą',
    allergens: [],
    displayOrder: 5,
  },

  // ──────────────────────────────────────────────────────────────────────────
  // WYPIEKI (PASTRY)
  // ──────────────────────────────────────────────────────────────────────────
  {
    categorySlug: 'PASTRY',
    name: 'Rogaliki maślane',
    description: 'Domowe rogaliki z masłem',
    allergens: ['gluten', 'dairy'],
    displayOrder: 1,
  },
  {
    categorySlug: 'PASTRY',
    name: 'Drożdżówki',
    description: 'Drożdżówki z serem, budyniem lub kruszonką',
    allergens: ['gluten', 'eggs', 'dairy'],
    displayOrder: 2,
  },
  {
    categorySlug: 'PASTRY',
    name: 'Babeczki',
    description: 'Babeczki z polewą',
    allergens: ['gluten', 'eggs', 'dairy'],
    displayOrder: 3,
  },
  {
    categorySlug: 'PASTRY',
    name: 'Ciasto kruche',
    description: 'Kruche ciasto z owocami',
    allergens: ['gluten', 'eggs', 'dairy'],
    displayOrder: 4,
  },

  // ──────────────────────────────────────────────────────────────────────────
  // WEGETARIAŃSKIE (VEGETARIAN)
  // ──────────────────────────────────────────────────────────────────────────
  {
    categorySlug: 'VEGETARIAN',
    name: 'Pierogi ruskie',
    description: 'Pierogi z serem i ziemniakami',
    allergens: ['gluten', 'dairy'],
    displayOrder: 1,
  },
  {
    categorySlug: 'VEGETARIAN',
    name: 'Naleśniki ze szpinakiem',
    description: 'Naleśniki faszerowane szpinakiem i serem',
    allergens: ['gluten', 'eggs', 'dairy'],
    displayOrder: 2,
  },
  {
    categorySlug: 'VEGETARIAN',
    name: 'Lasagne wegetariańska',
    description: 'Lasagne z warzywami i sosem pomidorowym',
    allergens: ['gluten', 'dairy'],
    displayOrder: 3,
  },
  {
    categorySlug: 'VEGETARIAN',
    name: 'Kotlet z buraków',
    description: 'Kotlet wegetariański z buraczków',
    allergens: ['gluten'],
    displayOrder: 4,
  },
  {
    categorySlug: 'VEGETARIAN',
    name: 'Placki ziemniaczane',
    description: 'Tradycyjne placki ze śmietaną',
    allergens: ['gluten', 'eggs', 'dairy'],
    displayOrder: 5,
  },
  {
    categorySlug: 'VEGETARIAN',
    name: 'Risotto z grzybami',
    description: 'Kremowe risotto grzybowe',
    allergens: ['dairy'],
    displayOrder: 6,
  },
]

// ════════════════════════════════════════════════════════════════════════════
// MAIN SEED FUNCTION
// ════════════════════════════════════════════════════════════════════════════

async function main() {
  console.log('🍽️  Seedowanie danych menu...\n')

  // ──────────────────────────────────────────────────────────────────────────
  // 1. Sprawdź czy dane już istnieją
  // ──────────────────────────────────────────────────────────────────────────
  const existingCategories = await prisma.dishCategory.count()
  const existingDishes = await prisma.dish.count()

  if (existingCategories > 0 || existingDishes > 0) {
    console.log('⚠️  Dane menu już istnieją:')
    console.log(`   - Kategorie: ${existingCategories}`)
    console.log(`   - Dania: ${existingDishes}\n`)
    console.log('🗑️  Czyszczenie istniejących danych...\n')

    // Usuń dania (najpierw z powodu FK)
    await prisma.dish.deleteMany()
    console.log('   ✓ Usunięto wszystkie dania')

    // Usuń kategorie
    await prisma.dishCategory.deleteMany()
    console.log('   ✓ Usunięto wszystkie kategorie\n')
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 2. Tworzenie kategorii
  // ──────────────────────────────────────────────────────────────────────────
  console.log('📂 Tworzenie kategorii dań...')

  const categoryMap = new Map<string, string>() // slug -> id

  for (const categoryData of DISH_CATEGORIES) {
    const category = await prisma.dishCategory.create({
      data: categoryData,
    })
    categoryMap.set(category.slug, category.id)
    console.log(`   ✓ ${category.icon} ${category.name} (${category.slug})`)
  }

  console.log(`\n✅ Utworzono ${DISH_CATEGORIES.length} kategorii\n`)

  // ──────────────────────────────────────────────────────────────────────────
  // 3. Tworzenie dań
  // ──────────────────────────────────────────────────────────────────────────
  console.log('🍽️  Tworzenie dań...')

  let dishCount = 0
  for (const dishInput of DISHES) {
    const categoryId = categoryMap.get(dishInput.categorySlug)

    if (!categoryId) {
      console.error(`   ❌ Nie znaleziono kategorii: ${dishInput.categorySlug}`)
      continue
    }

    await prisma.dish.create({
      data: {
        categoryId,
        name: dishInput.name,
        description: dishInput.description,
        allergens: dishInput.allergens,
        displayOrder: dishInput.displayOrder,
        isActive: true,
      },
    })

    dishCount++

    if (dishCount % 10 === 0) {
      console.log(`   ✓ Utworzono ${dishCount}/${DISHES.length} dań...`)
    }
  }

  console.log(`\n✅ Utworzono ${dishCount} dań\n`)

  // ──────────────────────────────────────────────────────────────────────────
  // 4. Podsumowanie
  // ──────────────────────────────────────────────────────────────────────────
  const finalCategories = await prisma.dishCategory.findMany({
    include: {
      _count: {
        select: { dishes: true },
      },
    },
    orderBy: { displayOrder: 'asc' },
  })

  console.log('═══════════════════════════════════════════════════════════')
  console.log('📊 PODSUMOWANIE SEEDA MENU')
  console.log('═══════════════════════════════════════════════════════════')
  console.log(`📂 Kategorie:  ${finalCategories.length}`)
  console.log(`🍽️  Dania:      ${dishCount}\n`)

  console.log('📋 Kategorie z liczbą dań:\n')
  for (const category of finalCategories) {
    const count = String(category._count.dishes).padStart(2, ' ')
    console.log(`   ${category.icon} ${category.name.padEnd(20, ' ')} ${count} dań`)
  }

  console.log('\n═══════════════════════════════════════════════════════════')
  console.log('✅ Seed menu zakończony pomyślnie!')
  console.log('═══════════════════════════════════════════════════════════\n')
}

main()
  .catch((e) => {
    console.error('❌ Błąd podczas seedowania menu:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
