import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function seedE2ETestData() {
  console.log('🧪 Starting E2E test data seeding...\n');

  // Clean up in correct order (respecting foreign keys)
  console.log('🗑️  Cleaning existing data (respecting FK constraints)...');
  await prisma.reservationMenuSnapshot.deleteMany({});
  await prisma.reservationHistory.deleteMany({});
  await prisma.deposit.deleteMany({});
  await prisma.reservation.deleteMany({});
  await prisma.client.deleteMany({});
  await prisma.hall.deleteMany({});
  await prisma.user.deleteMany({});
  console.log('   ✅ Cleanup complete');

  // 1. HALLS
  console.log('\n🏛️  Seeding Halls...');
  const halls = [
    { name: 'Sala Kryształowa', capacity: 200, description: 'Elegancka sala z kryształowymi żyrandolami', isActive: true },
    { name: 'Sala Taneczna', capacity: 150, description: 'Sala z dużym parkietem tanecznym', isActive: true },
    { name: 'Sala Złota', capacity: 100, description: 'Kameralna sala w złotych tonach', isActive: true },
    { name: 'Cały obiekt', capacity: 500, description: 'Wynajem całego obiektu', isActive: true },
    { name: 'Strzecha 1', capacity: 80, description: 'Sala w stylu ludowym', isActive: true },
    { name: 'Strzecha 2', capacity: 80, description: 'Sala w stylu ludowym', isActive: true },
  ];

  const createdHalls = await Promise.all(
    halls.map(hall => prisma.hall.create({ data: hall }))
  );
  console.log(`   ✅ Created ${createdHalls.length} halls`);

  // 2. USERS
  console.log('\n👥 Seeding Users...');
  
  const users = [
    {
      email: 'admin@gosciniecrodzinny.pl',
      password: await bcrypt.hash('Admin123!@#', 10),
      firstName: 'Admin',
      lastName: 'Główny',
      role: 'ADMIN',
      isActive: true,
    },
    {
      email: 'pracownik1@gosciniecrodzinny.pl',
      password: await bcrypt.hash('Pracownik123!', 10),
      firstName: 'Anna',
      lastName: 'Kowalska',
      role: 'EMPLOYEE',
      isActive: true,
    },
    {
      email: 'pracownik2@gosciniecrodzinny.pl',
      password: await bcrypt.hash('Pracownik123!', 10),
      firstName: 'Jan',
      lastName: 'Nowak',
      role: 'EMPLOYEE',
      isActive: true,
    },
  ];

  const createdUsers = await Promise.all(
    users.map(user => prisma.user.create({ data: user }))
  );
  console.log(`   ✅ Created ${createdUsers.length} users`);

  // 3. CLIENTS
  console.log('\n👤 Seeding Clients...');
  
  const clients = [
    {
      firstName: 'Marek',
      lastName: 'Kowalski',
      email: 'marek.kowalski@example.com',
      phone: '+48501234567',
      notes: 'Stały klient, preferencje: menu wegetariańskie',
    },
    {
      firstName: 'Anna',
      lastName: 'Nowak',
      email: 'anna.nowak@example.com',
      phone: '+48502345678',
      notes: 'Organizuje wesele w czerwcu',
    },
    {
      firstName: 'Piotr',
      lastName: 'Wiśniewski',
      email: 'piotr.wisniewski@example.com',
      phone: '+48503456789',
      notes: null,
    },
    {
      firstName: 'Katarzyna',
      lastName: 'Dąbrowska',
      email: 'katarzyna.dabrowska@example.com',
      phone: '+48504567890',
      notes: 'Komunia syna w maju',
    },
    {
      firstName: 'Michał',
      lastName: 'Lewandowski',
      email: 'michal.lewandowski@example.com',
      phone: '+48505678901',
      notes: 'Event firmowy',
    },
  ];

  const createdClients = await Promise.all(
    clients.map(client => prisma.client.create({ data: client }))
  );
  console.log(`   ✅ Created ${createdClients.length} clients`);

  // 4. RESERVATIONS
  console.log('\n📅 Seeding Reservations...');
  
  const adminUser = createdUsers[0];
  const weselleEvent = await prisma.eventType.findFirst({ where: { name: 'Wesele' } });
  const komuniaEvent = await prisma.eventType.findFirst({ where: { name: 'Komunia' } });
  const urodzinyEvent = await prisma.eventType.findFirst({ where: { name: 'Urodziny' } });
  const inneEvent = await prisma.eventType.findFirst({ where: { name: 'Inne' } });

  const reservations = [
    {
      clientId: createdClients[0].id,
      createdById: adminUser.id,
      hallId: createdHalls[0].id,
      eventTypeId: weselleEvent?.id,
      date: '2026-06-20',
      startTime: '18:00',
      endTime: '02:00',
      adults: 120,
      children: 15,
      toddlers: 5,
      guests: 140,
      pricePerAdult: 200,
      pricePerChild: 130,
      pricePerToddler: 60,
      totalPrice: 26850,
      status: 'RESERVED',
      notes: 'Wesele Marek i Agnieszka - preferencje: muzyka na żywo',
    },
    {
      clientId: createdClients[1].id,
      createdById: adminUser.id,
      hallId: createdHalls[1].id,
      eventTypeId: weselleEvent?.id,
      date: '2026-07-15',
      startTime: '17:00',
      endTime: '01:00',
      adults: 100,
      children: 20,
      toddlers: 10,
      guests: 130,
      pricePerAdult: 150,
      pricePerChild: 100,
      pricePerToddler: 50,
      totalPrice: 17500,
      status: 'CONFIRMED',
      notes: 'Wesele Anna i Tomasz',
    },
    {
      clientId: createdClients[2].id,
      createdById: adminUser.id,
      hallId: createdHalls[2].id,
      eventTypeId: komuniaEvent?.id,
      date: '2026-05-10',
      startTime: '14:00',
      endTime: '20:00',
      adults: 60,
      children: 25,
      toddlers: 5,
      guests: 90,
      pricePerAdult: 120,
      pricePerChild: 80,
      pricePerToddler: 40,
      totalPrice: 9600,
      status: 'RESERVED',
      notes: 'Komunia Święta Kacpra',
    },
    {
      clientId: createdClients[3].id,
      createdById: adminUser.id,
      hallId: createdHalls[4].id,
      eventTypeId: urodzinyEvent?.id,
      date: '2026-04-25',
      startTime: '16:00',
      endTime: '22:00',
      adults: 50,
      children: 10,
      toddlers: 0,
      guests: 60,
      pricePerAdult: 130,
      pricePerChild: 90,
      pricePerToddler: 0,
      totalPrice: 7400,
      status: 'RESERVED',
      notes: '50-te urodziny',
    },
    {
      clientId: createdClients[4].id,
      createdById: adminUser.id,
      hallId: createdHalls[3].id,
      eventTypeId: inneEvent?.id,
      date: '2026-03-15',
      startTime: '12:00',
      endTime: '18:00',
      adults: 80,
      children: 0,
      toddlers: 0,
      guests: 80,
      pricePerAdult: 180,
      pricePerChild: 0,
      pricePerToddler: 0,
      totalPrice: 14400,
      status: 'CONFIRMED',
      notes: 'Event firmowy - szkolenie + bankiet',
    },
    {
      clientId: createdClients[0].id,
      createdById: adminUser.id,
      hallId: createdHalls[1].id,
      eventTypeId: weselleEvent?.id,
      date: '2026-02-20',
      startTime: '18:00',
      endTime: '02:00',
      adults: 90,
      children: 10,
      toddlers: 5,
      guests: 105,
      pricePerAdult: 150,
      pricePerChild: 100,
      pricePerToddler: 50,
      totalPrice: 14750,
      status: 'COMPLETED',
      notes: 'Wesele Magda i Łukasz - zakończone',
    },
  ];

  const createdReservations = await Promise.all(
    reservations.map(reservation => prisma.reservation.create({ data: reservation }))
  );
  console.log(`   ✅ Created ${createdReservations.length} reservations`);

  // 5. DEPOSITS
  console.log('\n💰 Seeding Deposits...');
  
  const deposits = [
    {
      reservationId: createdReservations[0].id,
      amount: 5000,
      dueDate: '2026-05-20',
      status: 'PAID',
      paid: true,
      paidAt: new Date('2026-03-15'),
      paymentMethod: 'TRANSFER',
    },
    {
      reservationId: createdReservations[1].id,
      amount: 3500,
      dueDate: '2026-06-15',
      status: 'PAID',
      paid: true,
      paidAt: new Date('2026-04-10'),
      paymentMethod: 'TRANSFER',
    },
    {
      reservationId: createdReservations[2].id,
      amount: 2000,
      dueDate: '2026-04-10',
      status: 'PAID',
      paid: true,
      paidAt: new Date('2026-03-05'),
      paymentMethod: 'CASH',
    },
    {
      reservationId: createdReservations[4].id,
      amount: 3000,
      dueDate: '2026-02-15',
      status: 'PAID',
      paid: true,
      paidAt: new Date('2026-01-20'),
      paymentMethod: 'TRANSFER',
    },
    {
      reservationId: createdReservations[5].id,
      amount: 3000,
      dueDate: '2026-01-20',
      status: 'PAID',
      paid: true,
      paidAt: new Date('2026-01-10'),
      paymentMethod: 'TRANSFER',
    },
  ];

  const createdDeposits = await Promise.all(
    deposits.map(deposit => prisma.deposit.create({ data: deposit }))
  );
  console.log(`   ✅ Created ${createdDeposits.length} deposits`);

  console.log('\n✅ E2E test data seeding completed!\n');
  
  console.log('📊 Summary:');
  console.log(`   🏛️  Halls: ${createdHalls.length}`);
  console.log(`   👥 Users: ${createdUsers.length}`);
  console.log(`   👤 Clients: ${createdClients.length}`);
  console.log(`   📅 Reservations: ${createdReservations.length}`);
  console.log(`   💰 Deposits: ${createdDeposits.length}`);
  console.log('');
  
  return {
    halls: createdHalls,
    users: createdUsers,
    clients: createdClients,
    reservations: createdReservations,
    deposits: createdDeposits,
  };
}

if (require.main === module) {
  seedE2ETestData()
    .then(() => {
      console.log('✅ Seed completed successfully!');
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
