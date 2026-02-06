import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting database seeding...')

  // Clear existing data
  await prisma.reservationHistory.deleteMany()
  await prisma.deposit.deleteMany()
  await prisma.reservation.deleteMany()
  await prisma.client.deleteMany()
  await prisma.hall.deleteMany()
  await prisma.eventType.deleteMany()
  await prisma.user.deleteMany()

  console.log('Cleared existing data')

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10)
  const admin = await prisma.user.create({
    data: {
      email: 'admin@gosciniecrodzinny.pl',
      password: adminPassword,
      firstName: 'Admin',
      lastName: 'System',
      role: 'ADMIN',
      isActive: true,
    },
  })

  console.log('Created admin user')

  // Create event types
  const eventTypes = await Promise.all([
    prisma.eventType.create({
      data: {
        name: 'Wesele',
        description: 'Przyjęcie weselne',
        color: '#10b981',
        isActive: true,
      },
    }),
    prisma.eventType.create({
      data: {
        name: 'Urodziny',
        description: 'Impreza urodzinowa',
        color: '#3b82f6',
        isActive: true,
      },
    }),
    prisma.eventType.create({
      data: {
        name: 'Komunia',
        description: 'Przyjęcie komunijne',
        color: '#8b5cf6',
        isActive: true,
      },
    }),
    prisma.eventType.create({
      data: {
        name: 'Chrzciny',
        description: 'Przyjęcie chrzciny',
        color: '#ec4899',
        isActive: true,
      },
    }),
    prisma.eventType.create({
      data: {
        name: 'Konferencja',
        description: 'Wydarzenie biznesowe',
        color: '#f59e0b',
        isActive: true,
      },
    }),
    prisma.eventType.create({
      data: {
        name: 'Inne',
        description: 'Inne wydarzenie',
        color: '#6b7280',
        isActive: true,
      },
    }),
  ])

  console.log('Created event types')

  // Create halls
  const halls = await Promise.all([
    prisma.hall.create({
      data: {
        name: 'Sala Główna',
        capacity: 150,
        pricePerPerson: 120,
        description: 'Przestronna sala na duże imprezy',
        amenities: ['Klimatyzacja', 'Nagłośnienie', 'Parkiet taneczny', 'Oświetlenie LED'],
        images: [],
        isActive: true,
      },
    }),
    prisma.hall.create({
      data: {
        name: 'Sala Bankietowa',
        capacity: 100,
        pricePerPerson: 100,
        description: 'Elegancka sala na przyjęcia',
        amenities: ['Klimatyzacja', 'Nagłośnienie', 'Taras'],
        images: [],
        isActive: true,
      },
    }),
    prisma.hall.create({
      data: {
        name: 'Sala Kameralna',
        capacity: 50,
        pricePerPerson: 90,
        description: 'Kameralna sala na małe imprezy',
        amenities: ['Klimatyzacja', 'Projektor'],
        images: [],
        isActive: true,
      },
    }),
  ])

  console.log('Created halls')

  // Create clients
  const clients = await Promise.all([
    prisma.client.create({
      data: {
        firstName: 'Jan',
        lastName: 'Kowalski',
        email: 'jan.kowalski@example.com',
        phone: '+48 123 456 789',
        address: 'ul. Kwiatowa 15, 40-001 Katowice',
        notes: 'Stały klient, preferencje: catering wegetariański',
      },
    }),
    prisma.client.create({
      data: {
        firstName: 'Anna',
        lastName: 'Nowak',
        email: 'anna.nowak@example.com',
        phone: '+48 987 654 321',
        address: 'ul. Słoneczna 22, 40-002 Katowice',
      },
    }),
    prisma.client.create({
      data: {
        firstName: 'Piotr',
        lastName: 'Wiśniewski',
        email: 'piotr.wisniewski@example.com',
        phone: '+48 555 123 456',
        address: 'ul. Leśna 8, 40-003 Katowice',
      },
    }),
    prisma.client.create({
      data: {
        firstName: 'Maria',
        lastName: 'Wójcik',
        email: 'maria.wojcik@example.com',
        phone: '+48 600 111 222',
        address: 'ul. Parkowa 12, 40-004 Katowice',
      },
    }),
    prisma.client.create({
      data: {
        firstName: 'Tomasz',
        lastName: 'Kamiński',
        email: 'tomasz.kaminski@example.com',
        phone: '+48 601 222 333',
        address: 'ul. Zielona 5, 40-005 Katowice',
      },
    }),
    prisma.client.create({
      data: {
        firstName: 'Katarzyna',
        lastName: 'Lewandowska',
        email: 'katarzyna.lewandowska@example.com',
        phone: '+48 602 333 444',
        address: 'ul. Różana 18, 40-006 Katowice',
      },
    }),
    prisma.client.create({
      data: {
        firstName: 'Andrzej',
        lastName: 'Zieliński',
        email: 'andrzej.zielinski@example.com',
        phone: '+48 603 444 555',
        address: 'ul. Długa 25, 40-007 Katowice',
      },
    }),
    prisma.client.create({
      data: {
        firstName: 'Magdalena',
        lastName: 'Szymańska',
        email: 'magdalena.szymanska@example.com',
        phone: '+48 604 555 666',
        address: 'ul. Krótka 7, 40-008 Katowice',
      },
    }),
  ])

  console.log('Created clients')

  // Create reservations
  const today = new Date()
  const nextWeek = new Date(today)
  nextWeek.setDate(today.getDate() + 7)
  const nextMonth = new Date(today)
  nextMonth.setMonth(today.getMonth() + 1)

  const reservation1 = await prisma.reservation.create({
    data: {
      hallId: halls[0].id,
      clientId: clients[0].id,
      eventTypeId: eventTypes[0].id,
      date: nextMonth.toISOString().split('T')[0],
      startTime: '18:00',
      endTime: '03:00',
      guests: 120,
      totalPrice: 14400,
      status: 'CONFIRMED',
      notes: 'Menu premium, dekoracje kwiatowe',
      createdById: admin.id,
    },
  })

  // Add deposit for reservation 1
  await prisma.deposit.create({
    data: {
      reservationId: reservation1.id,
      amount: 5000,
      dueDate: nextWeek.toISOString().split('T')[0],
      paid: true,
      paidAt: new Date(),
    },
  })

  // Add history for reservation 1
  await prisma.reservationHistory.create({
    data: {
      reservationId: reservation1.id,
      changeType: 'CREATED',
      changedByUserId: admin.id,
    },
  })

  await prisma.reservationHistory.create({
    data: {
      reservationId: reservation1.id,
      changeType: 'STATUS_CHANGED',
      changedByUserId: admin.id,
      oldValue: 'PENDING',
      newValue: 'CONFIRMED',
      reason: 'Zaliczka została opłacona',
    },
  })

  const reservation2 = await prisma.reservation.create({
    data: {
      hallId: halls[1].id,
      clientId: clients[1].id,
      eventTypeId: eventTypes[1].id,
      date: nextWeek.toISOString().split('T')[0],
      startTime: '16:00',
      endTime: '22:00',
      guests: 60,
      totalPrice: 6000,
      status: 'PENDING',
      notes: 'Urodziny 18-stki, dyskoteka',
      createdById: admin.id,
    },
  })

  await prisma.deposit.create({
    data: {
      reservationId: reservation2.id,
      amount: 2000,
      dueDate: today.toISOString().split('T')[0],
      paid: false,
    },
  })

  await prisma.reservationHistory.create({
    data: {
      reservationId: reservation2.id,
      changeType: 'CREATED',
      changedByUserId: admin.id,
    },
  })

  const reservation3 = await prisma.reservation.create({
    data: {
      hallId: halls[2].id,
      clientId: clients[2].id,
      eventTypeId: eventTypes[2].id,
      date: new Date(today.setDate(today.getDate() + 14)).toISOString().split('T')[0],
      startTime: '14:00',
      endTime: '20:00',
      guests: 40,
      totalPrice: 3600,
      status: 'CONFIRMED',
      notes: 'Komunia święta, menu dla dzieci',
      createdById: admin.id,
    },
  })

  await prisma.reservationHistory.create({
    data: {
      reservationId: reservation3.id,
      changeType: 'CREATED',
      changedByUserId: admin.id,
    },
  })

  console.log('Created reservations with deposits and history')

  console.log('\n✅ Database seeding completed successfully!')
  console.log('\nTest accounts:')
  console.log('Admin: admin@gosciniecrodzinny.pl / admin123')
  console.log('\nCreated:')
  console.log(`- ${eventTypes.length} event types`)
  console.log(`- ${halls.length} halls`)
  console.log(`- ${clients.length} clients`)
  console.log(`- 3 reservations with deposits and history`)
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
