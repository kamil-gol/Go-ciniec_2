import { PrismaClient, DishCategory } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

const prisma = new PrismaClient();

// COMPREHENSIVE MENU TEMPLATES AND PACKAGES SEED

export async function seedMenuTemplatesAndPackages() {
  console.log('🌱 Starting menu templates & packages seed...');

  // 1. CREATE EVENT TYPES (if not exists)
  console.log('\n🎯 Creating event types...');
  
  const eventTypes = [
    { name: 'Wesele', description: 'Uroczystość weselna z przyjęciem', color: '#FF69B4' },
    { name: 'Urodziny', description: 'Przyjęcie urodzinowe', color: '#FFA500' },
    { name: 'Rocznica/Jubileusz', description: 'Rocznica ślubu lub jubileusz', color: '#FFD700' },
    { name: 'Komunia', description: 'Pierwsza Komunia Święta', color: '#87CEEB' },
    { name: 'Chrzest/Roczek', description: 'Chrzest lub pierwsze urodziny dziecka', color: '#98FB98' },
    { name: 'Stypa', description: 'Stypa pogrzebowa', color: '#696969' },
    { name: 'Inne', description: 'Inne rodzaje wydarzeń', color: '#9370DB' },
  ];

  const createdEventTypes: any[] = [];
  for (const et of eventTypes) {
    const existing = await prisma.eventType.findFirst({ where: { name: et.name } });
    if (!existing) {
      const created = await prisma.eventType.create({ data: et });
      createdEventTypes.push(created);
      console.log(`  ✅ ${et.name}`);
    } else {
      createdEventTypes.push(existing);
      console.log(`  ℹ️ ${et.name} (exists)`);
    }
  }

  // 2. CREATE MENU TEMPLATES
  console.log('\n📝 Creating menu templates...');

  // Find event types
  const weselleType = createdEventTypes.find(e => e.name === 'Wesele');
  const komuniaType = createdEventTypes.find(e => e.name === 'Komunia');
  const chrzestType = createdEventTypes.find(e => e.name === 'Chrzest/Roczek');
  const urodzinyType = createdEventTypes.find(e => e.name === 'Urodziny');
  const inneType = createdEventTypes.find(e => e.name === 'Inne');

  // Clear existing templates
  await prisma.menuPackage.deleteMany({});
  await prisma.menuTemplate.deleteMany({});
  console.log('  ✅ Cleared existing templates');

  const templates = [
    {
      name: 'Menu Weselne Premium 2026',
      description: 'Eleganckie menu na wesele',
      eventTypeId: weselleType.id,
      variant: 'Premium',
      validFrom: null,
      validTo: null, // Bezterminowe
      isActive: true,
    },
    {
      name: 'Menu Komunijne 2026',
      description: 'Menu dla dzieci i rodzin',
      eventTypeId: komuniaType.id,
      variant: null,
      validFrom: new Date('2026-04-01'),
      validTo: new Date('2026-06-30'),
      isActive: true,
    },
    {
      name: 'Menu Chrześcinowe',
      description: 'Lekkie menu na chrzest',
      eventTypeId: chrzestType.id,
      variant: 'Standard',
      validFrom: null,
      validTo: null, // Bezterminowe
      isActive: true,
    },
    {
      name: 'Menu Urodzinowe Doroslych',
      description: 'Menu na przyjęcie urodzinowe',
      eventTypeId: urodzinyType.id,
      variant: 'Standard',
      validFrom: null,
      validTo: null,
      isActive: true,
    },
    {
      name: 'Menu Firmowe Business',
      description: 'Menu na eventy firmowe',
      eventTypeId: inneType.id,
      variant: 'Business',
      validFrom: new Date('2026-01-01'),
      validTo: new Date('2026-12-31'),
      isActive: true,
    },
  ];

  const createdTemplates: any[] = [];
  for (const template of templates) {
    const created = await prisma.menuTemplate.create({ data: template });
    createdTemplates.push(created);
    console.log(`  ✅ ${created.name}`);
  }

  // 3. CREATE PACKAGES WITH CATEGORY SETTINGS
  console.log('\n📦 Creating packages with category settings...');

  // Pakiety dla wesela
  const weselleTemplate = createdTemplates[0];
  await createPackageWithCategories(
    weselleTemplate.id,
    'Pakiet Standard',
    'Podstawowe menu weselne',
    new Decimal(150),
    new Decimal(100),
    new Decimal(50),
    [
      { category: 'SOUP' as DishCategory, minSelect: new Decimal(1), maxSelect: new Decimal(1.5), displayOrder: 1 },
      { category: 'MAIN_COURSE' as DishCategory, minSelect: new Decimal(1), maxSelect: new Decimal(2), displayOrder: 2 },
      { category: 'SIDE_DISH' as DishCategory, minSelect: new Decimal(2), maxSelect: new Decimal(3), displayOrder: 3 },
      { category: 'SALAD' as DishCategory, minSelect: new Decimal(1), maxSelect: new Decimal(2), displayOrder: 4 },
      { category: 'DESSERT' as DishCategory, minSelect: new Decimal(1), maxSelect: new Decimal(2), displayOrder: 5 },
    ]
  );

  await createPackageWithCategories(
    weselleTemplate.id,
    'Pakiet Premium',
    'Rozszerzone menu z dodatkami',
    new Decimal(200),
    new Decimal(130),
    new Decimal(60),
    [
      { category: 'SOUP' as DishCategory, minSelect: new Decimal(1), maxSelect: new Decimal(2), displayOrder: 1 },
      { category: 'APPETIZER' as DishCategory, minSelect: new Decimal(1), maxSelect: new Decimal(2), displayOrder: 2 },
      { category: 'MAIN_COURSE' as DishCategory, minSelect: new Decimal(1.5), maxSelect: new Decimal(2.5), displayOrder: 3 },
      { category: 'SIDE_DISH' as DishCategory, minSelect: new Decimal(2), maxSelect: new Decimal(4), displayOrder: 4 },
      { category: 'SALAD' as DishCategory, minSelect: new Decimal(1.5), maxSelect: new Decimal(3), displayOrder: 5 },
      { category: 'COLD_CUTS' as DishCategory, minSelect: new Decimal(0.5), maxSelect: new Decimal(1), displayOrder: 6 },
      { category: 'DESSERT' as DishCategory, minSelect: new Decimal(1), maxSelect: new Decimal(3), displayOrder: 7 },
    ]
  );

  await createPackageWithCategories(
    weselleTemplate.id,
    'Pakiet VIP',
    'Najbardziej ekskluzywne menu',
    new Decimal(280),
    new Decimal(180),
    new Decimal(80),
    [
      { category: 'SOUP' as DishCategory, minSelect: new Decimal(1), maxSelect: new Decimal(2), displayOrder: 1 },
      { category: 'APPETIZER' as DishCategory, minSelect: new Decimal(1.5), maxSelect: new Decimal(3), displayOrder: 2 },
      { category: 'MAIN_COURSE' as DishCategory, minSelect: new Decimal(2), maxSelect: new Decimal(3), displayOrder: 3 },
      { category: 'SIDE_DISH' as DishCategory, minSelect: new Decimal(3), maxSelect: new Decimal(5), displayOrder: 4 },
      { category: 'SALAD' as DishCategory, minSelect: new Decimal(2), maxSelect: new Decimal(4), displayOrder: 5 },
      { category: 'COLD_CUTS' as DishCategory, minSelect: new Decimal(1), maxSelect: new Decimal(2), displayOrder: 6 },
      { category: 'DESSERT' as DishCategory, minSelect: new Decimal(2), maxSelect: new Decimal(4), displayOrder: 7 },
    ]
  );

  // Pakiety dla komunii
  const komuniaTemplate = createdTemplates[1];
  await createPackageWithCategories(
    komuniaTemplate.id,
    'Pakiet Rodzinny',
    'Menu dla całej rodziny',
    new Decimal(120),
    new Decimal(80),
    new Decimal(40),
    [
      { category: 'SOUP' as DishCategory, minSelect: new Decimal(1), maxSelect: new Decimal(1.5), displayOrder: 1 },
      { category: 'MAIN_COURSE' as DishCategory, minSelect: new Decimal(1), maxSelect: new Decimal(2), displayOrder: 2 },
      { category: 'SIDE_DISH' as DishCategory, minSelect: new Decimal(1.5), maxSelect: new Decimal(2.5), displayOrder: 3 },
      { category: 'SALAD' as DishCategory, minSelect: new Decimal(0.5), maxSelect: new Decimal(1.5), displayOrder: 4 },
      { category: 'DESSERT' as DishCategory, minSelect: new Decimal(1), maxSelect: new Decimal(3), displayOrder: 5 },
    ]
  );

  await createPackageWithCategories(
    komuniaTemplate.id,
    'Pakiet Premium Komunia',
    'Rozbudowane menu',
    new Decimal(160),
    new Decimal(110),
    new Decimal(55),
    [
      { category: 'SOUP' as DishCategory, minSelect: new Decimal(1), maxSelect: new Decimal(2), displayOrder: 1 },
      { category: 'MAIN_COURSE' as DishCategory, minSelect: new Decimal(1.5), maxSelect: new Decimal(2.5), displayOrder: 2 },
      { category: 'SIDE_DISH' as DishCategory, minSelect: new Decimal(2), maxSelect: new Decimal(3), displayOrder: 3 },
      { category: 'SALAD' as DishCategory, minSelect: new Decimal(1), maxSelect: new Decimal(2), displayOrder: 4 },
      { category: 'DESSERT' as DishCategory, minSelect: new Decimal(1.5), maxSelect: new Decimal(3.5), displayOrder: 5 },
    ]
  );

  // Pakiet dla chrztu
  const chrzestTemplate = createdTemplates[2];
  await createPackageWithCategories(
    chrzestTemplate.id,
    'Pakiet Chrześcinowy',
    'Lekkie menu na chrzest',
    new Decimal(100),
    new Decimal(70),
    new Decimal(35),
    [
      { category: 'SOUP' as DishCategory, minSelect: new Decimal(0.5), maxSelect: new Decimal(1), displayOrder: 1 },
      { category: 'MAIN_COURSE' as DishCategory, minSelect: new Decimal(1), maxSelect: new Decimal(1.5), displayOrder: 2 },
      { category: 'SIDE_DISH' as DishCategory, minSelect: new Decimal(1), maxSelect: new Decimal(2), displayOrder: 3 },
      { category: 'SALAD' as DishCategory, minSelect: new Decimal(0.5), maxSelect: new Decimal(1.5), displayOrder: 4 },
      { category: 'DESSERT' as DishCategory, minSelect: new Decimal(1), maxSelect: new Decimal(2), displayOrder: 5 },
    ]
  );

  // Pakiet urodzinowy
  const urodzinyTemplate = createdTemplates[3];
  await createPackageWithCategories(
    urodzinyTemplate.id,
    'Pakiet Urodzinowy',
    'Menu na przyjęcie',
    new Decimal(130),
    new Decimal(90),
    new Decimal(45),
    [
      { category: 'MAIN_COURSE' as DishCategory, minSelect: new Decimal(1), maxSelect: new Decimal(2), displayOrder: 1 },
      { category: 'SIDE_DISH' as DishCategory, minSelect: new Decimal(1.5), maxSelect: new Decimal(3), displayOrder: 2 },
      { category: 'SALAD' as DishCategory, minSelect: new Decimal(1), maxSelect: new Decimal(2), displayOrder: 3 },
      { category: 'DESSERT' as DishCategory, minSelect: new Decimal(1.5), maxSelect: new Decimal(4), displayOrder: 4 },
    ]
  );

  // Pakiet firmowy / Inne
  const inneTemplate = createdTemplates[4];
  await createPackageWithCategories(
    inneTemplate.id,
    'Pakiet Business',
    'Menu na event biznesowy',
    new Decimal(180),
    new Decimal(0),
    new Decimal(0),
    [
      { category: 'SOUP' as DishCategory, minSelect: new Decimal(0.5), maxSelect: new Decimal(1), displayOrder: 1 },
      { category: 'MAIN_COURSE' as DishCategory, minSelect: new Decimal(1), maxSelect: new Decimal(2), displayOrder: 2 },
      { category: 'SIDE_DISH' as DishCategory, minSelect: new Decimal(1.5), maxSelect: new Decimal(2.5), displayOrder: 3 },
      { category: 'SALAD' as DishCategory, minSelect: new Decimal(1), maxSelect: new Decimal(2), displayOrder: 4 },
      { category: 'DESSERT' as DishCategory, minSelect: new Decimal(0.5), maxSelect: new Decimal(1.5), displayOrder: 5 },
    ]
  );

  console.log('\n✅ Seed completed!');
}

async function createPackageWithCategories(
  templateId: string,
  name: string,
  description: string,
  priceAdult: Decimal,
  priceChild: Decimal,
  priceToddler: Decimal,
  categories: {
    category: DishCategory;
    minSelect: Decimal;
    maxSelect: Decimal;
    displayOrder: number;
  }[]
) {
  const pkg = await prisma.menuPackage.create({
    data: {
      menuTemplateId: templateId,
      name,
      description,
      pricePerAdult: priceAdult,
      pricePerChild: priceChild,
      pricePerToddler: priceToddler,
      includedItems: [],
    },
  });

  for (const cat of categories) {
    await prisma.packageCategorySettings.create({
      data: {
        packageId: pkg.id,
        category: cat.category,
        minSelect: cat.minSelect,
        maxSelect: cat.maxSelect,
        displayOrder: cat.displayOrder,
        isRequired: true,
        isEnabled: true,
      },
    });
  }

  console.log(`  ✅ ${name} (${categories.length} categories)`);
}

if (require.main === module) {
  seedMenuTemplatesAndPackages()
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
