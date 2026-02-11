import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// COMPREHENSIVE MENU SEED DATA
// 100+ dishes across all categories

interface DishData {
  name: string;
  description: string;
  categorySlug: string;
  allergens: string[];
}

const dishes: DishData[] = [
  // ============================================
  // SOUP - 15 dań
  // ============================================
  { name: 'Rosół z makaronem', description: 'Tradycyjny polski bulion z kurczaka z domowym makaronem', categorySlug: 'SOUP', allergens: ['gluten', 'celery'] },
  { name: 'Krem z pieczarek', description: 'Aksamitny krem z pieczarek ze śmietaną', categorySlug: 'SOUP', allergens: ['lactose', 'celery'] },
  { name: 'Barszcz czerwony', description: 'Tradycyjny barszcz z uszkami', categorySlug: 'SOUP', allergens: ['gluten'] },
  { name: 'Żurek na zakwasie', description: 'Kwaśna zupa z białą kiełbasą i jajkiem', categorySlug: 'SOUP', allergens: ['gluten', 'eggs'] },
  { name: 'Pomidorowa z ryżem', description: 'Klasyczna pomidorowa ze świeżych pomidorów', categorySlug: 'SOUP', allergens: ['celery'] },
  { name: 'Krem z dyni', description: 'Aksamitny krem z pieczonej dyni z imbirem', categorySlug: 'SOUP', allergens: ['lactose'] },
  { name: 'Zupa ogórkowa', description: 'Tradycyjna zupa na rosole z kiszonych ogórków', categorySlug: 'SOUP', allergens: ['lactose', 'celery'] },
  { name: 'Krem z brokułów', description: 'Zdrowy krem z brokułów z serem pleśniowym', categorySlug: 'SOUP', allergens: ['lactose', 'celery'] },
  { name: 'Zupa grzybowa', description: 'Aromatyczna zupa z suszonych grzybów', categorySlug: 'SOUP', allergens: ['celery'] },
  { name: 'Krem ze szparagów', description: 'Delikatny krem z zielonych szparagów', categorySlug: 'SOUP', allergens: ['lactose'] },
  { name: 'Krupnik', description: 'Gęsta zupa krupnik z warzywami', categorySlug: 'SOUP', allergens: ['celery'] },
  { name: 'Barszcz ukraiński', description: 'Buraczano-kapuściana zupa z mięsem', categorySlug: 'SOUP', allergens: ['celery'] },
  { name: 'Krem z kalafior', description: 'Lekki krem z kalafiora z grzankami', categorySlug: 'SOUP', allergens: ['lactose', 'gluten'] },
  { name: 'Zupa cebulowa', description: 'Francuska zupa cebulowa z grzankami i serem', categorySlug: 'SOUP', allergens: ['lactose', 'gluten'] },
  { name: 'Flaki wołowe', description: 'Tradycyjne polskie flaki', categorySlug: 'SOUP', allergens: [] },

  // ============================================
  // MAIN_COURSE - 25 dań
  // ============================================
  { name: 'Schabowy z ziemniakami', description: 'Klasyczny polski kotlet schabowy z ziemniakami', categorySlug: 'MAIN_COURSE', allergens: ['gluten', 'eggs'] },
  { name: 'Pierś z kurczaka w sosie pieczarkowym', description: 'Soczysta pierś z kurczaka w kremowym sosie', categorySlug: 'MAIN_COURSE', allergens: ['lactose'] },
  { name: 'Łosoś pieczony z cytryną', description: 'Filet z łososia pieczony z ziołami', categorySlug: 'MAIN_COURSE', allergens: ['fish'] },
  { name: 'Gołąbki w sosie pomidorowym', description: 'Tradycyjne gołąbki z mięsem i ryżem', categorySlug: 'MAIN_COURSE', allergens: [] },
  { name: 'Polędwiczki wieprzowe', description: 'Polędwiczki w sosie śmietanowym', categorySlug: 'MAIN_COURSE', allergens: ['lactose'] },
  { name: 'Stek wołowy', description: 'Stek wołowy z grilla medium', categorySlug: 'MAIN_COURSE', allergens: [] },
  { name: 'Pstrąg pieczony', description: 'Cały pstrąg pieczony z masłem i migdałami', categorySlug: 'MAIN_COURSE', allergens: ['fish', 'nuts'] },
  { name: 'Kaczka pieczona', description: 'Udko z kaczki pieczone z jabłkami', categorySlug: 'MAIN_COURSE', allergens: [] },
  { name: 'Comber wieprzowy', description: 'Comber pieczony z warzywami', categorySlug: 'MAIN_COURSE', allergens: [] },
  { name: 'Karkówka z grilla', description: 'Karkówka marynowana w ziołach', categorySlug: 'MAIN_COURSE', allergens: [] },
  { name: 'Pierogi ruskie', description: 'Pierogi z serem i ziemniakami', categorySlug: 'MAIN_COURSE', allergens: ['gluten', 'lactose'] },
  { name: 'Pierogi z mięsem', description: 'Pierogi z farszem mięsnym', categorySlug: 'MAIN_COURSE', allergens: ['gluten'] },
  { name: 'Gulasz węgierski', description: 'Aromatyczny gulasz wołowy z papryką', categorySlug: 'MAIN_COURSE', allergens: [] },
  { name: 'Rolada śląska', description: 'Rolada wołowa z ogórkiem i boczkiem', categorySlug: 'MAIN_COURSE', allergens: [] },
  { name: 'Żeberka BBQ', description: 'Żeberka wieprzowe w sosie BBQ', categorySlug: 'MAIN_COURSE', allergens: [] },
  { name: 'Dorsz po grecku', description: 'Dorsz pieczony z warzywami', categorySlug: 'MAIN_COURSE', allergens: ['fish'] },
  { name: 'Kurczak curry', description: 'Kurczak w sosie curry z ryżem', categorySlug: 'MAIN_COURSE', allergens: ['lactose'] },
  { name: 'Lasagne bolognese', description: 'Zapiekanka lasagne z mięsem', categorySlug: 'MAIN_COURSE', allergens: ['gluten', 'lactose', 'eggs'] },
  { name: 'Schab faszerowany', description: 'Schab nadziewany śliwką i boczkiem', categorySlug: 'MAIN_COURSE', allergens: [] },
  { name: 'Pierś z indyka', description: 'Pierś z indyka w sosie żurawinowym', categorySlug: 'MAIN_COURSE', allergens: [] },
  { name: 'Ryba po grecku', description: 'Filet rybny zapiekany z warzywami', categorySlug: 'MAIN_COURSE', allergens: ['fish'] },
  { name: 'Kotlet de volaille', description: 'Kotlet z kurczaka faszerowany masłem', categorySlug: 'MAIN_COURSE', allergens: ['gluten', 'lactose', 'eggs'] },
  { name: 'Polędwica sopocka', description: 'Polędwica wołowa w sosie własnym', categorySlug: 'MAIN_COURSE', allergens: [] },
  { name: 'Stek z tuńczyka', description: 'Stek z tuńczyka w sosie sojowym', categorySlug: 'MAIN_COURSE', allergens: ['fish', 'soy'] },
  { name: 'Pieczony indyk', description: 'Udko z indyka pieczone z ziołami', categorySlug: 'MAIN_COURSE', allergens: [] },

  // ============================================
  // SIDE_DISH - 15 dań
  // ============================================
  { name: 'Ziemniaki opiekane', description: 'Ziemniaki pieczone z rozmarynem', categorySlug: 'SIDE_DISH', allergens: [] },
  { name: 'Frytki belgijskie', description: 'Chrupiące frytki z sosem', categorySlug: 'SIDE_DISH', allergens: [] },
  { name: 'Ryż jaśminowy', description: 'Aromatyczny ryż jaśminowy na sypko', categorySlug: 'SIDE_DISH', allergens: [] },
  { name: 'Kasza gryczana', description: 'Kasza gryczana z cebulką', categorySlug: 'SIDE_DISH', allergens: [] },
  { name: 'Puree ziemniaczane', description: 'Kremowe puree z masłem', categorySlug: 'SIDE_DISH', allergens: ['lactose'] },
  { name: 'Kopytka', description: 'Kopytka ziemniaczane z masłem', categorySlug: 'SIDE_DISH', allergens: ['gluten', 'lactose'] },
  { name: 'Makaron penne', description: 'Makaron penne w sosie pomidorowym', categorySlug: 'SIDE_DISH', allergens: ['gluten'] },
  { name: 'Ryż z warzywami', description: 'Ryż smażony z warzywami', categorySlug: 'SIDE_DISH', allergens: [] },
  { name: 'Placki ziemniaczane', description: 'Tradycyjne placki ze śmietaną', categorySlug: 'SIDE_DISH', allergens: ['gluten', 'lactose'] },
  { name: 'Kluski śląskie', description: 'Kluski śląskie z sosem', categorySlug: 'SIDE_DISH', allergens: ['gluten'] },
  { name: 'Kasza jaglana', description: 'Kasza jaglana z masłem', categorySlug: 'SIDE_DISH', allergens: ['lactose'] },
  { name: 'Ziemniaki gotowane', description: 'Młode ziemniaki z koperkiem', categorySlug: 'SIDE_DISH', allergens: [] },
  { name: 'Kasza perłowa', description: 'Kasza perłowa z grzybami', categorySlug: 'SIDE_DISH', allergens: [] },
  { name: 'Bakłażan grillowany', description: 'Plasterki bakłażana z grilla', categorySlug: 'SIDE_DISH', allergens: [] },
  { name: 'Brokuły z masłem', description: 'Brokuły gotowane na parze', categorySlug: 'SIDE_DISH', allergens: ['lactose'] },

  // ============================================
  // SALAD - 12 dań
  // ============================================
  { name: 'Sałatka grecka', description: 'Sałatka z fetą, oliwkami i pomidorami', categorySlug: 'SALAD', allergens: ['lactose'] },
  { name: 'Sałatka Cezar', description: 'Sałatka z kurczakiem i parmezanem', categorySlug: 'SALAD', allergens: ['gluten', 'lactose', 'eggs', 'fish'] },
  { name: 'Sałatka coleslaw', description: 'Surówka z kapusty z marchewką', categorySlug: 'SALAD', allergens: ['eggs'] },
  { name: 'Sałatka jarzynowa', description: 'Tradycyjna sałatka jarzynowa', categorySlug: 'SALAD', allergens: ['eggs'] },
  { name: 'Sałatka caprese', description: 'Pomidory z mozzarellą i bazylią', categorySlug: 'SALAD', allergens: ['lactose'] },
  { name: 'Surówka z kapusty pekińskiej', description: 'Surówka z sosem jogurtowym', categorySlug: 'SALAD', allergens: ['lactose'] },
  { name: 'Sałatka z tuńczyka', description: 'Sałatka z tuńczykiem i kukurydzą', categorySlug: 'SALAD', allergens: ['fish'] },
  { name: 'Sałatka z rukolą', description: 'Rukola z parmezanem i orzechami', categorySlug: 'SALAD', allergens: ['lactose', 'nuts'] },
  { name: 'Sałatka owocowa', description: 'Mix świeżych owoców', categorySlug: 'SALAD', allergens: [] },
  { name: 'Sałatka z awokado', description: 'Awokado z pomidorami cherry', categorySlug: 'SALAD', allergens: [] },
  { name: 'Mizeria', description: 'Tradycyjna mizeria ze śmietaną', categorySlug: 'SALAD', allergens: ['lactose'] },
  { name: 'Sałatka z buraczków', description: 'Buraczki z chrzanem', categorySlug: 'SALAD', allergens: [] },

  // ============================================
  // DESSERT - 15 dań
  // ============================================
  { name: 'Tiramisu', description: 'Klasyczne włoskie tiramisu', categorySlug: 'DESSERT', allergens: ['gluten', 'lactose', 'eggs'] },
  { name: 'Sernik na zimno', description: 'Sernik na zimno z polewą', categorySlug: 'DESSERT', allergens: ['gluten', 'lactose', 'eggs'] },
  { name: 'Lody waniliowe', description: 'Domowe lody waniliowe', categorySlug: 'DESSERT', allergens: ['lactose', 'eggs'] },
  { name: 'Szarlotka', description: 'Ciepła szarlotka z cynamonem', categorySlug: 'DESSERT', allergens: ['gluten', 'eggs'] },
  { name: 'Panna cotta', description: 'Panna cotta z sosem malinowym', categorySlug: 'DESSERT', allergens: ['lactose'] },
  { name: 'Brownie z czekoladą', description: 'Ciasto czekoladowe z orzechami', categorySlug: 'DESSERT', allergens: ['gluten', 'lactose', 'eggs', 'nuts'] },
  { name: 'Makowiec', description: 'Tradycyjny makowiec', categorySlug: 'DESSERT', allergens: ['gluten', 'lactose', 'eggs'] },
  { name: 'Tarta cytrynowa', description: 'Tarta z kremem cytrynowym', categorySlug: 'DESSERT', allergens: ['gluten', 'lactose', 'eggs'] },
  { name: 'Mus czekoladowy', description: 'Aksamitny mus z ciemnej czekolady', categorySlug: 'DESSERT', allergens: ['lactose', 'eggs'] },
  { name: 'Lody sorbet', description: 'Sorbet owocowy', categorySlug: 'DESSERT', allergens: [] },
  { name: 'Naleśniki z serem', description: 'Naleśniki z serem i bitą śmietaną', categorySlug: 'DESSERT', allergens: ['gluten', 'lactose', 'eggs'] },
  { name: 'Czekolada mousse', description: 'Mousse z belgijskiej czekolady', categorySlug: 'DESSERT', allergens: ['lactose', 'eggs'] },
  { name: 'Trifle owocowy', description: 'Deser warstwowy z owocami', categorySlug: 'DESSERT', allergens: ['gluten', 'lactose', 'eggs'] },
  { name: 'Lava cake', description: 'Ciastko z płynnym wnętrzem', categorySlug: 'DESSERT', allergens: ['gluten', 'lactose', 'eggs'] },
  { name: 'Crème brûlée', description: 'Krem z karmelizowanym cukrem', categorySlug: 'DESSERT', allergens: ['lactose', 'eggs'] },

  // ============================================
  // APPETIZER - 10 dań
  // ============================================
  { name: 'Tatar wołowy', description: 'Surowy tatar z wołowiny z dodatkami', categorySlug: 'APPETIZER', allergens: ['eggs'] },
  { name: 'Carpaccio z wołowiny', description: 'Cienkie plastry wołowiny z rukolą', categorySlug: 'APPETIZER', allergens: [] },
  { name: 'Krewetki w czosnku', description: 'Krewetki smażone na maśle czosnkowym', categorySlug: 'APPETIZER', allergens: ['shellfish', 'lactose'] },
  { name: 'Sałatka z łososia', description: 'Wędzony łosoś z kaparami', categorySlug: 'APPETIZER', allergens: ['fish'] },
  { name: 'Bruschetta', description: 'Grillowany chleb z pomidorami', categorySlug: 'APPETIZER', allergens: ['gluten'] },
  { name: 'Pasztet z kurczaka', description: 'Domowy pasztet z żurawiną', categorySlug: 'APPETIZER', allergens: [] },
  { name: 'Tost z awokado', description: 'Tost z guacamole', categorySlug: 'APPETIZER', allergens: ['gluten'] },
  { name: 'Tatar z łososia', description: 'Tatar z świeżego łososia', categorySlug: 'APPETIZER', allergens: ['fish'] },
  { name: 'Małże w winie', description: 'Małże gotowane w białym winie', categorySlug: 'APPETIZER', allergens: ['shellfish'] },
  { name: 'Sałatka z ośmiornicy', description: 'Ośmiornica z oliwkami', categorySlug: 'APPETIZER', allergens: ['shellfish'] },

  // ============================================
  // COLD_CUTS - 8 dań
  // ============================================
  { name: 'Talerz wędlin polskich', description: 'Mix tradycyjnych polskich wędlin', categorySlug: 'COLD_CUTS', allergens: [] },
  { name: 'Szynka parmeńska', description: 'Dojrzewająca szynka włoska', categorySlug: 'COLD_CUTS', allergens: [] },
  { name: 'Kabanosy', description: 'Tradycyjne polskie kabanosy', categorySlug: 'COLD_CUTS', allergens: [] },
  { name: 'Salami włoskie', description: 'Plastry salami', categorySlug: 'COLD_CUTS', allergens: [] },
  { name: 'Szynka z kością', description: 'Szynka pieczona z kością', categorySlug: 'COLD_CUTS', allergens: [] },
  { name: 'Żeberka wędzone', description: 'Wędzony boczek żebrowy', categorySlug: 'COLD_CUTS', allergens: [] },
  { name: 'Kiełbasa biała', description: 'Świeża kiełbasa biała', categorySlug: 'COLD_CUTS', allergens: [] },
  { name: 'Mix serów', description: 'Deska serów dojrzewających', categorySlug: 'COLD_CUTS', allergens: ['lactose'] },

  // ============================================
  // DRINK - 10 dań
  // ============================================
  { name: 'Kompot', description: 'Domowy kompot z owoców', categorySlug: 'DRINK', allergens: [] },
  { name: 'Sok pomarańczowy', description: 'Świeżo wyciskany sok', categorySlug: 'DRINK', allergens: [] },
  { name: 'Lemoniada', description: 'Domowa lemoniada z miętą', categorySlug: 'DRINK', allergens: [] },
  { name: 'Kawa espresso', description: 'Kawa espresso z Włoch', categorySlug: 'DRINK', allergens: [] },
  { name: 'Herbata zielona', description: 'Herbata zielona', categorySlug: 'DRINK', allergens: [] },
  { name: 'Woda mineralna', description: 'Woda gazowana lub niegazowana', categorySlug: 'DRINK', allergens: [] },
  { name: 'Smoothie owocowe', description: 'Koktajl z świeżych owoców', categorySlug: 'DRINK', allergens: [] },
  { name: 'Sok jabłkowy', description: 'Naturalny sok z jabłek', categorySlug: 'DRINK', allergens: [] },
  { name: 'Kakao', description: 'Gorąca czekolada', categorySlug: 'DRINK', allergens: ['lactose'] },
  { name: 'Mrożona kawa', description: 'Kawa z lodem i mlekiem', categorySlug: 'DRINK', allergens: ['lactose'] },
];

export async function seedComprehensiveDishes() {
  console.log('🌱 Starting comprehensive dish seed...');

  // Clear existing dishes
  await prisma.dish.deleteMany({});
  console.log('✅ Cleared existing dishes');

  // Fetch all categories first
  const categories = await prisma.dishCategory.findMany();
  const categoryMap = new Map(categories.map(c => [c.slug, c.id]));

  console.log(`📂 Found ${categories.length} categories`);

  // Create all dishes with categoryId
  let created = 0;
  for (const dish of dishes) {
    const categoryId = categoryMap.get(dish.categorySlug);
    
    if (!categoryId) {
      console.warn(`⚠️  Category ${dish.categorySlug} not found, skipping ${dish.name}`);
      continue;
    }

    await prisma.dish.create({
      data: {
        name: dish.name,
        description: dish.description,
        categoryId: categoryId,
        allergens: dish.allergens,
      },
    });
    created++;
  }

  console.log(`✅ Created ${created} dishes`);
  
  // Show count by category
  const categoryCounts = await prisma.dishCategory.findMany({
    include: {
      _count: {
        select: { dishes: true },
      },
    },
  });
  
  console.log('\n📊 Dishes by category:');
  categoryCounts.forEach(cat => {
    if (cat._count.dishes > 0) {
      console.log(`  ${cat.name}: ${cat._count.dishes} dań`);
    }
  });

  return created;
}

if (require.main === module) {
  seedComprehensiveDishes()
    .then(() => {
      console.log('\n✅ Seed completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Seeding failed:', error);
      process.exit(1);
    })
    .finally(() => {
      prisma.$disconnect();
    });
}
