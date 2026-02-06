/**
 * Seed Script - Generate Realistic Reservations
 * 
 * This script clears existing reservations and generates new, realistic test data
 * Usage: npx ts-node scripts/seed-reservations.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🗑️  Clearing existing reservations...');
  
  // Delete all existing reservations
  const deleted = await prisma.reservation.deleteMany({});
  console.log(`✅ Deleted ${deleted.count} reservations`);
  
  // Fetch existing data
  const halls = await prisma.hall.findMany();
  const clients = await prisma.client.findMany();
  const eventTypes = await prisma.eventType.findMany();
  const adminUser = await prisma.user.findFirst({ 
    where: { role: 'ADMIN' }
  });
  
  if (!adminUser) {
    throw new Error('No admin user found. Please create an admin user first.');
  }
  
  if (halls.length === 0 || clients.length === 0 || eventTypes.length === 0) {
    throw new Error('Please seed halls, clients, and event types first.');
  }
  
  console.log('📊 Generating new reservations...');
  console.log(`   Available halls: ${halls.length}`);
  console.log(`   Available clients: ${clients.length}`);
  console.log(`   Available event types: ${eventTypes.length}`);
  
  const reservations = [];
  
  // Helper to create time
  const createTime = (hours: number, minutes: number = 0) => {
    return new Date(`1970-01-01T${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00.000Z`);
  };
  
  // Reservation 1: Wedding in Sala Bankietowa
  const salaBankietowa = halls.find(h => h.name === 'Sala Bankietowa');
  const wesele = eventTypes.find(e => e.name === 'Wesele');
  if (salaBankietowa && wesele && clients[0]) {
    reservations.push(
      await prisma.reservation.create({
        data: {
          hallId: salaBankietowa.id,
          clientId: clients[0].id,
          eventTypeId: wesele.id,
          createdById: adminUser.id,
          date: new Date('2026-07-20'),
          startTime: createTime(16, 0),
          endTime: createTime(23, 59),
          guests: 130,
          totalPrice: 130 * parseFloat(salaBankietowa.pricePerPerson),
          status: 'CONFIRMED',
          depositAmount: 10000,
          depositDueDate: new Date('2026-06-20'),
          depositPaid: true,
          notes: 'Wesele z orkiestrą, menu premium, tort weselny, dekoracja kwiatowa'
        }
      })
    );
    console.log('✓ Created: Wedding reservation (CONFIRMED)');
  }
  
  // Reservation 2: First Communion in Sala Złota
  const salaZlota = halls.find(h => h.name === 'Sala Złota');
  const komunia = eventTypes.find(e => e.name === 'Komunia');
  if (salaZlota && komunia && clients[1]) {
    reservations.push(
      await prisma.reservation.create({
        data: {
          hallId: salaZlota.id,
          clientId: clients[1].id,
          eventTypeId: komunia.id,
          createdById: adminUser.id,
          date: new Date('2026-05-10'),
          startTime: createTime(13, 0),
          endTime: createTime(19, 0),
          guests: 70,
          totalPrice: 70 * parseFloat(salaZlota.pricePerPerson),
          status: 'CONFIRMED',
          depositAmount: 5000,
          depositDueDate: new Date('2026-04-10'),
          depositPaid: true,
          notes: 'Menu dla dzieci, animacje, dekoracja biało-złota, tort komunijny'
        }
      })
    );
    console.log('✓ Created: First Communion reservation (CONFIRMED)');
  }
  
  // Reservation 3: Birthday Party in Sala Krysztalowa
  const salaKrysztalowa = halls.find(h => h.name === 'Sala Krysztalowa');
  const urodziny = eventTypes.find(e => e.name === 'Urodziny');
  if (salaKrysztalowa && urodziny && clients[0]) {
    reservations.push(
      await prisma.reservation.create({
        data: {
          hallId: salaKrysztalowa.id,
          clientId: clients[0].id,
          eventTypeId: urodziny.id,
          createdById: adminUser.id,
          date: new Date('2026-03-15'),
          startTime: createTime(18, 0),
          endTime: createTime(22, 0),
          guests: 35,
          totalPrice: 35 * parseFloat(salaKrysztalowa.pricePerPerson),
          status: 'PENDING',
          depositAmount: 2000,
          depositDueDate: new Date('2026-02-15'),
          depositPaid: false,
          notes: '50. urodziny, tort urodzinowy, DJ, menu premium'
        }
      })
    );
    console.log('✓ Created: Birthday Party reservation (PENDING)');
  }
  
  // Reservation 4: Conference in Sala Bankietowa
  const konferencja = eventTypes.find(e => e.name === 'Konferencja');
  if (salaBankietowa && konferencja && clients[1]) {
    reservations.push(
      await prisma.reservation.create({
        data: {
          hallId: salaBankietowa.id,
          clientId: clients[1].id,
          eventTypeId: konferencja.id,
          createdById: adminUser.id,
          date: new Date('2026-09-05'),
          startTime: createTime(9, 0),
          endTime: createTime(17, 0),
          guests: 100,
          totalPrice: 100 * parseFloat(salaBankietowa.pricePerPerson),
          status: 'PENDING',
          notes: 'Konferencja biznesowa, projektor, nagłośnienie, lunch, coffee breaks'
        }
      })
    );
    console.log('✓ Created: Conference reservation (PENDING)');
  }
  
  // Reservation 5: Anniversary in Sala Złota
  const rocznica = eventTypes.find(e => e.name === 'Rocznica');
  if (salaZlota && rocznica && clients[0]) {
    reservations.push(
      await prisma.reservation.create({
        data: {
          hallId: salaZlota.id,
          clientId: clients[0].id,
          eventTypeId: rocznica.id,
          createdById: adminUser.id,
          date: new Date('2026-08-12'),
          startTime: createTime(17, 0),
          endTime: createTime(23, 0),
          guests: 60,
          totalPrice: 60 * parseFloat(salaZlota.pricePerPerson),
          status: 'CONFIRMED',
          depositAmount: 4000,
          depositDueDate: new Date('2026-07-12'),
          depositPaid: true,
          notes: '25. rocznica ślubu, menu eleganckie, dekoracje złote, live music'
        }
      })
    );
    console.log('✓ Created: Anniversary reservation (CONFIRMED)');
  }
  
  console.log('\n✅ Successfully generated reservations!');
  console.log('📋 Summary:');
  console.log(`   Total reservations created: ${reservations.length}`);
  console.log(`   Confirmed: ${reservations.filter(r => r.status === 'CONFIRMED').length}`);
  console.log(`   Pending: ${reservations.filter(r => r.status === 'PENDING').length}`);
  console.log('\n💡 Reservations include:');
  console.log('   - Realistic dates and times');
  console.log('   - Proper pricing calculations');
  console.log('   - Deposit information');
  console.log('   - Detailed notes');
}

main()
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
