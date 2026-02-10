/**
 * Event Types Seed
 * 
 * Creates basic event types for the system
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface EventTypeData {
  name: string;
  description: string;
  color: string;
  isActive: boolean;
}

const eventTypes: EventTypeData[] = [
  {
    name: 'Wesele',
    description: 'Przyjęcie weselne',
    color: '#EC4899',
    isActive: true,
  },
  {
    name: 'Urodziny',
    description: 'Przyjęcie urodzinowe',
    color: '#F59E0B',
    isActive: true,
  },
  {
    name: 'Chrzciny',
    description: 'Przyjęcie chrzciny',
    color: '#3B82F6',
    isActive: true,
  },
  {
    name: 'Komunia',
    description: 'Przyjęcie komunijne',
    color: '#FBBF24',
    isActive: true,
  },
  {
    name: 'Rocznica',
    description: 'Rocznica ślubu',
    color: '#F43F5E',
    isActive: true,
  },
  {
    name: 'Wydarzenie firmowe',
    description: 'Wydarzenia biznesowe i firmowe',
    color: '#374151',
    isActive: true,
  },
  {
    name: 'Inne',
    description: 'Inne wydarzenia',
    color: '#6B7280',
    isActive: true,
  },
];

async function main() {
  console.log('🌱 Seeding event types...');

  let created = 0;
  let skipped = 0;

  for (const typeData of eventTypes) {
    // Check if event type already exists
    const existing = await prisma.eventType.findFirst({
      where: { name: typeData.name },
    });

    if (existing) {
      skipped++;
      continue;
    }

    // Create event type
    await prisma.eventType.create({
      data: typeData,
    });

    created++;
  }

  const total = await prisma.eventType.count();

  console.log('\n✅ Seed complete!');
  console.log(`   Created: ${created} event types`);
  console.log(`   Skipped: ${skipped} event types (already exist)`);
  console.log(`   Total in database: ${total}`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding event types:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
