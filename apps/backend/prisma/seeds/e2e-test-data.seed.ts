import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function seedE2ETestData() {
  // ⚠️ SECURITY: Block in production to prevent test accounts with known passwords
  if (process.env.NODE_ENV === 'production') {
    console.warn('⚠️  seedE2ETestData() skipped — not allowed in production');
    console.warn('   Set NODE_ENV=development to seed test data');
    return {
      halls: [],
      users: [],
      clients: [],
      reservations: [],
      deposits: [],
    };
  }

  console.log('\ud83e\uddea Starting E2E test data seeding...\n');

  // Clean up in correct order (respecting foreign keys)
  console.log('\ud83d\uddd1\ufe0f  Cleaning existing data (respecting FK constraints)...');
  await prisma.reservationMenuSnapshot.deleteMany({});
  await prisma.reservationHistory.deleteMany({});
  await prisma.depositPayment.deleteMany({});
  await prisma.deposit.deleteMany({});
  await prisma.reservation.deleteMany({});
  await prisma.client.deleteMany({});
  await prisma.hall.deleteMany({});
  // Delete attachments BEFORE users (Attachment.uploadedById → User.id)
  await prisma.attachment.deleteMany({});
  await prisma.user.deleteMany({});
  console.log('   \u2705 Cleanup complete');

  // Look up RBAC roles (created by rbac.seed.ts which runs before this)
  const adminRole = await prisma.role.findUnique({ where: { slug: 'admin' } });
  const employeeRole = await prisma.role.findUnique({ where: { slug: 'employee' } });

  // 1. HALLS
  console.log('\n\ud83c\udfdb\ufe0f  Seeding Halls...');
  const halls = [
    { name: 'Sala Kryszta\u0142owa', capacity: 200, description: 'Elegancka sala z kryszta\u0142owymi \u017cyrandolami', isActive: true },
    { name: 'Sala Taneczna', capacity: 150, description: 'Sala z du\u017cym parkietem tanecznym', isActive: true },
    { name: 'Sala Z\u0142ota', capacity: 100, description: 'Kameralna sala w z\u0142otych tonach', isActive: true },
    { name: 'Ca\u0142y obiekt', capacity: 500, description: 'Wynajem ca\u0142ego obiektu', isActive: true },
    { name: 'Strzecha 1', capacity: 80, description: 'Sala w stylu ludowym', isActive: true },
    { name: 'Strzecha 2', capacity: 80, description: 'Sala w stylu ludowym', isActive: true },
  ];

  const createdHalls = await Promise.all(
    halls.map(hall => prisma.hall.create({ data: hall }))
  );
  console.log(`   \u2705 Created ${createdHalls.length} halls`);

  // 2. USERS
  // 🔒 SECURITY: Read passwords from env variables with dev-only fallbacks
  console.log('\n\ud83d\udc65 Seeding Users...');

  const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'Admin123!@#';
  const employeePassword = process.env.SEED_EMPLOYEE_PASSWORD || 'Pracownik123!';

  if (!process.env.SEED_ADMIN_PASSWORD) {
    console.warn('   \u26a0\ufe0f  SEED_ADMIN_PASSWORD not set — using default dev password');
  }

  const usersData = [
    {
      email: 'admin@gosciniecrodzinny.pl',
      password: await bcrypt.hash(adminPassword, 12),
      firstName: 'Admin',
      lastName: 'G\u0142\u00f3wny',
      legacyRole: 'ADMIN',
      roleId: adminRole?.id ?? null,
      isActive: true,
    },
    {
      email: 'pracownik1@gosciniecrodzinny.pl',
      password: await bcrypt.hash(employeePassword, 12),
      firstName: 'Anna',
      lastName: 'Kowalska',
      legacyRole: 'EMPLOYEE',
      roleId: employeeRole?.id ?? null,
      isActive: true,
    },
    {
      email: 'pracownik2@gosciniecrodzinny.pl',
      password: await bcrypt.hash(employeePassword, 12),
      firstName: 'Jan',
      lastName: 'Nowak',
      legacyRole: 'EMPLOYEE',
      roleId: employeeRole?.id ?? null,
      isActive: true,
    },
  ];

  const createdUsers = await Promise.all(
    usersData.map(user => prisma.user.create({ data: user }))
  );
  console.log(`   \u2705 Created ${createdUsers.length} users`);
  if (adminRole) {
    console.log(`   \ud83d\udee1\ufe0f  Roles assigned: admin=${adminRole.name}, employee=${employeeRole?.name}`);
  } else {
    console.log('   \u26a0\ufe0f  RBAC roles not found \u2014 users created without roleId (run rbac seed first)');
  }
  // 🔒 SECURITY: Do NOT log passwords to console

  // 3. CLIENTS
  console.log('\n\ud83d\udc64 Seeding Clients...');

  const clients = [
    {
      firstName: 'Marek',
      lastName: 'Kowalski',
      email: 'marek.kowalski@example.com',
      phone: '+48501234567',
      notes: 'Sta\u0142y klient, preferencje: menu wegetaria\u0144skie',
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
      lastName: 'Wi\u015bniewski',
      email: 'piotr.wisniewski@example.com',
      phone: '+48503456789',
      notes: null,
    },
    {
      firstName: 'Katarzyna',
      lastName: 'D\u0105browska',
      email: 'katarzyna.dabrowska@example.com',
      phone: '+48504567890',
      notes: 'Komunia syna w maju',
    },
    {
      firstName: 'Micha\u0142',
      lastName: 'Lewandowski',
      email: 'michal.lewandowski@example.com',
      phone: '+48505678901',
      notes: 'Event firmowy',
    },
  ];

  const createdClients = await Promise.all(
    clients.map(client => prisma.client.create({ data: client }))
  );
  console.log(`   \u2705 Created ${createdClients.length} clients`);

  // 4. RESERVATIONS
  console.log('\n\ud83d\udcc5 Seeding Reservations...');

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
      reservationQueueDate: new Date('2026-06-20'),
      reservationQueuePosition: 1,
      notes: 'Wesele Marek i Agnieszka - preferencje: muzyka na \u017cywo',
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
      reservationQueueDate: new Date('2026-05-10'),
      reservationQueuePosition: 1,
      notes: 'Komunia \u015awi\u0119ta Kacpra',
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
      reservationQueueDate: new Date('2026-04-25'),
      reservationQueuePosition: 1,
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
      notes: 'Wesele Magda i \u0141ukasz - zako\u0144czone',
    },
  ];

  const createdReservations = await Promise.all(
    reservations.map(reservation => prisma.reservation.create({ data: reservation }))
  );
  console.log(`   \u2705 Created ${createdReservations.length} reservations`);

  // 5. DEPOSITS
  console.log('\n\ud83d\udcb0 Seeding Deposits...');

  const deposits = [
    {
      reservationId: createdReservations[0].id,
      amount: 5000,
      remainingAmount: 0,
      paidAmount: 5000,
      dueDate: '2026-05-20',
      status: 'PAID',
      paid: true,
      paidAt: new Date('2026-03-15'),
      paymentMethod: 'TRANSFER',
    },
    {
      reservationId: createdReservations[1].id,
      amount: 3500,
      remainingAmount: 0,
      paidAmount: 3500,
      dueDate: '2026-06-15',
      status: 'PAID',
      paid: true,
      paidAt: new Date('2026-04-10'),
      paymentMethod: 'TRANSFER',
    },
    {
      reservationId: createdReservations[2].id,
      amount: 2000,
      remainingAmount: 0,
      paidAmount: 2000,
      dueDate: '2026-04-10',
      status: 'PAID',
      paid: true,
      paidAt: new Date('2026-03-05'),
      paymentMethod: 'CASH',
    },
    {
      reservationId: createdReservations[3].id,
      amount: 1500,
      remainingAmount: 1500,
      paidAmount: 0,
      dueDate: '2026-03-25',
      status: 'PENDING',
      paid: false,
      paidAt: null,
      paymentMethod: null,
    },
    {
      reservationId: createdReservations[4].id,
      amount: 3000,
      remainingAmount: 0,
      paidAmount: 3000,
      dueDate: '2026-02-15',
      status: 'PAID',
      paid: true,
      paidAt: new Date('2026-01-20'),
      paymentMethod: 'TRANSFER',
    },
    {
      reservationId: createdReservations[5].id,
      amount: 3000,
      remainingAmount: 0,
      paidAmount: 3000,
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
  console.log(`   \u2705 Created ${createdDeposits.length} deposits`);

  console.log('\n\u2705 E2E test data seeding completed!\n');

  console.log('\ud83d\udcca Summary:');
  console.log(`   \ud83c\udfdb\ufe0f  Halls: ${createdHalls.length}`);
  console.log(`   \ud83d\udc65 Users: ${createdUsers.length}`);
  console.log(`   \ud83d\udc64 Clients: ${createdClients.length}`);
  console.log(`   \ud83d\udcc5 Reservations: ${createdReservations.length}`);
  console.log(`   \ud83d\udcb0 Deposits: ${createdDeposits.length}`);
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
      console.log('\u2705 Seed completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\u274c Seed failed:', error);
      process.exit(1);
    })
    .finally(() => {
      prisma.$disconnect();
    });
}
