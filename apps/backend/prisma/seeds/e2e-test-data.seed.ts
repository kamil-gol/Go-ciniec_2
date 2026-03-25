import { prisma } from '../lib/prisma.js';
import * as bcrypt from 'bcryptjs';

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
      menuTemplates: [],
      menuPackages: [],
      menuCourses: [],
    };
  }

  console.log('\ud83e\uddea Starting E2E test data seeding...\n');

  // Clean up in correct order (respecting foreign keys)
  console.log('\ud83d\uddd1\ufe0f  Cleaning existing data (respecting FK constraints)...');
  await prisma.activityLog.deleteMany({});
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
  // Clean service extras (child → parent order)
  await prisma.reservationExtra.deleteMany({});
  await prisma.serviceItem.deleteMany({});
  await prisma.serviceCategory.deleteMany({});
  // Clean menu hierarchy (child → parent order)
  await prisma.menuCourseOption.deleteMany({});
  await prisma.menuCourse.deleteMany({});
  await prisma.packageCategorySettings.deleteMany({});
  await prisma.menuPriceHistory.deleteMany({});
  await prisma.menuPackage.deleteMany({});
  await prisma.menuTemplate.deleteMany({});
  console.log('   \u2705 Cleanup complete');

  // Look up RBAC roles (created by rbac.seed.ts which runs before this)
  const adminRole = await prisma.role.findUnique({ where: { slug: 'admin' } });
  const employeeRole = await prisma.role.findUnique({ where: { slug: 'employee' } });

  // 1. HALLS
  console.log('\n\ud83c\udfdb\ufe0f  Seeding Halls...');
  const halls = [
    { name: 'Sala Kryształowa', capacity: 200, description: 'Elegancka sala z kryształowymi żyrandolami', isActive: true },
    { name: 'Sala Taneczna', capacity: 150, description: 'Sala z dużym parkietem tanecznym', isActive: true },
    { name: 'Sala Złota', capacity: 100, description: 'Kameralna sala w złotych tonach', isActive: true },
    { name: 'Cały obiekt', capacity: 500, description: 'Wynajem całego obiektu', isActive: true, isWholeVenue: true },
    { name: 'Strzecha Tył', capacity: 80, description: 'Sala w stylu ludowym — tył', isActive: true, allowWithWholeVenue: true },
    { name: 'Strzecha Przód', capacity: 80, description: 'Sala w stylu ludowym — przód', isActive: true, allowWithWholeVenue: true },
    { name: 'Góra', capacity: 60, description: 'Sala na górze obiektu', isActive: true, allowWithWholeVenue: true },
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
      lastName: 'Główny',
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
      firstName: 'Jan',
      lastName: 'Kowalski',
      email: 'jan.kowalski@example.com',
      phone: '+48500123456',
      notes: 'Klient testowy E2E',
    },
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
      clientId: createdClients[1].id,
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
      notes: 'Wesele Marek i Agnieszka - preferencje: muzyka na żywo',
    },
    {
      clientId: createdClients[2].id,
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
      clientId: createdClients[3].id,
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
      notes: 'Komunia Święta Kacpra',
    },
    {
      clientId: createdClients[4].id,
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
      clientId: createdClients[5].id,
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
      clientId: createdClients[1].id,
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

  // 6. ACTIVITY LOGS (for history.spec.ts)
  console.log('\n📝 Seeding Activity Logs...');

  const activityLogs = [];
  for (const reservation of createdReservations) {
    // CREATE entry for every reservation
    activityLogs.push({
      userId: adminUser.id,
      action: 'CREATE',
      entityType: 'RESERVATION',
      entityId: reservation.id,
      details: {
        description: `Utworzono rezerwację #${reservation.id.slice(0, 8)}`,
        changes: {
          status: { from: null, to: reservation.status },
          guests: reservation.guests,
        },
      },
      ipAddress: '127.0.0.1',
      userAgent: 'E2E-Seed/1.0',
      createdAt: new Date(new Date(reservation.createdAt).getTime() - 60000),
    });

    // UPDATE/STATUS_CHANGE entries for non-RESERVED reservations
    if (reservation.status !== 'RESERVED') {
      activityLogs.push({
        userId: adminUser.id,
        action: 'STATUS_CHANGE',
        entityType: 'RESERVATION',
        entityId: reservation.id,
        details: {
          description: `Zmiana statusu z RESERVED na ${reservation.status}`,
          changes: {
            status: { from: 'RESERVED', to: reservation.status },
          },
        },
        ipAddress: '127.0.0.1',
        userAgent: 'E2E-Seed/1.0',
        createdAt: reservation.createdAt,
      });
    }

    // UPDATE entry with notes
    activityLogs.push({
      userId: adminUser.id,
      action: 'UPDATE',
      entityType: 'RESERVATION',
      entityId: reservation.id,
      details: {
        description: 'Aktualizacja danych rezerwacji',
        changes: {
          notes: { from: null, to: reservation.notes },
        },
      },
      ipAddress: '127.0.0.1',
      userAgent: 'E2E-Seed/1.0',
      createdAt: new Date(new Date(reservation.createdAt).getTime() + 60000),
    });
  }

  await prisma.activityLog.createMany({ data: activityLogs });
  console.log(`   ✅ Created ${activityLogs.length} activity log entries`);

  // 7. MENU TEMPLATES, PACKAGES & COURSES
  console.log('\n🍽️  Seeding Menu Templates, Packages & Courses...');

  // Fixed UUIDs for test stability
  const WESELE_TEMPLATE_ID = 'e2e00000-0000-4000-a000-000000000001';
  const KOMUNIA_TEMPLATE_ID = 'e2e00000-0000-4000-a000-000000000002';
  const WESELE_PKG_ID = 'e2e00000-0000-4000-b000-000000000001';
  const KOMUNIA_PKG_ID = 'e2e00000-0000-4000-b000-000000000002';
  const WESELE_COURSE1_ID = 'e2e00000-0000-4000-c000-000000000001';
  const WESELE_COURSE2_ID = 'e2e00000-0000-4000-c000-000000000002';
  const KOMUNIA_COURSE1_ID = 'e2e00000-0000-4000-c000-000000000003';
  const KOMUNIA_COURSE2_ID = 'e2e00000-0000-4000-c000-000000000004';

  const createdMenuTemplates = [];
  const createdMenuPackages = [];
  const createdMenuCourses = [];

  if (weselleEvent) {
    const weseleTemplate = await prisma.menuTemplate.create({
      data: {
        id: WESELE_TEMPLATE_ID,
        name: 'Wesele',
        description: 'Menu weselne — szablon podstawowy',
        eventTypeId: weselleEvent.id,
        isActive: true,
        displayOrder: 1,
      },
    });
    createdMenuTemplates.push(weseleTemplate);

    const weselePkg = await prisma.menuPackage.create({
      data: {
        id: WESELE_PKG_ID,
        menuTemplateId: weseleTemplate.id,
        name: 'Standard',
        description: 'Pakiet standardowy weselny',
        pricePerAdult: 200,
        pricePerChild: 130,
        pricePerToddler: 60,
        displayOrder: 1,
        includedItems: [],
      },
    });
    createdMenuPackages.push(weselePkg);

    const weseleCourse1 = await prisma.menuCourse.create({
      data: {
        id: WESELE_COURSE1_ID,
        packageId: weselePkg.id,
        name: 'Zupa',
        description: 'Wybór zupy',
        displayOrder: 1,
        minSelect: 1,
        maxSelect: 2,
        isRequired: true,
      },
    });
    const weseleCourse2 = await prisma.menuCourse.create({
      data: {
        id: WESELE_COURSE2_ID,
        packageId: weselePkg.id,
        name: 'Danie główne',
        description: 'Wybór dania głównego',
        displayOrder: 2,
        minSelect: 1,
        maxSelect: 2,
        isRequired: true,
      },
    });
    createdMenuCourses.push(weseleCourse1, weseleCourse2);

    console.log('   \u2705 Template "Wesele" + package "Standard" + 2 courses');
  } else {
    console.warn('   \u26a0\ufe0f  Event type "Wesele" not found — skipping menu template');
  }

  if (komuniaEvent) {
    const komuniaTemplate = await prisma.menuTemplate.create({
      data: {
        id: KOMUNIA_TEMPLATE_ID,
        name: 'Komunia',
        description: 'Menu komunijne — szablon podstawowy',
        eventTypeId: komuniaEvent.id,
        isActive: true,
        displayOrder: 2,
      },
    });
    createdMenuTemplates.push(komuniaTemplate);

    const komuniaPkg = await prisma.menuPackage.create({
      data: {
        id: KOMUNIA_PKG_ID,
        menuTemplateId: komuniaTemplate.id,
        name: 'Standard',
        description: 'Pakiet standardowy komunijny',
        pricePerAdult: 120,
        pricePerChild: 80,
        pricePerToddler: 40,
        displayOrder: 1,
        includedItems: [],
      },
    });
    createdMenuPackages.push(komuniaPkg);

    const komuniaCourse1 = await prisma.menuCourse.create({
      data: {
        id: KOMUNIA_COURSE1_ID,
        packageId: komuniaPkg.id,
        name: 'Zupa',
        description: 'Wybór zupy',
        displayOrder: 1,
        minSelect: 1,
        maxSelect: 1,
        isRequired: true,
      },
    });
    const komuniaCourse2 = await prisma.menuCourse.create({
      data: {
        id: KOMUNIA_COURSE2_ID,
        packageId: komuniaPkg.id,
        name: 'Danie główne',
        description: 'Wybór dania głównego',
        displayOrder: 2,
        minSelect: 1,
        maxSelect: 2,
        isRequired: true,
      },
    });
    createdMenuCourses.push(komuniaCourse1, komuniaCourse2);

    console.log('   \u2705 Template "Komunia" + package "Standard" + 2 courses');
  } else {
    console.warn('   \u26a0\ufe0f  Event type "Komunia" not found — skipping menu template');
  }

  // 8. SERVICE EXTRAS (for menu-calculator and menu-assignment tests)
  console.log('\n🎁 Seeding Service Extras...');

  const drinksCategory = await prisma.serviceCategory.create({
    data: {
      name: 'Napoje',
      slug: 'napoje',
      description: 'Napoje i alkohole',
      displayOrder: 1,
      isActive: true,
    },
  });

  const decorCategory = await prisma.serviceCategory.create({
    data: {
      name: 'Dekoracje',
      slug: 'dekoracje',
      description: 'Dekoracje i aranżacje sali',
      displayOrder: 2,
      isActive: true,
    },
  });

  await prisma.serviceItem.createMany({
    data: [
      {
        name: 'Open Bar Premium',
        categoryId: drinksCategory.id,
        priceType: 'PER_PERSON',
        basePrice: 50,
        description: 'Premium open bar',
        displayOrder: 1,
        isActive: true,
      },
      {
        name: 'Pakiet napojów bezalkoholowych',
        categoryId: drinksCategory.id,
        priceType: 'PER_PERSON',
        basePrice: 25,
        description: 'Woda, soki, napoje',
        displayOrder: 2,
        isActive: true,
      },
      {
        name: 'Dekoracja sali',
        categoryId: decorCategory.id,
        priceType: 'FLAT',
        basePrice: 2000,
        description: 'Pełna dekoracja sali',
        displayOrder: 1,
        isActive: true,
      },
      {
        name: 'Dodatkowy tort',
        categoryId: decorCategory.id,
        priceType: 'PER_ITEM',
        basePrice: 300,
        description: 'Tort piętrowy',
        displayOrder: 2,
        isActive: true,
      },
    ],
  });

  console.log('   ✅ Created 2 categories, 4 service items');

  console.log('\n✅ E2E test data seeding completed!\n');

  console.log('\ud83d\udcca Summary:');
  console.log(`   \ud83c\udfdb\ufe0f  Halls: ${createdHalls.length}`);
  console.log(`   \ud83d\udc65 Users: ${createdUsers.length}`);
  console.log(`   \ud83d\udc64 Clients: ${createdClients.length}`);
  console.log(`   \ud83d\udcc5 Reservations: ${createdReservations.length}`);
  console.log(`   \ud83d\udcb0 Deposits: ${createdDeposits.length}`);
  console.log(`   \ud83c\udf7d\ufe0f  Menu Templates: ${createdMenuTemplates.length}`);
  console.log(`   \ud83d\udce6 Menu Packages: ${createdMenuPackages.length}`);
  console.log(`   \ud83c\udf72 Menu Courses: ${createdMenuCourses.length}`);
  console.log('');

  return {
    halls: createdHalls,
    users: createdUsers,
    clients: createdClients,
    reservations: createdReservations,
    deposits: createdDeposits,
    menuTemplates: createdMenuTemplates,
    menuPackages: createdMenuPackages,
    menuCourses: createdMenuCourses,
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
