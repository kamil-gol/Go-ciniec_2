import { config } from 'dotenv'
import { PrismaClient } from '@prisma/client'
import path from 'path'

// Load .env file
config({ path: path.resolve(__dirname, '../.env') })

const prisma = new PrismaClient()

async function main() {
  console.log('🗑️  Clearing database...')
  
  // Delete all reservations (will cascade delete deposits and history)
  await prisma.reservation.deleteMany({})
  console.log('✅ Deleted all reservations')
  
  // Delete all clients
  await prisma.client.deleteMany({})
  console.log('✅ Deleted all clients')
  
  console.log('\n🌱 Seeding database...')
  
  // Get existing halls, event types, and users
  const halls = await prisma.hall.findMany()
  const eventTypes = await prisma.eventType.findMany()
  const users = await prisma.user.findMany()
  
  if (halls.length === 0) {
    throw new Error('No halls found in database. Please create halls first.')
  }
  
  if (eventTypes.length === 0) {
    throw new Error('No event types found in database. Please create event types first.')
  }
  
  if (users.length === 0) {
    throw new Error('No users found in database. Please create a user first.')
  }
  
  const defaultHall = halls[0]
  const defaultUser = users[0]
  
  // Find specific event types
  const birthdayEvent = eventTypes.find(e => e.name === 'Urodziny') || eventTypes[0]
  const weddingEvent = eventTypes.find(e => e.name === 'Wesele') || eventTypes[0]
  const anniversaryEvent = eventTypes.find(e => e.name === 'Rocznica') || eventTypes[0]
  const otherEvent = eventTypes.find(e => e.name === 'Inne') || eventTypes[0]
  
  // Create 5 clients
  console.log('\n👥 Creating clients...')
  
  const client1 = await prisma.client.create({
    data: {
      firstName: 'Anna',
      lastName: 'Kowalska',
      phone: '+48600123456',
      email: 'anna.kowalska@example.com',
      notes: 'Stały klient, organizuje urodziny córki co roku'
    }
  })
  console.log(`✅ Created client: ${client1.firstName} ${client1.lastName}`)
  
  const client2 = await prisma.client.create({
    data: {
      firstName: 'Piotr',
      lastName: 'Nowak',
      phone: '+48601234567',
      email: 'piotr.nowak@example.com',
      notes: 'Preferuje płatność przelewem'
    }
  })
  console.log(`✅ Created client: ${client2.firstName} ${client2.lastName}`)
  
  const client3 = await prisma.client.create({
    data: {
      firstName: 'Maria',
      lastName: 'Wiśniewska',
      phone: '+48602345678',
      notes: 'Potrzebuje dodatkowych dekoracji'
    }
  })
  console.log(`✅ Created client: ${client3.firstName} ${client3.lastName}`)
  
  const client4 = await prisma.client.create({
    data: {
      firstName: 'Janusz',
      lastName: 'Kowalczyk',
      phone: '+48603456789',
      email: 'janusz.kowalczyk@example.com',
    }
  })
  console.log(`✅ Created client: ${client4.firstName} ${client4.lastName}`)
  
  const client5 = await prisma.client.create({
    data: {
      firstName: 'Katarzyna',
      lastName: 'Lewandowska',
      phone: '+48604567890',
      email: 'katarzyna.lewandowska@example.com',
      notes: 'VIP klient - dużo rezerwacji'
    }
  })
  console.log(`✅ Created client: ${client5.firstName} ${client5.lastName}`)
  
  // Create 5 reservations
  console.log('\n📅 Creating reservations...')
  
  // Reservation 1: Birthday party for a child (with deposit paid)
  const reservation1 = await prisma.reservation.create({
    data: {
      hallId: defaultHall.id,
      clientId: client1.id,
      eventTypeId: birthdayEvent.id,
      createdById: defaultUser.id,
      startDateTime: new Date('2026-03-15T15:00:00Z'),
      endDateTime: new Date('2026-03-15T21:00:00Z'),
      adults: 20,
      children: 15,
      guests: 35,
      pricePerAdult: 80,
      pricePerChild: 40,
      totalPrice: 2200, // 20*80 + 15*40
      birthdayAge: 10,
      status: 'CONFIRMED',
      confirmationDeadline: new Date('2026-03-14T12:00:00Z'),
      notes: 'Urodziny Zosi - 10 lat\n\nDodatkowe dekoracje: balony, tort urodzinowy',
      deposits: {
        create: {
          amount: 600,
          dueDate: '2026-02-15',
          status: 'PAID',
          paid: true,
          paidAt: new Date('2026-02-10T10:30:00Z'),
          paymentMethod: 'TRANSFER'
        }
      }
    }
  })
  console.log(`✅ Created reservation for ${client1.firstName} ${client1.lastName} - Birthday (PAID DEPOSIT)`)
  
  // Reservation 2: Wedding (pending deposit)
  const reservation2 = await prisma.reservation.create({
    data: {
      hallId: defaultHall.id,
      clientId: client2.id,
      eventTypeId: weddingEvent.id,
      createdById: defaultUser.id,
      startDateTime: new Date('2026-06-20T16:00:00Z'),
      endDateTime: new Date('2026-06-21T02:00:00Z'),
      adults: 80,
      children: 12,
      guests: 92,
      pricePerAdult: 150,
      pricePerChild: 75,
      totalPrice: 12900, // 80*150 + 12*75
      status: 'CONFIRMED',
      notes: 'Wesele Piotra i Agnieszki\n\nMenu: 3 dania + bar otwarty\nMuzyka: DJ + zespół na żywo',
      deposits: {
        create: {
          amount: 3000,
          dueDate: '2026-04-20',
          status: 'PENDING',
          paid: false
        }
      }
    }
  })
  console.log(`✅ Created reservation for ${client2.firstName} ${client2.lastName} - Wedding (PENDING DEPOSIT)`)
  
  // Reservation 3: Anniversary (25th - Silver Wedding)
  const reservation3 = await prisma.reservation.create({
    data: {
      hallId: defaultHall.id,
      clientId: client3.id,
      eventTypeId: anniversaryEvent.id,
      createdById: defaultUser.id,
      startDateTime: new Date('2026-04-10T18:00:00Z'),
      endDateTime: new Date('2026-04-11T01:00:00Z'),
      adults: 45,
      children: 8,
      guests: 53,
      pricePerAdult: 120,
      pricePerChild: 60,
      totalPrice: 5880, // 45*120 + 8*60
      anniversaryYear: 25,
      anniversaryOccasion: 'Srebrne wesele',
      status: 'PENDING',
      confirmationDeadline: new Date('2026-04-03T12:00:00Z'),
      notes: '25. rocznica ślubu\n\nDekoracje w srebrnych kolorach',
      deposits: {
        create: {
          amount: 1500,
          dueDate: '2026-03-10',
          status: 'PENDING',
          paid: false
        }
      }
    }
  })
  console.log(`✅ Created reservation for ${client3.firstName} ${client3.lastName} - 25th Anniversary`)
  
  // Reservation 4: Corporate Event (with toddlers)
  const reservation4 = await prisma.reservation.create({
    data: {
      hallId: defaultHall.id,
      clientId: client4.id,
      eventTypeId: otherEvent.id,
      createdById: defaultUser.id,
      startDateTime: new Date('2026-05-05T14:00:00Z'),
      endDateTime: new Date('2026-05-05T20:00:00Z'),
      adults: 30,
      children: 5, // 3 kids aged 4-12, 2 toddlers 0-3
      guests: 35,
      pricePerAdult: 100,
      pricePerChild: 50, // Mixed: 3*50 + 2*25
      totalPrice: 3200, // 30*100 + 5*50 (simplified)
      customEventType: 'Spotkanie integracyjne firmy',
      status: 'CONFIRMED',
      notes: 'Spotkanie firmowe z rodzinami\n\nKącik dla dzieci\nAnimator dla najmłodszych\n\n⏰ Dodatkowe godziny: 1h × 500 PLN = 500 PLN'
    }
  })
  console.log(`✅ Created reservation for ${client4.firstName} ${client4.lastName} - Corporate Event`)
  
  // Reservation 5: Birthday party for adult (18th birthday - with extra hours)
  const reservation5 = await prisma.reservation.create({
    data: {
      hallId: defaultHall.id,
      clientId: client5.id,
      eventTypeId: birthdayEvent.id,
      createdById: defaultUser.id,
      startDateTime: new Date('2026-07-12T19:00:00Z'),
      endDateTime: new Date('2026-07-13T03:00:00Z'),
      adults: 50,
      children: 0,
      guests: 50,
      pricePerAdult: 130,
      pricePerChild: 0,
      totalPrice: 6500, // 50*130
      birthdayAge: 18,
      status: 'CONFIRMED',
      notes: '18. urodziny Karoliny\n\nImpreza z DJ-em\nBar z drinkami\n\n⏰ Dodatkowe godziny: 2h × 500 PLN = 1000 PLN',
      deposits: {
        create: {
          amount: 2000,
          dueDate: '2026-06-12',
          status: 'PAID',
          paid: true,
          paidAt: new Date('2026-06-05T14:20:00Z'),
          paymentMethod: 'BLIK'
        }
      }
    }
  })
  console.log(`✅ Created reservation for ${client5.firstName} ${client5.lastName} - 18th Birthday (PAID DEPOSIT)`)
  
  console.log('\n✅ Database seeded successfully!')
  console.log('\n📊 Summary:')
  console.log(`   - Clients created: 5`)
  console.log(`   - Reservations created: 5`)
  console.log(`   - Deposits created: 4 (2 paid, 2 pending)`)
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
