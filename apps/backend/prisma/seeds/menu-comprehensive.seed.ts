import { PrismaClient, DishCategory } from '@prisma/client';

const prisma = new PrismaClient();

// COMPREHENSIVE MENU SEED DATA
// 100+ dishes across all categories

const dishes = [
  // ============================================
  // SOUP - 15 dań
  // ============================================
  { name: 'Rosół z makaronem', description: 'Tradycyjny polski bulion z kurczaka z domowym makaronem', category: 'SOUP' as DishCategory, allergens: ['gluten', 'celery'] },
  { name: 'Krem z pieczarek', description: 'Aksamitny krem z pieczarek ze śmietaną', category: 'SOUP' as DishCategory, allergens: ['lactose', 'celery'] },
  { name: 'Barszcz czerwony', description: 'Tradycyjny barszcz z uszkami', category: 'SOUP' as DishCategory, allergens: ['gluten'] },
  { name: 'Żurek na zakwasie', description: 'Kwaśna zupa z białą kiełbasą i jajkiem', category: 'SOUP' as DishCategory, allergens: ['gluten', 'eggs'] },
  { name: 'Pomidorowa z ryżem', description: 'Klasyczna pomidorowa ze świeżych pomidorów', category: 'SOUP' as DishCategory, allergens: ['celery'] },
  { name: 'Krem z dyni', description: 'Aksamitny krem z pieczonej dyni z imbirem', category: 'SOUP' as DishCategory, allergens: ['lactose'] },
  { name: 'Zupa ogórkowa', description: 'Tradycyjna zupa na rosole z kiszonych ogórków', category: 'SOUP' as DishCategory, allergens: ['lactose', 'celery'] },
  { name: 'Krem z brokułów', description: 'Zdrowy krem z brokułów z serem pleśniowym', category: 'SOUP' as DishCategory, allergens: ['lactose', 'celery'] },
  { name: 'Zupa grzybowa', description: 'Aromatyczna zupa z suszonych grzybów', category: 'SOUP' as DishCategory, allergens: ['celery'] },
  { name: 'Krem ze szparagów', description: 'Delikatny krem z zielonych szparagów', category: 'SOUP' as DishCategory, allergens: ['lactose'] },
  { name: 'Krupnik', description: 'Gęsta zupa krupnik z warzywami', category: 'SOUP' as DishCategory, allergens: ['celery'] },
  { name: 'Barszcz ukraiński', description: 'Buraczano-kapuściana zupa z mięsem', category: 'SOUP' as DishCategory, allergens: ['celery'] },
  { name: 'Krem z kalafior', description: 'Lekki krem z kalafiora z grzankami', category: 'SOUP' as DishCategory, allergens: ['lactose', 'gluten'] },
  { name: 'Zupa cebulowa', description: 'Francuska zupa cebulowa z grzankami i serem', category: 'SOUP' as DishCategory, allergens: ['lactose', 'gluten'] },
  { name: 'Flaki wołowe', description: 'Tradycyjne polskie flaki', category: 'SOUP' as DishCategory, allergens: [] },

  // ============================================
  // MAIN_COURSE - 25 dań
  // ============================================
  { name: 'Schabowy z ziemniakami', description: 'Klasyczny polski kotlet schabowy z ziemniakami', category: 'MAIN_COURSE' as DishCategory, allergens: ['gluten', 'eggs'] },
  { name: 'Pierś z kurczaka w sosie pieczarkowym', description: 'Soczysta pierś z kurczaka w kremowym sosie', category: 'MAIN_COURSE' as DishCategory, allergens: ['lactose'] },
  { name: 'Łosoś pieczony z cytryną', description: 'Filet z łososia pieczony z ziołami', category: 'MAIN_COURSE' as DishCategory, allergens: ['fish'] },
  { name: 'Gołąbki w sosie pomidorowym', description: 'Tradycyjne gołąbki z mięsem i ryżem', category: 'MAIN_COURSE' as DishCategory, allergens: [] },
  { name: 'Polędwiczki wieprzowe', description: 'Polędwiczki w sosie śmietanowym', category: 'MAIN_COURSE' as DishCategory, allergens: ['lactose'] },
  { name: 'Stek wołowy', description: 'Stek wołowy z grilla medium', category: 'MAIN_COURSE' as DishCategory, allergens: [] },
  { name: 'Pstrąg pieczony', description: 'Cały pstrąg pieczony z masłem i migdałami', category: 'MAIN_COURSE' as DishCategory, allergens: ['fish', 'nuts'] },
  { name: 'Kaczka pieczona', description: 'Udko z kaczki pieczone z jabłkami', category: 'MAIN_COURSE' as DishCategory, allergens: [] },
  { name: 'Comber wieprzowy', description: 'Comber pieczony z warzywami', category: 'MAIN_COURSE' as DishCategory, allergens: [] },
  { name: 'Karkówka z grilla', description: 'Karkówka marynowana w ziołach', category: 'MAIN_COURSE' as DishCategory, allergens: [] },
  { name: 'Pierogi ruskie', description: 'Pierogi z serem i ziemniakami', category: 'MAIN_COURSE' as DishCategory, allergens: ['gluten', 'lactose'] },
  { name: 'Pierogi z mięsem', description: 'Pierogi z farszem mięsnym', category: 'MAIN_COURSE' as DishCategory, allergens: ['gluten'] },
  { name: 'Gulasz węgierski', description: 'Aromatyczny gulasz wołowy z papryką', category: 'MAIN_COURSE' as DishCategory, allergens: [] },
  { name: 'Rolada śląska', description: 'Rolada wołowa z ogórkiem i boczkiem', category: 'MAIN_COURSE' as DishCategory, allergens: [] },
  { name: 'Żeberka BBQ', description: 'Żeberka wieprzowe w sosie BBQ', category: 'MAIN_COURSE' as DishCategory, allergens: [] },
  { name: 'Dorsz po grecku', description: 'Dorsz pieczony z warzywami', category: 'MAIN_COURSE' as DishCategory, allergens: ['fish'] },
  { name: 'Kurczak curry', description: 'Kurczak w sosie curry z ryżem', category: 'MAIN_COURSE' as DishCategory, allergens: ['lactose'] },
  { name: 'Lasagne bolognese', description: 'Zapiekanka lasagne z mięsem', category: 'MAIN_COURSE' as DishCategory, allergens: ['gluten', 'lactose', 'eggs'] },
  { name: 'Schab faszerowany', description: 'Schab nadziewany śliwką i boczkiem', category: 'MAIN_COURSE' as DishCategory, allergens: [] },
  { name: 'Pierś z indyka', description: 'Pierś z indyka w sosie żurawinowym', category: 'MAIN_COURSE' as DishCategory, allergens: [] },
  { name: 'Ryba po grecku', description: 'Filet rybny zapiekany z warzywami', category: 'MAIN_COURSE' as DishCategory, allergens: ['fish'] },
  { name: 'Kotlet de volaille', description: 'Kotlet z kurczaka faszerowany masłem', category: 'MAIN_COURSE' as DishCategory, allergens: ['gluten', 'lactose', 'eggs'] },
  { name: 'Polędwica sopocka', description: 'Polędwica wołowa w sosie własnym', category: 'MAIN_COURSE' as DishCategory, allergens: [] },
  { name: 'Stek z tuńczyka', description: 'Stek z tuńczyka w sosie sojowym', category: 'MAIN_COURSE' as DishCategory, allergens: ['fish', 'soy'] },
  { name: 'Pieczony indyk', description: 'Udko z indyka pieczone z ziołami', category: 'MAIN_COURSE' as DishCategory, allergens: [] },

  // ============================================
  // SIDE_DISH - 15 dań
  // ============================================
  { name: 'Ziemniaki opiekane', description: 'Ziemniaki pieczone z rozmarynem', category: 'SIDE_DISH' as DishCategory, allergens: [] },
  { name: 'Frytki belgijskie', description: 'Chrupiące frytki z sosem', category: 'SIDE_DISH' as DishCategory, allergens: [] },
  { name: 'Ryż jaśminowy', description: 'Aromatyczny ryż jaśminowy na sypko', category: 'SIDE_DISH' as DishCategory, allergens: [] },
  { name: 'Kasza gryczana', description: 'Kasza gryczana z cebulką', category: 'SIDE_DISH' as DishCategory, allergens: [] },
  { name: 'Puree ziemniaczane', description: 'Kremowe puree z masłem', category: 'SIDE_DISH' as DishCategory, allergens: ['lactose'] },
  { name: 'Kopytka', description: 'Kopytka ziemniaczane z masłem', category: 'SIDE_DISH' as DishCategory, allergens: ['gluten', 'lactose'] },
  { name: 'Makaron penne', description: 'Makaron penne w sosie pomidorowym', category: 'SIDE_DISH' as DishCategory, allergens: ['gluten'] },
  { name: 'Ryż z warzywami', description: 'Ryż smażony z warzywami', category: 'SIDE_DISH' as DishCategory, allergens: [] },
  { name: 'Placki ziemniaczane', description: 'Tradycyjne placki ze śmietaną', category: 'SIDE_DISH' as DishCategory, allergens: ['gluten', 'lactose'] },
  { name: 'Kluski śląskie', description: 'Kluski śląskie z sosem', category: 'SIDE_DISH' as DishCategory, allergens: ['gluten'] },
  { name: 'Kasza jaglana', description: 'Kasza jaglana z masłem', category: 'SIDE_DISH' as DishCategory, allergens: ['lactose'] },
  { name: 'Ziemniaki gotowane', description: 'Młode ziemniaki z koperkiem', category: 'SIDE_DISH' as DishCategory, allergens: [] },
  { name: 'Kasza perłowa', description: 'Kasza perłowa z grzybami', category: 'SIDE_DISH' as DishCategory, allergens: [] },
  { name: 'Bakłażan grillowany', description: 'Plasterki bakłażana z grilla', category: 'SIDE_DISH' as DishCategory, allergens: [] },
  { name: 'Brokuły z masłem', description: 'Brokuły gotowane na parze', category: 'SIDE_DISH' as DishCategory, allergens: ['lactose'] },

  // ============================================
  // SALAD - 12 dań
  // ============================================
  { name: 'Sałatka grecka', description: 'Sałatka z fetą, oliwkami i pomidorami', category: 'SALAD' as DishCategory, allergens: ['lactose'] },
  { name: 'Sałatka Cezar', description: 'Sałatka z kurczakiem i parmezanem', category: 'SALAD' as DishCategory, allergens: ['gluten', 'lactose', 'eggs', 'fish'] },
  { name: 'Sałatka coleslaw', description: 'Surówka z kapusty z marchewką', category: 'SALAD' as DishCategory, allergens: ['eggs'] },
  { name: 'Sałatka jarzynowa', description: 'Tradycyjna sałatka jarzynowa', category: 'SALAD' as DishCategory, allergens: ['eggs'] },
  { name: 'Sałatka caprese', description: 'Pomidory z mozzarellą i bazylią', category: 'SALAD' as DishCategory, allergens: ['lactose'] },
  { name: 'Surówka z kapusty pekińskiej', description: 'Surówka z sosem jogurtowym', category: 'SALAD' as DishCategory, allergens: ['lactose'] },
  { name: 'Sałatka z tuńczyka', description: 'Sałatka z tuńczykiem i kukurydzą', category: 'SALAD' as DishCategory, allergens: ['fish'] },
  { name: 'Sałatka z rukolą', description: 'Rukola z parmezanem i orzechami', category: 'SALAD' as DishCategory, allergens: ['lactose', 'nuts'] },
  { name: 'Sałatka owocowa', description: 'Mix świeżych owoców', category: 'SALAD' as DishCategory, allergens: [] },
  { name: 'Sałatka z awokado', description: 'Awokado z pomidorami cherry', category: 'SALAD' as DishCategory, allergens: [] },
  { name: 'Mizeria', description: 'Tradycyjna mizeria ze śmietaną', category: 'SALAD' as DishCategory, allergens: ['lactose'] },
  { name: 'Sałatka z buraczków', description: 'Buraczki z chrzanem', category: 'SALAD' as DishCategory, allergens: [] },

  // ============================================
  // DESSERT - 15 dań
  // ============================================
  { name: 'Tiramisu', description: 'Klasyczne włoskie tiramisu', category: 'DESSERT' as DishCategory, allergens: ['gluten', 'lactose', 'eggs'] },
  { name: 'Sernik na zimno', description: 'Sernik na zimno z polewą', category: 'DESSERT' as DishCategory, allergens: ['gluten', 'lactose', 'eggs'] },
  { name: 'Lody waniliowe', description: 'Domowe lody waniliowe', category: 'DESSERT' as DishCategory, allergens: ['lactose', 'eggs'] },
  { name: 'Szarlotka', description: 'Ciepła szarlotka z cynamonem', category: 'DESSERT' as DishCategory, allergens: ['gluten', 'eggs'] },
  { name: 'Panna cotta', description: 'Panna cotta z sosem malinowym', category: 'DESSERT' as DishCategory, allergens: ['lactose'] },
  { name: 'Brownie z czekoladą', description: 'Ciasto czekoladowe z orzechami', category: 'DESSERT' as DishCategory, allergens: ['gluten', 'lactose', 'eggs', 'nuts'] },
  { name: 'Makowiec', description: 'Tradycyjny makowiec', category: 'DESSERT' as DishCategory, allergens: ['gluten', 'lactose', 'eggs'] },
  { name: 'Tarta cytrynowa', description: 'Tarta z kremem cytrynowym', category: 'DESSERT' as DishCategory, allergens: ['gluten', 'lactose', 'eggs'] },
  { name: 'Mus czekoladowy', description: 'Aksamitny mus z ciemnej czekolady', category: 'DESSERT' as DishCategory, allergens: ['lactose', 'eggs'] },
  { name: 'Lody sorbet', description: 'Sorbet owocowy', category: 'DESSERT' as DishCategory, allergens: [] },
  { name: 'Naleśniki z serem', description: 'Naleśniki z serem i bitą śmietaną', category: 'DESSERT' as DishCategory, allergens: ['gluten', 'lactose', 'eggs'] },
  { name: 'Czekolada mousse', description: 'Mousse z belgijskiej czekolady', category: 'DESSERT' as DishCategory, allergens: ['lactose', 'eggs'] },
  { name: 'Trifle owocowy', description: 'Deser warstwowy z owocami', category: 'DESSERT' as DishCategory, allergens: ['gluten', 'lactose', 'eggs'] },
  { name: 'Lava cake', description: 'Ciastko z płynnym wnętrzem', category: 'DESSERT' as DishCategory, allergens: ['gluten', 'lactose', 'eggs'] },
  { name: 'Crème brûlée', description: 'Krem z karmelizowanym cukrem', category: 'DESSERT' as DishCategory, allergens: ['lactose', 'eggs'] },

  // ============================================
  // APPETIZER - 10 dań
  // ============================================
  { name: 'Tatar wołowy', description: 'Surowy tatar z wołowiny z dodatkami', category: 'APPETIZER' as DishCategory, allergens: ['eggs'] },
  { name: 'Carpaccio z wołowiny', description: 'Cienkie plastry wołowiny z rukolą', category: 'APPETIZER' as DishCategory, allergens: [] },
  { name: 'Krewetki w czosnku', description: 'Krewetki smażone na maśle czosnkowym', category: 'APPETIZER' as DishCategory, allergens: ['shellfish', 'lactose'] },
  { name: 'Sałatka z łososia', description: 'Wędzony łosoś z kaparami', category: 'APPETIZER' as DishCategory, allergens: ['fish'] },
  { name: 'Bruschetta', description: 'Grillowany chleb z pomidorami', category: 'APPETIZER' as DishCategory, allergens: ['gluten'] },
  { name: 'Pasztet z kurczaka', description: 'Domowy pasztet z żurawiną', category: 'APPETIZER' as DishCategory, allergens: [] },
  { name: 'Tost z awokado', description: 'Tost z guacamole', category: 'APPETIZER' as DishCategory, allergens: ['gluten'] },
  { name: 'Tatar z łososia', description: 'Tatar z świeżego łososia', category: 'APPETIZER' as DishCategory, allergens: ['fish'] },
  { name: 'Małże w winie', description: 'Małże gotowane w białym winie', category: 'APPETIZER' as DishCategory, allergens: ['shellfish'] },
  { name: 'Sałatka z ośmiornicy', description: 'Ośmiornica z oliwkami', category: 'APPETIZER' as DishCategory, allergens: ['shellfish'] },

  // ============================================
  // COLD_CUTS - 8 dań
  // ============================================
  { name: 'Talerz wędlin polskich', description: 'Mix tradycyjnych polskich wędlin', category: 'COLD_CUTS' as DishCategory, allergens: [] },
  { name: 'Szynka parmeńska', description: 'Dojrzewająca szynka włoska', category: 'COLD_CUTS' as DishCategory, allergens: [] },
  { name: 'Kabanosy', description: 'Tradycyjne polskie kabanosy', category: 'COLD_CUTS' as DishCategory, allergens: [] },
  { name: 'Salami włoskie', description: 'Plastry salami', category: 'COLD_CUTS' as DishCategory, allergens: [] },
  { name: 'Szynka z kością', description: 'Szynka pieczona z kością', category: 'COLD_CUTS' as DishCategory, allergens: [] },
  { name: 'Żeberka wędzone', description: 'Wędzony boczek żebrowy', category: 'COLD_CUTS' as DishCategory, allergens: [] },
  { name: 'Kiełbasa biała', description: 'Świeża kiełbasa biała', category: 'COLD_CUTS' as DishCategory, allergens: [] },
  { name: 'Mix serów', description: 'Deska serów dojrzewających', category: 'COLD_CUTS' as DishCategory, allergens: ['lactose'] },

  // ============================================
  // DRINK - 10 dań
  // ============================================
  { name: 'Kompot', description: 'Domowy kompot z owoców', category: 'DRINK' as DishCategory, allergens: [] },
  { name: 'Sok pomarańczowy', description: 'Świeżo wyciskany sok', category: 'DRINK' as DishCategory, allergens: [] },
  { name: 'Lemoniada', description: 'Domowa lemoniada z miętą', category: 'DRINK' as DishCategory, allergens: [] },
  { name: 'Kawa espresso', description: 'Kawa espresso z Włoch', category: 'DRINK' as DishCategory, allergens: [] },
  { name: 'Herbata zielona', description: 'Herbata zielona', category: 'DRINK' as DishCategory, allergens: [] },
  { name: 'Woda mineralna', description: 'Woda gazowana lub niegazowana', category: 'DRINK' as DishCategory, allergens: [] },
  { name: 'Smoothie owocowe', description: 'Koktajl z świeżych owoców', category: 'DRINK' as DishCategory, allergens: [] },
  { name: 'Sok jabłkowy', description: 'Naturalny sok z jabłek', category: 'DRINK' as DishCategory, allergens: [] },
  { name: 'Kakao', description: 'Gorąca czekolada', category: 'DRINK' as DishCategory, allergens: ['lactose'] },
  { name: 'Mrożona kawa', description: 'Kawa z lodem i mlekiem', category: 'DRINK' as DishCategory, allergens: ['lactose'] },
];

export async function seedComprehensiveDishes() {
  console.log('🌱 Starting comprehensive dish seed...');

  // Clear existing dishes
  await prisma.dish.deleteMany({});
  console.log('✅ Cleared existing dishes');

  // Create all dishes
  let created = 0;
  for (const dish of dishes) {
    await prisma.dish.create({
      data: dish,
    });
    created++;
  }

  console.log(`✅ Created ${created} dishes`);
  
  // Show count by category
  const categories = await prisma.dish.groupBy({
    by: ['category'],
    _count: true,
  });
  
  console.log('\n📊 Dishes by category:');
  categories.forEach(cat => {
    console.log(`  ${cat.category}: ${cat._count} dań`);
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
      console.error('❌ Seed failed:', error);
      process.exit(1);
    })
    .finally(() => {
      prisma.$disconnect();
    });
}
