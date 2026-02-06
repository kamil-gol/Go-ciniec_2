/**
 * Seed Script - Generate Realistic Reservations
 * 
 * This script clears existing reservations and generates new, realistic test data
 * Usage: node scripts/seed-reservations.js
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🗑️  Clearing existing data...');
  
  // Delete deposits first (foreign key constraint)
  await prisma.deposit.deleteMany({});
  console.log('✅ Deleted deposits');
  
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
  
  // Helper to calculate price
  const calculatePrice = (guests, pricePerPerson) => {
    return guests * parseFloat(pricePerPerson.toString());
  };
  
  // Reservation 1: Wedding in Sala Bankietowa
  const salaBankietowa = halls.find(h => h.name === 'Sala Bankietowa');
  const wesele = eventTypes.find(e => e.name === 'Wesele');
  if (salaBankietowa && wesele && clients[0]) {
    const reservation = await prisma.reservation.create({
      data: {
        hallId: salaBankietowa.id,
        clientId: clients[0].id,
        eventTypeId: wesele.id,
        createdById: adminUser.id,
        date: '2026-07-20',
        startTime: '16:00',
        endTime: '23:59',
        guests: 130,
        totalPrice: calculatePrice(130, salaBankietowa.pricePerPerson),
        status: 'CONFIRMED',
        notes: 'Wesele z orkiestrą, menu premium, tort weselny, dekoracja kwiatowa'
      }
    });
    
    // Create deposit
    await prisma.deposit.create({
      data: {
        reservationId: reservation.id,
        amount: 10000,
        dueDate: '2026-06-20',
        paid: true,
        paidAt: new Date('2026-06-15'),
        paymentMethod: 'transfer'
      }
    });
    
    reservations.push(reservation);
    console.log('✓ Created: Wedding reservation (CONFIRMED) with deposit');
  }
  
  // Reservation 2: First Communion in Sala Złota
  const salaZlota = halls.find(h => h.name === 'Sala Złota');
  const komunia = eventTypes.find(e => e.name === 'Komunia');
  if (salaZlota && komunia && clients[1]) {
    const reservation = await prisma.reservation.create({
      data: {
        hallId: salaZlota.id,
        clientId: clients[1].id,
        eventTypeId: komunia.id,
        createdById: adminUser.id,
        date: '2026-05-10',
        startTime: '13:00',
        endTime: '19:00',
        guests: 70,
        totalPrice: calculatePrice(70, salaZlota.pricePerPerson),
        status: 'CONFIRMED',
        notes: 'Menu dla dzieci, animacje, dekoracja biało-złota, tort komunijny'
      }
    });
    
    // Create deposit
    await prisma.deposit.create({
      data: {
        reservationId: reservation.id,
        amount: 5000,
        dueDate: '2026-04-10',
        paid: true,
        paidAt: new Date('2026-04-05'),
        paymentMethod: 'cash'
      }
    });
    
    reservations.push(reservation);
    console.log('✓ Created: First Communion reservation (CONFIRMED) with deposit');
  }
  
  // Reservation 3: Birthday Party in Sala Krysztalowa
  const salaKrysztalowa = halls.find(h => h.name === 'Sala Krysztalowa');
  const urodziny = eventTypes.find(e => e.name === 'Urodziny');
  if (salaKrysztalowa && urodziny && clients[0]) {
    const reservation = await prisma.reservation.create({
      data: {
        hallId: salaKrysztalowa.id,
        clientId: clients[0].id,
        eventTypeId: urodziny.id,
        createdById: adminUser.id,
        date: '2026-03-15',
        startTime: '18:00',
        endTime: '22:00',
        guests: 35,
        totalPrice: calculatePrice(35, salaKrysztalowa.pricePerPerson),
        status: 'PENDING',
        notes: '50. urodziny, tort urodzinowy, DJ, menu premium'
      }
    });
    
    // Create unpaid deposit
    await prisma.deposit.create({
      data: {
        reservationId: reservation.id,
        amount: 2000,
        dueDate: '2026-02-15',
        paid: false
      }
    });
    
    reservations.push(reservation);
    console.log('✓ Created: Birthday Party reservation (PENDING) with unpaid deposit');
  }
  
  // Reservation 4: Conference in Sala Bankietowa
  const konferencja = eventTypes.find(e => e.name === 'Konferencja');
  if (salaBankietowa && konferencja && clients[1]) {
    const reservation = await prisma.reservation.create({
      data: {
        hallId: salaBankietowa.id,
        clientId: clients[1].id,
        eventTypeId: konferencja.id,
        createdById: adminUser.id,
        date: '2026-09-05',
        startTime: '09:00',
        endTime: '17:00',
        guests: 100,
        totalPrice: calculatePrice(100, salaBankietowa.pricePerPerson),
        status: 'PENDING',
        notes: 'Konferencja biznesowa, projektor, nagłośnienie, lunch, coffee breaks'
      }
    });
    
    reservations.push(reservation);
    console.log('✓ Created: Conference reservation (PENDING) - no deposit');
  }
  
  // Reservation 5: Anniversary in Sala Złota
  const rocznica = eventTypes.find(e => e.name === 'Rocznica');
  if (salaZlota && rocznica && clients[0]) {
    const reservation = await prisma.reservation.create({
      data: {
        hallId: salaZlota.id,
        clientId: clients[0].id,
        eventTypeId: rocznica.id,
        createdById: adminUser.id,
        date: '2026-08-12',
        startTime: '17:00',
        endTime: '23:00',
        guests: 60,
        totalPrice: calculatePrice(60, salaZlota.pricePerPerson),
        status: 'CONFIRMED',
        notes: '25. rocznica ślubu, menu eleganckie, dekoracje złote, live music'
      }
    });
    
    // Create deposit
    await prisma.deposit.create({
      data: {
        reservationId: reservation.id,
        amount: 4000,
        dueDate: '2026-07-12',
        paid: true,
        paidAt: new Date('2026-07-10'),
        paymentMethod: 'card'
      }
    });
    
    reservations.push(reservation);
    console.log('✓ Created: Anniversary reservation (CONFIRMED) with deposit');
  }
  
  console.log('\n✅ Successfully generated reservations!');
  console.log('📋 Summary:');
  console.log(`   Total reservations created: ${reservations.length}`);
  console.log(`   Confirmed: ${reservations.filter(r => r.status === 'CONFIRMED').length}`);
  console.log(`   Pending: ${reservations.filter(r => r.status === 'PENDING').length}`);
  console.log('\n💡 Reservations include:');
  console.log('   - Correct date/time string formats');
  console.log('   - Proper pricing calculations');
  console.log('   - Separate Deposit records');
  console.log('   - Realistic payment statuses');
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
