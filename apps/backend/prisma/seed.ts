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
        name: 'Rocznica',
        description: 'Rocznica ślubu lub innego wydarzenia',
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

  // Create halls with price per child
  const halls = await Promise.all([
    prisma.hall.create({
      data: {
        name: 'Sala Główna',
        capacity: 150,
        pricePerPerson: 120,
        pricePerChild: 80, // Separate price for children
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
        pricePerChild: 70, // Separate price for children
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
        pricePerChild: 60, // Separate price for children
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

  // Create reservations with new fields
  const today = new Date()
  const nextWeek = new Date(today)
  nextWeek.setDate(today.getDate() + 7)
  const nextMonth = new Date(today)
  nextMonth.setMonth(today.getMonth() + 1)

  // Reservation 1: Wedding with adults and children
  const adults1 = 100
  const children1 = 20
  const pricePerAdult1 = 120
  const pricePerChild1 = 80
  const totalPrice1 = (adults1 * pricePerAdult1) + (children1 * pricePerChild1)

  const reservation1 = await prisma.reservation.create({
    data: {
      hallId: halls[0].id,
      clientId: clients[0].id,
      eventTypeId: eventTypes[0].id,
      startDateTime: new Date(nextMonth.getFullYear(), nextMonth.getMonth(), nextMonth.getDate(), 18, 0),
      endDateTime: new Date(nextMonth.getFullYear(), nextMonth.getMonth(), nextMonth.getDate() + 1, 3, 0),
      adults: adults1,
      children: children1,
      guests: adults1 + children1,
      pricePerAdult: pricePerAdult1,
      pricePerChild: pricePerChild1,
      totalPrice: totalPrice1,
      status: 'CONFIRMED',
      notes: 'Menu premium, dekoracje kwiatowe',
      createdById: admin.id,
    },
  })

  await prisma.deposit.create({
    data: {
      reservationId: reservation1.id,
      amount: 5000,
      dueDate: nextWeek.toISOString().split('T')[0],
      paid: true,
      paidAt: new Date(),
    },
  })

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

  // Reservation 2: Birthday party - PENDING with confirmation deadline
  const adults2 = 40
  const children2 = 20
  const pricePerAdult2 = 100
  const pricePerChild2 = 70
  const totalPrice2 = (adults2 * pricePerAdult2) + (children2 * pricePerChild2)

  const eventDate2 = new Date(nextWeek.getFullYear(), nextWeek.getMonth(), nextWeek.getDate(), 16, 0)
  const confirmDeadline2 = new Date(eventDate2)
  confirmDeadline2.setDate(eventDate2.getDate() - 1) // 1 day before event

  const reservation2 = await prisma.reservation.create({
    data: {
      hallId: halls[1].id,
      clientId: clients[1].id,
      eventTypeId: eventTypes[1].id,
      startDateTime: eventDate2,
      endDateTime: new Date(nextWeek.getFullYear(), nextWeek.getMonth(), nextWeek.getDate(), 22, 0),
      adults: adults2,
      children: children2,
      guests: adults2 + children2,
      pricePerAdult: pricePerAdult2,
      pricePerChild: pricePerChild2,
      totalPrice: totalPrice2,
      status: 'PENDING',
      confirmationDeadline: confirmDeadline2,
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

  // Reservation 3: Communion - mostly children
  const twoWeeksLater = new Date(today)
  twoWeeksLater.setDate(today.getDate() + 14)
  
  const adults3 = 10
  const children3 = 30
  const pricePerAdult3 = 90
  const pricePerChild3 = 60
  const totalPrice3 = (adults3 * pricePerAdult3) + (children3 * pricePerChild3)

  const reservation3 = await prisma.reservation.create({
    data: {
      hallId: halls[2].id,
      clientId: clients[2].id,
      eventTypeId: eventTypes[2].id,
      startDateTime: new Date(twoWeeksLater.getFullYear(), twoWeeksLater.getMonth(), twoWeeksLater.getDate(), 14, 0),
      endDateTime: new Date(twoWeeksLater.getFullYear(), twoWeeksLater.getMonth(), twoWeeksLater.getDate(), 20, 0),
      adults: adults3,
      children: children3,
      guests: adults3 + children3,
      pricePerAdult: pricePerAdult3,
      pricePerChild: pricePerChild3,
      totalPrice: totalPrice3,
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

  // Reservation 4: Anniversary (Rocznica) with extra fields
  const threeWeeksLater = new Date(today)
  threeWeeksLater.setDate(today.getDate() + 21)
  
  const adults4 = 50
  const children4 = 0
  const pricePerAdult4 = 120
  const pricePerChild4 = 0
  const totalPrice4 = (adults4 * pricePerAdult4) + (children4 * pricePerChild4)

  const reservation4 = await prisma.reservation.create({
    data: {
      hallId: halls[0].id,
      clientId: clients[3].id,
      eventTypeId: eventTypes[4].id, // Rocznica
      anniversaryYear: 25, // 25th anniversary
      anniversaryOccasion: 'ślubu',
      startDateTime: new Date(threeWeeksLater.getFullYear(), threeWeeksLater.getMonth(), threeWeeksLater.getDate(), 17, 0),
      endDateTime: new Date(threeWeeksLater.getFullYear(), threeWeeksLater.getMonth(), threeWeeksLater.getDate() + 1, 1, 0),
      adults: adults4,
      children: children4,
      guests: adults4 + children4,
      pricePerAdult: pricePerAdult4,
      pricePerChild: pricePerChild4,
      totalPrice: totalPrice4,
      status: 'CONFIRMED',
      notes: 'Srebrne gody, elegancka dekoracja',
      createdById: admin.id,
    },
  })

  await prisma.reservationHistory.create({
    data: {
      reservationId: reservation4.id,
      changeType: 'CREATED',
      changedByUserId: admin.id,
    },
  })

  // Reservation 5: Custom event type (Inne)
  const fourWeeksLater = new Date(today)
  fourWeeksLater.setDate(today.getDate() + 28)
  
  const adults5 = 30
  const children5 = 10
  const pricePerAdult5 = 100
  const pricePerChild5 = 70
  const totalPrice5 = (adults5 * pricePerAdult5) + (children5 * pricePerChild5)

  const reservation5 = await prisma.reservation.create({
    data: {
      hallId: halls[1].id,
      clientId: clients[4].id,
      eventTypeId: eventTypes[5].id, // Inne
      customEventType: 'Spotkanie rodzinne',
      startDateTime: new Date(fourWeeksLater.getFullYear(), fourWeeksLater.getMonth(), fourWeeksLater.getDate(), 15, 0),
      endDateTime: new Date(fourWeeksLater.getFullYear(), fourWeeksLater.getMonth(), fourWeeksLater.getDate(), 21, 0),
      adults: adults5,
      children: children5,
      guests: adults5 + children5,
      pricePerAdult: pricePerAdult5,
      pricePerChild: pricePerChild5,
      totalPrice: totalPrice5,
      status: 'CONFIRMED',
      notes: 'Zjazd rodzinny',
      createdById: admin.id,
    },
  })

  await prisma.reservationHistory.create({
    data: {
      reservationId: reservation5.id,
      changeType: 'CREATED',
      changedByUserId: admin.id,
    },
  })

  console.log('Created reservations with deposits and history')

  console.log('\n✅ Database seeding completed successfully!')
  console.log('\nTest accounts:')
  console.log('Admin: admin@gosciniecrodzinny.pl / admin123')
  console.log('\nCreated:')
  console.log(`- ${eventTypes.length} event types (Wesele, Urodziny, Komunia, Chrzciny, Rocznica, Inne)`)
  console.log(`- ${halls.length} halls (with separate child pricing)`)
  console.log(`- ${clients.length} clients`)
  console.log(`- 5 reservations showcasing new features:`)
  console.log('  • Wedding with adults/children split')
  console.log('  • Birthday with confirmation deadline (PENDING)')
  console.log('  • Communion with mostly children')
  console.log('  • 25th Anniversary with anniversary details')
  console.log('  • Custom event (Family gathering)')
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
