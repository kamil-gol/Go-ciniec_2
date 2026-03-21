import { PrismaClient } from '../src/generated/prisma/client.js'

const prisma = new PrismaClient()

const exampleDishes = [
  // ZUPY (10)
  {
    name: 'Rosoł drobiowy z makaronem',
    description: 'Tradycyjny polski rosoł na bazie kurczaka z domowym makaronem',
    category: 'SOUP',
    allergens: ['gluten', 'celery'],
    priceModifier: 0,
  },
  {
    name: 'Krem z pomidorów',
    description: 'Aksamitny krem pomidorowy z świeżą bazylią',
    category: 'SOUP',
    allergens: ['laktoza'],
    priceModifier: 0,
  },
  {
    name: 'Zurek staropolski',
    description: 'Tradycyjny żurek na zakwasie z białą kiełbasą i jajkiem',
    category: 'SOUP',
    allergens: ['gluten', 'jajko'],
    priceModifier: 2,
  },
  {
    name: 'Barszcz czerwony czysty',
    description: 'Klasyczny barszcz czerwony z uszkami',
    category: 'SOUP',
    allergens: ['gluten'],
    priceModifier: 0,
  },
  {
    name: 'Krem z pieczarek',
    description: 'Kremowa zupa grzybowa z świeżych pieczarek',
    category: 'SOUP',
    allergens: ['laktoza'],
    priceModifier: 0,
  },
  {
    name: 'Zupa ogórkowa',
    description: 'Kwaśna zupa ogórkowa na rosole',
    category: 'SOUP',
    allergens: ['laktoza'],
    priceModifier: 0,
  },
  {
    name: 'Krem z dyni',
    description: 'Sezonowy krem z pieczonej dyni z imbirem',
    category: 'SOUP',
    allergens: ['laktoza'],
    priceModifier: 1,
  },
  {
    name: 'Zupa cebulowa',
    description: 'Francuska zupa cebulowa z grzanką i serem',
    category: 'SOUP',
    allergens: ['gluten', 'laktoza'],
    priceModifier: 2,
  },
  {
    name: 'Krupnik',
    description: 'Tradycyjna zupa z kaszą perłową',
    category: 'SOUP',
    allergens: ['celery'],
    priceModifier: 0,
  },
  {
    name: 'Chłodnik litewski',
    description: 'Letnia zupa na bazie buraczków (sezonowo)',
    category: 'SOUP',
    allergens: ['laktoza'],
    priceModifier: 1,
  },

  // PRZEKĄSKI (10)
  {
    name: 'Tatar wołowy',
    description: 'Surowa wołowina z kaparami, cebulą i żółtkiem',
    category: 'APPETIZER',
    allergens: ['jajko', 'gorczyca'],
    priceModifier: 8,
  },
  {
    name: 'Karpaccio wołowe',
    description: 'Cieńko pokrojona wołowina z rukolą i parmezanem',
    category: 'APPETIZER',
    allergens: ['laktoza'],
    priceModifier: 7,
  },
  {
    name: 'Śledzie w śmietanie',
    description: 'Marynowane śledzie w sosie śmietanowym z cebulą',
    category: 'APPETIZER',
    allergens: ['ryby', 'laktoza'],
    priceModifier: 0,
  },
  {
    name: 'Deska wêdlin regionalnych',
    description: 'Wybór lokalnych wêdlin i serów',
    category: 'APPETIZER',
    allergens: ['laktoza'],
    priceModifier: 5,
  },
  {
    name: 'Pasztet domowy',
    description: 'Pasztet z gęsiny z żurawiń',
    category: 'APPETIZER',
    allergens: [],
    priceModifier: 3,
  },
  {
    name: 'Tatar z łososia',
    description: 'Świeży łosoś z awokado i sezamem',
    category: 'APPETIZER',
    allergens: ['ryby', 'sezam'],
    priceModifier: 9,
  },
  {
    name: 'Ser camembert pieczony',
    description: 'Pieczony ser z żurawiń i orzechami',
    category: 'APPETIZER',
    allergens: ['laktoza', 'orzechy'],
    priceModifier: 6,
  },
  {
    name: 'Krewetki w czosnku',
    description: 'Smażone krewetki w sosie czosnkowym',
    category: 'APPETIZER',
    allergens: ['skorupiaki'],
    priceModifier: 10,
  },
  {
    name: 'Bruschetta',
    description: 'Grzanki z pomidorami, bazylią i mozzarellą',
    category: 'APPETIZER',
    allergens: ['gluten', 'laktoza'],
    priceModifier: 4,
  },
  {
    name: 'Carpaccio z buraka',
    description: 'Pieczone buraki z kozim serem i orzechami',
    category: 'APPETIZER',
    allergens: ['laktoza', 'orzechy'],
    priceModifier: 5,
  },

  // DANIA GŁÓWNE (10)
  {
    name: 'Schabowy panierowany',
    description: 'Klasyczny polski schabowy z ziemniakami i surówką',
    category: 'MAIN_COURSE',
    allergens: ['gluten', 'jajko'],
    priceModifier: 0,
  },
  {
    name: 'Polêdwica wołowa',
    description: 'Polędwica wołowa w sosie pieprzowym',
    category: 'MAIN_COURSE',
    allergens: ['laktoza'],
    priceModifier: 15,
  },
  {
    name: 'Pierogi ruskie',
    description: 'Tradycyjne pierogi z serem i ziemniakami',
    category: 'MAIN_COURSE',
    allergens: ['gluten', 'laktoza'],
    priceModifier: 0,
  },
  {
    name: 'Roladki śląskie',
    description: 'Roladki wołowe z ogórkiem kiszonym',
    category: 'MAIN_COURSE',
    allergens: ['gluten', 'gorczyca'],
    priceModifier: 2,
  },
  {
    name: 'Łosoś pieczony',
    description: 'Filet z łososia z warzywami sezonowymi',
    category: 'MAIN_COURSE',
    allergens: ['ryby'],
    priceModifier: 12,
  },
  {
    name: 'Kaczka pieczona',
    description: 'Pieczona kaczka z jabłkami i żurawiń',
    category: 'MAIN_COURSE',
    allergens: [],
    priceModifier: 10,
  },
  {
    name: 'Stek z indyka',
    description: 'Grillowany stek z indyka w sosie grzybowym',
    category: 'MAIN_COURSE',
    allergens: ['laktoza'],
    priceModifier: 3,
  },
  {
    name: 'Zraz włąski',
    description: 'Zrazy wołowe w sosie pomidorowym',
    category: 'MAIN_COURSE',
    allergens: ['gluten'],
    priceModifier: 5,
  },
  {
    name: 'Dorsz pieczony',
    description: 'Filet z dorsza z warzywami i cytryną',
    category: 'MAIN_COURSE',
    allergens: ['ryby'],
    priceModifier: 8,
  },
  {
    name: 'Gołąbki',
    description: 'Tradycyjne gołąbki w sosie pomidorowym',
    category: 'MAIN_COURSE',
    allergens: [],
    priceModifier: 0,
  },

  // PRZYSTAWKI (10)
  {
    name: 'Ziemniaki opiekane',
    description: 'Złociste ziemniaki pieczone z rozmarynem',
    category: 'SIDE_DISH',
    allergens: [],
    priceModifier: 0,
  },
  {
    name: 'Frytki belgijskie',
    description: 'Chrupiące frytki z solą morską',
    category: 'SIDE_DISH',
    allergens: [],
    priceModifier: 1,
  },
  {
    name: 'Ryż jaśminowy',
    description: 'Aromatyczny ryż na sypko',
    category: 'SIDE_DISH',
    allergens: [],
    priceModifier: 0,
  },
  {
    name: 'Kasza gryczana',
    description: 'Kasza gryczana z cebulką',
    category: 'SIDE_DISH',
    allergens: [],
    priceModifier: 0,
  },
  {
    name: 'Warzywa grillowane',
    description: 'Sezonowe warzywa z grilla',
    category: 'SIDE_DISH',
    allergens: [],
    priceModifier: 2,
  },
  {
    name: 'Pure ziemniaczane',
    description: 'Kremowe puré z masłem',
    category: 'SIDE_DISH',
    allergens: ['laktoza'],
    priceModifier: 1,
  },
  {
    name: 'Kapusta zasmażana',
    description: 'Kapusta zasmażana z cebulą',
    category: 'SIDE_DISH',
    allergens: [],
    priceModifier: 0,
  },
  {
    name: 'Buraczki z chrzanem',
    description: 'Buraczki gotowane z chrza nem',
    category: 'SIDE_DISH',
    allergens: [],
    priceModifier: 0,
  },
  {
    name: 'Kopytka',
    description: 'Domowe kopytka z masłem',
    category: 'SIDE_DISH',
    allergens: ['gluten', 'laktoza'],
    priceModifier: 1,
  },
  {
    name: 'Makaron jajeczny',
    description: 'Makaron jajeczny z masłem',
    category: 'SIDE_DISH',
    allergens: ['gluten', 'jajko', 'laktoza'],
    priceModifier: 0,
  },

  // SAŁATKI (10)
  {
    name: 'Sałatka grecka',
    description: 'Mięszanka warzyw z fetą i oliwkami',
    category: 'SALAD',
    allergens: ['laktoza'],
    priceModifier: 0,
  },
  {
    name: 'Sałatka Cezar',
    description: 'Salatka rzymska z kurczakiem i sosem Cezar',
    category: 'SALAD',
    allergens: ['gluten', 'laktoza', 'jajko', 'ryby'],
    priceModifier: 2,
  },
  {
    name: 'Sałatka Caprese',
    description: 'Mozzarella, pomidory i bazylia',
    category: 'SALAD',
    allergens: ['laktoza'],
    priceModifier: 3,
  },
  {
    name: 'Sałatka z kozi m serem',
    description: 'Mięszanka sałat z pieczonym kozim serem',
    category: 'SALAD',
    allergens: ['laktoza', 'orzechy'],
    priceModifier: 4,
  },
  {
    name: 'Sałatka z łososiem',
    description: 'Mięszanka sałat z wędzonym łososiem',
    category: 'SALAD',
    allergens: ['ryby'],
    priceModifier: 5,
  },
  {
    name: 'Sałatka jarzynowa',
    description: 'Tradycyjna polska sałatka jarzynowa',
    category: 'SALAD',
    allergens: ['jajko'],
    priceModifier: 0,
  },
  {
    name: 'Sałatka z kurczakiem',
    description: 'Mięszanka sałat z grillowanym kurczakiem',
    category: 'SALAD',
    allergens: [],
    priceModifier: 2,
  },
  {
    name: 'Surówka z białej kapusty',
    description: 'Świeża surówka z kapusty',
    category: 'SALAD',
    allergens: [],
    priceModifier: 0,
  },
  {
    name: 'Surówka z marchewki',
    description: 'Starta marchewka z jabłkiem',
    category: 'SALAD',
    allergens: [],
    priceModifier: 0,
  },
  {
    name: 'Sałatka z buraczków',
    description: 'Buraczki z cebulą i oliwą',
    category: 'SALAD',
    allergens: [],
    priceModifier: 0,
  },

  // DESERY (10)
  {
    name: 'Tiramisu',
    description: 'Włoski deser kawowy',
    category: 'DESSERT',
    allergens: ['gluten', 'laktoza', 'jajko'],
    priceModifier: 0,
  },
  {
    name: 'Sernik nowojorski',
    description: 'Klasyczny sernik na zimno',
    category: 'DESSERT',
    allergens: ['gluten', 'laktoza', 'jajko'],
    priceModifier: 0,
  },
  {
    name: 'Szarlotka',
    description: 'Tradycyjna szarlotka z lodem waniliowym',
    category: 'DESSERT',
    allergens: ['gluten', 'laktoza', 'jajko'],
    priceModifier: 0,
  },
  {
    name: 'Lawa czekoladowa',
    description: 'Ciasto czekoladowe z płynnym środkiem',
    category: 'DESSERT',
    allergens: ['gluten', 'laktoza', 'jajko'],
    priceModifier: 2,
  },
  {
    name: 'Panna cotta',
    description: 'Włoski deser śmietankowy z owocami',
    category: 'DESSERT',
    allergens: ['laktoza'],
    priceModifier: 1,
  },
  {
    name: 'Crème brûlée',
    description: 'Francuski deser z karmelizowanym cukrem',
    category: 'DESSERT',
    allergens: ['laktoza', 'jajko'],
    priceModifier: 3,
  },
  {
    name: 'Lody sezonowe',
    description: '3 gałki lodów w smakach sezonowych',
    category: 'DESSERT',
    allergens: ['laktoza'],
    priceModifier: 0,
  },
  {
    name: 'Makowiec',
    description: 'Tradycyjny makowiec z bitą śmietaną',
    category: 'DESSERT',
    allergens: ['gluten', 'laktoza', 'mak'],
    priceModifier: 0,
  },
  {
    name: 'Tort czekoladowy',
    description: 'Wielowarstwowy tort czekoladowy',
    category: 'DESSERT',
    allergens: ['gluten', 'laktoza', 'jajko'],
    priceModifier: 2,
  },
  {
    name: 'Naleśniki z serem',
    description: 'Naleśniki z serem i owocami',
    category: 'DESSERT',
    allergens: ['gluten', 'laktoza', 'jajko'],
    priceModifier: 0,
  },

  // NAPOJE (10)
  {
    name: 'Kawa espresso',
    description: 'Włoska kawa espresso',
    category: 'BEVERAGE',
    allergens: [],
    priceModifier: 0,
  },
  {
    name: 'Kawa latte',
    description: 'Kawa z mlekiem',
    category: 'BEVERAGE',
    allergens: ['laktoza'],
    priceModifier: 1,
  },
  {
    name: 'Herbata czarna',
    description: 'Herbata czarna Ceylon',
    category: 'BEVERAGE',
    allergens: [],
    priceModifier: 0,
  },
  {
    name: 'Herbata zielona',
    description: 'Herbata zielona Sencha',
    category: 'BEVERAGE',
    allergens: [],
    priceModifier: 0,
  },
  {
    name: 'Sok pomarańczowy',
    description: 'Świeżo wyciskany sok',
    category: 'BEVERAGE',
    allergens: [],
    priceModifier: 2,
  },
  {
    name: 'Lemoniada domowa',
    description: 'Domowa lemoniada z miętą',
    category: 'BEVERAGE',
    allergens: [],
    priceModifier: 1,
  },
  {
    name: 'Kompot',
    description: 'Kompot z owoców sezonowych',
    category: 'BEVERAGE',
    allergens: [],
    priceModifier: 0,
  },
  {
    name: 'Woda mineralna',
    description: 'Woda mineralna gazowana/niegazowana',
    category: 'BEVERAGE',
    allergens: [],
    priceModifier: 0,
  },
  {
    name: 'Cappuccino',
    description: 'Kawa z spienonym mlekiem',
    category: 'BEVERAGE',
    allergens: ['laktoza'],
    priceModifier: 1,
  },
  {
    name: 'Smoothie owocowe',
    description: 'Smoothie z świeżych owoców',
    category: 'BEVERAGE',
    allergens: [],
    priceModifier: 3,
  },

  // INNE (10)
  {
    name: 'Chleb z masłem',
    description: 'Świeży chleb ze śmietanowym masłem',
    category: 'OTHER',
    allergens: ['gluten', 'laktoza'],
    priceModifier: 0,
  },
  {
    name: 'Sos pieprzowy',
    description: 'Dodatkowy sos pieprzowy',
    category: 'OTHER',
    allergens: ['laktoza'],
    priceModifier: 2,
  },
  {
    name: 'Sos grzybowy',
    description: 'Dodatkowy sos grzybowy',
    category: 'OTHER',
    allergens: ['laktoza'],
    priceModifier: 2,
  },
  {
    name: 'Chrzan tarty',
    description: 'Świeżo tarty chrzan',
    category: 'OTHER',
    allergens: [],
    priceModifier: 1,
  },
  {
    name: 'Ogórek kiszony',
    description: 'Tradycyjny polski ogórek',
    category: 'OTHER',
    allergens: [],
    priceModifier: 0,
  },
  {
    name: 'Papryka konserwowa',
    description: 'Papryka w oleju',
    category: 'OTHER',
    allergens: [],
    priceModifier: 0,
  },
  {
    name: 'Grzanki czosnkowe',
    description: 'Chrupiące grzanki z czosnkiem',
    category: 'OTHER',
    allergens: ['gluten'],
    priceModifier: 1,
  },
  {
    name: 'Sos czosnkowy',
    description: 'Domowy sos czosnkowy',
    category: 'OTHER',
    allergens: ['laktoza'],
    priceModifier: 1,
  },
  {
    name: 'Ketchup',
    description: 'Ketchup pomidorowy',
    category: 'OTHER',
    allergens: [],
    priceModifier: 0,
  },
  {
    name: 'Musztarda',
    description: 'Musztarda tradycyjna',
    category: 'OTHER',
    allergens: ['gorczyca'],
    priceModifier: 0,
  },
]

async function seed() {
  console.log('🌱 Starting seed...')
  
  let created = 0
  let skipped = 0

  for (const dish of exampleDishes) {
    try {
      // Check if dish already exists
      const existing = await prisma.dish.findFirst({
        where: { name: dish.name }
      })

      if (existing) {
        console.log(`⏭️  Skipping: ${dish.name} (already exists)`)
        skipped++
        continue
      }

      await prisma.dish.create({
        data: {
          ...dish,
          isActive: true,
          displayOrder: 0,
        }
      })
      console.log(`✅ Created: ${dish.name}`)
      created++
    } catch (error) {
      console.error(`❌ Error creating ${dish.name}:`, error)
    }
  }

  console.log(`\n📊 Summary:`)
  console.log(`   ✅ Created: ${created}`)
  console.log(`   ⏭️  Skipped: ${skipped}`)
  console.log(`   📦 Total: ${exampleDishes.length}\n`)
}

seed()
  .then(() => {
    console.log('🎉 Seed completed successfully!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Seed failed:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
