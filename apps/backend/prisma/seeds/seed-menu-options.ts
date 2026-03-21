/**
 * Seed Menu Options
 * Fills database with 100+ diverse menu options
 */

import { prisma } from '../lib/prisma.js';

const MENU_OPTIONS_DATA = [
  // DRINKS (25 options)
  { name: 'Kawa espresso', category: 'DRINK', priceType: 'PER_PERSON', priceAmount: 8, icon: '☕', description: 'Klasyczna włoska kawa espresso' },
  { name: 'Kawa cappuccino', category: 'DRINK', priceType: 'PER_PERSON', priceAmount: 10, icon: '☕', description: 'Kawa z pianką mleczną' },
  { name: 'Kawa latte', category: 'DRINK', priceType: 'PER_PERSON', priceAmount: 12, icon: '☕', description: 'Kawa z dużą ilością mleka' },
  { name: 'Kawa mrożona', category: 'DRINK', priceType: 'PER_PERSON', priceAmount: 14, icon: '🧊', description: 'Zimna kawa z lodem' },
  { name: 'Herbata czarna', category: 'DRINK', priceType: 'PER_PERSON', priceAmount: 7, icon: '🍵', description: 'Klasyczna herbata czarna' },
  { name: 'Herbata zielona', category: 'DRINK', priceType: 'PER_PERSON', priceAmount: 7, icon: '🍵', description: 'Delikatna herbata zielona' },
  { name: 'Herbata owocowa', category: 'DRINK', priceType: 'PER_PERSON', priceAmount: 7, icon: '🍵', description: 'Aromatyczna herbata owocowa' },
  { name: 'Sok pomarańczowy', category: 'DRINK', priceType: 'PER_PERSON', priceAmount: 8, icon: '🍊', description: 'Świeżo wyciskany sok' },
  { name: 'Sok jabłkowy', category: 'DRINK', priceType: 'PER_PERSON', priceAmount: 8, icon: '🍎', description: 'Naturalny sok jabłkowy' },
  { name: 'Sok wieloowocowy', category: 'DRINK', priceType: 'PER_PERSON', priceAmount: 8, icon: '🍹', description: 'Mix soków owocowych' },
  { name: 'Lemoniada', category: 'DRINK', priceType: 'PER_PERSON', priceAmount: 10, icon: '🍋', description: 'Orzeźwiająca lemoniada' },
  { name: 'Lemoniada malinowa', category: 'DRINK', priceType: 'PER_PERSON', priceAmount: 12, icon: '🍓', description: 'Lemoniada z maliną' },
  { name: 'Woda mineralna gazowana', category: 'DRINK', priceType: 'PER_PERSON', priceAmount: 5, icon: '💧', description: 'Woda z gazem 0.5L' },
  { name: 'Woda mineralna niegazowana', category: 'DRINK', priceType: 'PER_PERSON', priceAmount: 5, icon: '💧', description: 'Woda bez gazu 0.5L' },
  { name: 'Cola', category: 'DRINK', priceType: 'PER_PERSON', priceAmount: 7, icon: '🥤', description: 'Coca-Cola 0.33L' },
  { name: 'Sprite', category: 'DRINK', priceType: 'PER_PERSON', priceAmount: 7, icon: '🥤', description: 'Sprite 0.33L' },
  { name: 'Fanta', category: 'DRINK', priceType: 'PER_PERSON', priceAmount: 7, icon: '🥤', description: 'Fanta pomarańczowa 0.33L' },
  { name: 'Kompot domowy', category: 'DRINK', priceType: 'PER_PERSON', priceAmount: 6, icon: '🍒', description: 'Domowy kompot owocowy' },
  { name: 'Smoothie truskawkowe', category: 'DRINK', priceType: 'PER_PERSON', priceAmount: 15, icon: '🍓', description: 'Koktajl z truskawek' },
  { name: 'Smoothie bananowe', category: 'DRINK', priceType: 'PER_PERSON', priceAmount: 15, icon: '🍌', description: 'Koktajl z banana' },
  { name: 'Shake czekoladowy', category: 'DRINK', priceType: 'PER_PERSON', priceAmount: 16, icon: '🍫', description: 'Shake z lodami czekoladowymi' },
  { name: 'Shake waniliowy', category: 'DRINK', priceType: 'PER_PERSON', priceAmount: 16, icon: '🍨', description: 'Shake z lodami waniliowymi' },
  { name: 'Ice tea brzoskwiniowy', category: 'DRINK', priceType: 'PER_PERSON', priceAmount: 8, icon: '🍑', description: 'Mrożona herbata brzoskwiniowa' },
  { name: 'Ice tea cytrynowy', category: 'DRINK', priceType: 'PER_PERSON', priceAmount: 8, icon: '🍋', description: 'Mrożona herbata cytrynowa' },
  { name: 'Woda smakowa', category: 'DRINK', priceType: 'PER_PERSON', priceAmount: 6, icon: '💧', description: 'Woda z dodatkiem smaku' },

  // ALCOHOL (30 options)
  { name: 'Wódka czysta 0.5L', category: 'ALCOHOL', priceType: 'PER_ITEM', priceAmount: 50, icon: '🍸', description: 'Polska wódka czysta' },
  { name: 'Wódka żubrówka 0.5L', category: 'ALCOHOL', priceType: 'PER_ITEM', priceAmount: 60, icon: '🍸', description: 'Wódka z trawą żubrową' },
  { name: 'Wódka Finlandia 0.5L', category: 'ALCOHOL', priceType: 'PER_ITEM', priceAmount: 70, icon: '🍸', description: 'Fińska wódka premium' },
  { name: 'Wino białe wytrawne', category: 'ALCOHOL', priceType: 'PER_ITEM', priceAmount: 45, icon: '🍾', description: 'Białe wino wytrawne 0.75L' },
  { name: 'Wino białe półsłodkie', category: 'ALCOHOL', priceType: 'PER_ITEM', priceAmount: 45, icon: '🍾', description: 'Białe wino półsłodkie 0.75L' },
  { name: 'Wino czerwone wytrawne', category: 'ALCOHOL', priceType: 'PER_ITEM', priceAmount: 50, icon: '🍷', description: 'Czerwone wino wytrawne 0.75L' },
  { name: 'Wino czerwone półsłodkie', category: 'ALCOHOL', priceType: 'PER_ITEM', priceAmount: 50, icon: '🍷', description: 'Czerwone wino półsłodkie 0.75L' },
  { name: 'Prosecco', category: 'ALCOHOL', priceType: 'PER_ITEM', priceAmount: 55, icon: '🥂', description: 'Włoskie wino musujące 0.75L' },
  { name: 'Szampan', category: 'ALCOHOL', priceType: 'PER_ITEM', priceAmount: 120, icon: '🍾', description: 'Francuski szampan 0.75L' },
  { name: 'Piwo jasne', category: 'ALCOHOL', priceType: 'PER_PERSON', priceAmount: 8, icon: '🍺', description: 'Piwo jasne 0.5L' },
  { name: 'Piwo ciemne', category: 'ALCOHOL', priceType: 'PER_PERSON', priceAmount: 8, icon: '🍺', description: 'Piwo ciemne 0.5L' },
  { name: 'Piwo bezalkoholowe', category: 'ALCOHOL', priceType: 'PER_PERSON', priceAmount: 7, icon: '🍺', description: 'Piwo 0% 0.5L' },
  { name: 'Piwo kraftowe IPA', category: 'ALCOHOL', priceType: 'PER_PERSON', priceAmount: 12, icon: '🍺', description: 'Kraftowe piwo IPA 0.5L' },
  { name: 'Piwo pszeniczne', category: 'ALCOHOL', priceType: 'PER_PERSON', priceAmount: 10, icon: '🍺', description: 'Piwo pszeniczne 0.5L' },
  { name: 'Whisky Ballantines', category: 'ALCOHOL', priceType: 'PER_ITEM', priceAmount: 120, icon: '🥃', description: 'Szkocka whisky 0.7L' },
  { name: 'Whisky Jack Daniels', category: 'ALCOHOL', priceType: 'PER_ITEM', priceAmount: 150, icon: '🥃', description: 'Amerykańska whisky 0.7L' },
  { name: 'Whisky Jameson', category: 'ALCOHOL', priceType: 'PER_ITEM', priceAmount: 130, icon: '🥃', description: 'Irlandzka whisky 0.7L' },
  { name: 'Gin Gordon\'s', category: 'ALCOHOL', priceType: 'PER_ITEM', priceAmount: 80, icon: '🍸', description: 'Gin premium 0.7L' },
  { name: 'Gin Bombay Sapphire', category: 'ALCOHOL', priceType: 'PER_ITEM', priceAmount: 120, icon: '🍸', description: 'Gin premium blue 0.7L' },
  { name: 'Rum Bacardi', category: 'ALCOHOL', priceType: 'PER_ITEM', priceAmount: 90, icon: '🥃', description: 'Biały rum 0.7L' },
  { name: 'Rum Captain Morgan', category: 'ALCOHOL', priceType: 'PER_ITEM', priceAmount: 95, icon: '🥃', description: 'Ciemny rum 0.7L' },
  { name: 'Tequila Sierra', category: 'ALCOHOL', priceType: 'PER_ITEM', priceAmount: 100, icon: '🥃', description: 'Meksykańska tequila 0.7L' },
  { name: 'Likier Baileys', category: 'ALCOHOL', priceType: 'PER_ITEM', priceAmount: 85, icon: '🍶', description: 'Likier kremowy 0.7L' },
  { name: 'Likier Jägermeister', category: 'ALCOHOL', priceType: 'PER_ITEM', priceAmount: 90, icon: '🍶', description: 'Niemiecki likier ziołowy 0.7L' },
  { name: 'Martini Bianco', category: 'ALCOHOL', priceType: 'PER_ITEM', priceAmount: 50, icon: '🍸', description: 'Wermut biały 1L' },
  { name: 'Martini Rosso', category: 'ALCOHOL', priceType: 'PER_ITEM', priceAmount: 50, icon: '🍸', description: 'Wermut czerwony 1L' },
  { name: 'Aperol', category: 'ALCOHOL', priceType: 'PER_ITEM', priceAmount: 70, icon: '🍹', description: 'Włoski aperitif 0.7L' },
  { name: 'Cydr jabłkowy', category: 'ALCOHOL', priceType: 'PER_PERSON', priceAmount: 9, icon: '🍎', description: 'Cydr z jabłek 0.5L' },
  { name: 'Sangria', category: 'ALCOHOL', priceType: 'PER_ITEM', priceAmount: 60, icon: '🍷', description: 'Hiszpańska sangria 1L' },
  { name: 'Cocktail bar (obsługa)', category: 'ALCOHOL', priceType: 'FLAT', priceAmount: 800, icon: '🍹', description: 'Barman + koktajle na 3h' },

  // DESSERTS (20 options)
  { name: 'Tort czekoladowy', category: 'DESSERT', priceType: 'PER_PERSON', priceAmount: 15, icon: '🍰', description: 'Porcja tortu czekoladowego' },
  { name: 'Tort owocowy', category: 'DESSERT', priceType: 'PER_PERSON', priceAmount: 15, icon: '🍰', description: 'Porcja tortu z owocami' },
  { name: 'Tort bezowy', category: 'DESSERT', priceType: 'PER_PERSON', priceAmount: 16, icon: '🍰', description: 'Porcja tortu bezowego' },
  { name: 'Sernik klasyczny', category: 'DESSERT', priceType: 'PER_PERSON', priceAmount: 12, icon: '🍰', description: 'Porcja sernika' },
  { name: 'Tiramisu', category: 'DESSERT', priceType: 'PER_PERSON', priceAmount: 14, icon: '🍮', description: 'Włoski deser kawowy' },
  { name: 'Panna cotta', category: 'DESSERT', priceType: 'PER_PERSON', priceAmount: 12, icon: '🍮', description: 'Włoski deser śmietankowy' },
  { name: 'Crème brûlée', category: 'DESSERT', priceType: 'PER_PERSON', priceAmount: 14, icon: '🍮', description: 'Francuski deser z karmelem' },
  { name: 'Brownie z lodami', category: 'DESSERT', priceType: 'PER_PERSON', priceAmount: 13, icon: '🍫', description: 'Czekoladowe brownie z lodami' },
  { name: 'Lody waniliowe', category: 'DESSERT', priceType: 'PER_PERSON', priceAmount: 8, icon: '🍨', description: '3 gałki lodów waniliowych' },
  { name: 'Lody czekoladowe', category: 'DESSERT', priceType: 'PER_PERSON', priceAmount: 8, icon: '🍨', description: '3 gałki lodów czekoladowych' },
  { name: 'Lody truskawkowe', category: 'DESSERT', priceType: 'PER_PERSON', priceAmount: 8, icon: '🍨', description: '3 gałki lodów truskawkowych' },
  { name: 'Makaroniki francuskie', category: 'DESSERT', priceType: 'PER_PERSON', priceAmount: 10, icon: '🧁', description: 'Mix makaroników (4 szt)' },
  { name: 'Babeczki cupcake', category: 'DESSERT', priceType: 'PER_PERSON', priceAmount: 8, icon: '🧁', description: 'Kolorowe cupcake (2 szt)' },
  { name: 'Trufle czekoladowe', category: 'DESSERT', priceType: 'PER_PERSON', priceAmount: 12, icon: '🍫', description: 'Czekoladowe trufle (5 szt)' },
  { name: 'Ptysie z kremem', category: 'DESSERT', priceType: 'PER_PERSON', priceAmount: 10, icon: '🥐', description: 'Ptysie z kremem (3 szt)' },
  { name: 'Szarlotka', category: 'DESSERT', priceType: 'PER_PERSON', priceAmount: 11, icon: '🥧', description: 'Jabłecznik z cynamonem' },
  { name: 'Tarta cytrynowa', category: 'DESSERT', priceType: 'PER_PERSON', priceAmount: 13, icon: '🥧', description: 'Tarta z kremem cytrynowym' },
  { name: 'Owoce sezonowe', category: 'DESSERT', priceType: 'PER_PERSON', priceAmount: 9, icon: '🍓', description: 'Świeże owoce sezonowe' },
  { name: 'Mus czekoladowy', category: 'DESSERT', priceType: 'PER_PERSON', priceAmount: 11, icon: '🍫', description: 'Delikatny mus czekoladowy' },
  { name: 'Candy bar', category: 'DESSERT', priceType: 'FLAT', priceAmount: 500, icon: '🍭', description: 'Słodki stół z cukierkami' },

  // EXTRA_DISH (15 options)
  { name: 'Dodatkowa zupa', category: 'EXTRA_DISH', priceType: 'PER_PERSON', priceAmount: 12, icon: '🍲', description: 'Porcja dodatkowej zupy' },
  { name: 'Dodatkowe danie główne', category: 'EXTRA_DISH', priceType: 'PER_PERSON', priceAmount: 30, icon: '🍽️', description: 'Drugie danie główne' },
  { name: 'Przystawka zimna', category: 'EXTRA_DISH', priceType: 'PER_PERSON', priceAmount: 15, icon: '🥗', description: 'Dodatkowa przystawka zimna' },
  { name: 'Przekąska ciepła', category: 'EXTRA_DISH', priceType: 'PER_PERSON', priceAmount: 18, icon: '🥘', description: 'Ciepła przekąska' },
  { name: 'Sałatka grecka', category: 'EXTRA_DISH', priceType: 'PER_PERSON', priceAmount: 14, icon: '🥗', description: 'Dodatkowa sałatka grecka' },
  { name: 'Frytki', category: 'EXTRA_DISH', priceType: 'PER_PERSON', priceAmount: 8, icon: '🍟', description: 'Porcja frytek' },
  { name: 'Ryż', category: 'EXTRA_DISH', priceType: 'PER_PERSON', priceAmount: 6, icon: '🍚', description: 'Porcja ryżu' },
  { name: 'Ziemniaki opiekane', category: 'EXTRA_DISH', priceType: 'PER_PERSON', priceAmount: 7, icon: '🥔', description: 'Ziemniaki z piekarnika' },
  { name: 'Kasza gryczana', category: 'EXTRA_DISH', priceType: 'PER_PERSON', priceAmount: 6, icon: '🍚', description: 'Porcja kaszy' },
  { name: 'Mix warzyw grillowanych', category: 'EXTRA_DISH', priceType: 'PER_PERSON', priceAmount: 12, icon: '🥕', description: 'Warzywa z grilla' },
  { name: 'Sałatka coleslaw', category: 'EXTRA_DISH', priceType: 'PER_PERSON', priceAmount: 8, icon: '🥗', description: 'Surówka z kapusty' },
  { name: 'Makaron', category: 'EXTRA_DISH', priceType: 'PER_PERSON', priceAmount: 10, icon: '🍝', description: 'Porcja makaronu' },
  { name: 'Pyzy śląskie', category: 'EXTRA_DISH', priceType: 'PER_PERSON', priceAmount: 14, icon: '🥔', description: 'Tradycyjne pyzy śląskie' },
  { name: 'Naleśniki', category: 'EXTRA_DISH', priceType: 'PER_PERSON', priceAmount: 15, icon: '🥞', description: 'Naleśniki z serem' },
  { name: 'Pielmieni', category: 'EXTRA_DISH', priceType: 'PER_PERSON', priceAmount: 16, icon: '🥟', description: 'Ruskie pielmieni' },

  // SERVICES (10 options)
  { name: 'Fotograf zawodowy', category: 'SERVICE', priceType: 'FLAT', priceAmount: 1500, icon: '📸', description: 'Fotograf na całą imprezę' },
  { name: 'Kamerzysta', category: 'SERVICE', priceType: 'FLAT', priceAmount: 1800, icon: '🎥', description: 'Filmowanie wydarzenia' },
  { name: 'DJ z nagłośnieniem', category: 'SERVICE', priceType: 'FLAT', priceAmount: 1200, icon: '🎧', description: 'DJ + sprzęt na 5h' },
  { name: 'Zespół muzyczny', category: 'SERVICE', priceType: 'FLAT', priceAmount: 2500, icon: '🎸', description: 'Zespół na żywo (3h)' },
  { name: 'Wodzirej', category: 'SERVICE', priceType: 'FLAT', priceAmount: 800, icon: '🎤', description: 'Animator imprez' },
  { name: 'Barman mobilny', category: 'SERVICE', priceType: 'FLAT', priceAmount: 600, icon: '🍸', description: 'Barman na 4h' },
  { name: 'Kelner dodatkowy', category: 'SERVICE', priceType: 'FLAT', priceAmount: 400, icon: '👔', description: 'Kelner na zmianę' },
  { name: 'Ochrona', category: 'SERVICE', priceType: 'FLAT', priceAmount: 500, icon: '💪', description: 'Ochroniarz na imprezę' },
  { name: 'Garderobiany', category: 'SERVICE', priceType: 'FLAT', priceAmount: 300, icon: '🧥', description: 'Obsługa szatni' },
  { name: 'Valet parking', category: 'SERVICE', priceType: 'FLAT', priceAmount: 700, icon: '🚗', description: 'Parkingowy' },

  // DECORATION (8 options)
  { name: 'Balony dekoracyjne', category: 'DECORATION', priceType: 'FLAT', priceAmount: 300, icon: '🎈', description: 'Dekoracja balonowa sali' },
  { name: 'Kwiaty na stoły', category: 'DECORATION', priceType: 'PER_ITEM', priceAmount: 80, icon: '💐', description: 'Bukiet na stół' },
  { name: 'Obrusy kolorowe', category: 'DECORATION', priceType: 'PER_ITEM', priceAmount: 15, icon: '🎀', description: 'Kolorowy obrus' },
  { name: 'Świece dekoracyjne', category: 'DECORATION', priceType: 'FLAT', priceAmount: 150, icon: '🕯️', description: 'Świece na stoły' },
  { name: 'Oświetlenie LED', category: 'DECORATION', priceType: 'FLAT', priceAmount: 500, icon: '💡', description: 'Profesjonalne światła LED' },
  { name: 'Tło fotograficzne', category: 'DECORATION', priceType: 'FLAT', priceAmount: 400, icon: '📷', description: 'Ścianka do zdjęć' },
  { name: 'Girlandy', category: 'DECORATION', priceType: 'FLAT', priceAmount: 200, icon: '🎊', description: 'Girlandy dekoracyjne' },
  { name: 'Bieżnik na stół', category: 'DECORATION', priceType: 'PER_ITEM', priceAmount: 20, icon: '🎀', description: 'Elegancki bieżnik' },

  // ENTERTAINMENT (7 options)
  { name: 'Pokaz sztucznych ogni', category: 'ENTERTAINMENT', priceType: 'FLAT', priceAmount: 1500, icon: '🎆', description: 'Fajerwerki na zakończenie' },
  { name: 'Fotobudka', category: 'ENTERTAINMENT', priceType: 'FLAT', priceAmount: 800, icon: '📸', description: 'Fotobudka na 3h' },
  { name: 'Karykaturzysta', category: 'ENTERTAINMENT', priceType: 'FLAT', priceAmount: 600, icon: '🎨', description: 'Rysowanie karykatur' },
  { name: 'Magik', category: 'ENTERTAINMENT', priceType: 'FLAT', priceAmount: 700, icon: '🎩', description: 'Pokazy magiczne' },
  { name: 'Barman flair', category: 'ENTERTAINMENT', priceType: 'FLAT', priceAmount: 900, icon: '🤹', description: 'Pokaz barmański' },
  { name: 'Tancerze', category: 'ENTERTAINMENT', priceType: 'FLAT', priceAmount: 1200, icon: '💃', description: 'Pokaz taneczny' },
  { name: 'Karaoke', category: 'ENTERTAINMENT', priceType: 'FLAT', priceAmount: 500, icon: '🎤', description: 'Zestaw karaoke' },

  // OTHER (5 options)
  { name: 'Menu wegetariańskie', category: 'OTHER', priceType: 'PER_PERSON', priceAmount: 0, icon: '🥬', description: 'Opcja wegetariańska bez dopłaty' },
  { name: 'Menu wegańskie', category: 'OTHER', priceType: 'PER_PERSON', priceAmount: 5, icon: '🌱', description: 'Opcja wegańska +5 zł' },
  { name: 'Menu bezglutenowe', category: 'OTHER', priceType: 'PER_PERSON', priceAmount: 10, icon: '🌾', description: 'Dania bezglutenowe +10 zł' },
  { name: 'Menu dziecięce', category: 'OTHER', priceType: 'PER_PERSON', priceAmount: 35, icon: '👶', description: 'Specjalne menu dla dzieci' },
  { name: 'Tort weselny', category: 'OTHER', priceType: 'FLAT', priceAmount: 800, icon: '🎂', description: 'Tort weselny 3 piętra' },
];

async function seedMenuOptions() {
  console.log('🌱 Seeding menu options...');

  let created = 0;
  let skipped = 0;

  for (const option of MENU_OPTIONS_DATA) {
    try {
      // Check if option already exists
      const existing = await prisma.menuOption.findFirst({
        where: {
          name: option.name,
          category: option.category,
        },
      });

      if (existing) {
        skipped++;
        continue;
      }

      await prisma.menuOption.create({
        data: {
          ...option,
          isActive: true,
          displayOrder: created,
          allowMultiple: option.priceType !== 'FLAT',
          maxQuantity: option.priceType === 'PER_PERSON' ? 3 : 10,
        },
      });

      created++;
    } catch (error: any) {
      console.error(`❌ Failed to create "${option.name}":`, error.message);
    }
  }

  console.log(`\n✅ Seed complete!`);
  console.log(`   Created: ${created} options`);
  console.log(`   Skipped: ${skipped} options (already exist)`);
  console.log(`   Total in database: ${created + skipped}`);
}

// Run if called directly
if (require.main === module) {
  seedMenuOptions()
    .catch((e) => {
      console.error('❌ Seed error:', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

export { seedMenuOptions };
