import { PrismaClient, ReservationStatus } from '@prisma/client'

const prisma = new PrismaClient()

// Standardized data
const HALLS = [
  { name: 'Sala Kryształowa', capacity: 150, pricePerPerson: 120 },
  { name: 'Sala Taneczna', capacity: 100, pricePerPerson: 100 },
  { name: 'Sala Złota', capacity: 80, pricePerPerson: 110 },
  { name: 'Cały obiekt', capacity: 300, pricePerPerson: 150 },
  { name: 'Strzecha 1', capacity: 50, pricePerPerson: 90 },
  { name: 'Strzecha 2', capacity: 50, pricePerPerson: 90 },
]

const EVENT_TYPES = [
  { name: 'Wesele', color: '#FF6B9D' },
  { name: 'Urodziny', color: '#4ECDC4' },
  { name: 'Rocznica/Jubileusz', color: '#FFD93D' },
  { name: 'Komunia', color: '#95E1D3' },
  { name: 'Chrzest/Roczek', color: '#A8E6CF' },
  { name: 'Stypa', color: '#8B8B8B' },
  { name: 'Inne', color: '#B4A7D6' },
]

const POLISH_FIRST_NAMES_MALE = [
  'Jan', 'Piotr', 'Andrzej', 'Krzysztof', 'Stanisław', 'Tomasz', 'Paweł', 'Józef',
  'Marcin', 'Marek', 'Michał', 'Grzegorz', 'Jerzy', 'Tadeusz', 'Adam', 'Wojciech',
  'Zbigniew', 'Ryszard', 'Dariusz', 'Henryk', 'Mariusz', 'Kazimierz', 'Władysław',
  'Jakub', 'Robert', 'Mateusz', 'Łukasz', 'Szymon', 'Kamil', 'Bartosz', 'Dawid'
]

const POLISH_FIRST_NAMES_FEMALE = [
  'Maria', 'Anna', 'Katarzyna', 'Małgorzata', 'Agnieszka', 'Barbara', 'Ewa', 'Krystyna',
  'Elżbieta', 'Zofia', 'Janina', 'Teresa', 'Joanna', 'Magdalena', 'Monika', 'Jadwiga',
  'Danuta', 'Irena', 'Halina', 'Helena', 'Beata', 'Aleksandra', 'Dorota', 'Jolanta',
  'Natalia', 'Paulina', 'Karolina', 'Weronika', 'Martyna', 'Patrycja', 'Kinga'
]

const POLISH_LAST_NAMES = [
  'Nowak', 'Kowalski', 'Wiśniewski', 'Wójcik', 'Kowalczyk', 'Kamiński', 'Lewandowski',
  'Zieliński', 'Szymański', 'Woźniak', 'Dąbrowski', 'Kozłowski', 'Jankowski', 'Mazur',
  'Wojciechowski', 'Kwiatkowski', 'Krawczyk', 'Kaczmarek', 'Piotrowski', 'Grabowski',
  'Pawłowski', 'Michalski', 'Król', 'Nowakowski', 'Wieczorek', 'Majewski', 'Olszewski',
  'Jaworski', 'Adamczyk', 'Dudek', 'Stępień', 'Górski', 'Witkowski', 'Walczak'
]

const SAMPLE_NOTES = [
  'Klient prosi o catering wegetariański',
  'Dekoracja w kolorze różowo-złotym',
  'Potrzebna przestrzeń na parkiet taneczny',
  'Goście będą przybywać od godziny 16:00',
  'Planowana serwacja obiadu na godzinę 18:00',
  'Tort urodzinowy zostanie dostarczony przez klienta',
  'Klient zapytał o możliwość przedłużenia do 2:00',
  'Preferowane menu: kuchnia polska tradycyjna',
]

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randomPolishName() {
  const isMale = Math.random() > 0.5
  const firstName = isMale
    ? randomElement(POLISH_FIRST_NAMES_MALE)
    : randomElement(POLISH_FIRST_NAMES_FEMALE)
  const lastName = randomElement(POLISH_LAST_NAMES)
  return { firstName, lastName }
}

function randomPhone() {
  const prefixes = ['500', '501', '502', '503', '504', '505', '506', '507', '508', '509',
                    '510', '511', '512', '513', '514', '515', '516', '517', '518', '519',
                    '530', '531', '532', '533', '534', '535', '536', '537', '538', '539',
                    '570', '571', '572', '573', '574', '575', '576', '577', '578', '579',
                    '600', '601', '602', '603', '604', '605', '606', '607', '608', '609',
                    '660', '661', '662', '663', '664', '665', '666', '667', '668', '669',
                    '690', '691', '692', '693', '694', '695', '696', '697', '698', '699',
                    '720', '721', '722', '723', '724', '725', '726', '727', '728', '729',
                    '730', '731', '732', '733', '734', '735', '736', '737', '738', '739',
                    '780', '781', '782', '783', '784', '785', '786', '787', '788', '789',
                    '880', '881', '882', '883', '884', '885', '886', '887', '888', '889']
  const prefix = randomElement(prefixes)
  const middle = randomInt(100, 999).toString()
  const end = randomInt(100, 999).toString()
  return `+48 ${prefix} ${middle} ${end}`
}

async function main() {
  console.log('🗑️  Czyszczenie bazy danych...')
  
  // Delete in correct order (respecting foreign keys)
  await prisma.reservationHistory.deleteMany()
  await prisma.deposit.deleteMany()
  await prisma.reservation.deleteMany()
  await prisma.client.deleteMany()
  await prisma.eventType.deleteMany()
  await prisma.hall.deleteMany()
  
  console.log('✅ Baza danych wyczyszczona')
  console.log()
  
  // Get or create admin user
  let adminUser = await prisma.user.findFirst({
    where: { email: 'admin@gosciniec.pl' }
  })
  
  if (!adminUser) {
    console.log('👤 Tworzenie użytkownika admin...')
    adminUser = await prisma.user.create({
      data: {
        email: 'admin@gosciniec.pl',
        password: '$2b$10$YourHashedPasswordHere', // You should hash this properly
        firstName: 'Admin',
        lastName: 'System',
        role: 'ADMIN',
        isActive: true,
      }
    })
  }
  
  console.log('🏢 Tworzenie sal...')
  const createdHalls = []
  for (const hallData of HALLS) {
    const hall = await prisma.hall.create({
      data: {
        name: hallData.name,
        capacity: hallData.capacity,
        pricePerPerson: hallData.pricePerPerson,
        pricePerChild: Math.round(hallData.pricePerPerson * 0.5), // 50% for children
        description: `Piękna ${hallData.name} idealna na każdą okazję`,
        amenities: ['Klimatyzacja', 'Nagłośnienie', 'Oświetlenie LED', 'Parkiet'],
        images: [],
        isActive: true,
      }
    })
    createdHalls.push(hall)
    console.log(`  ✓ ${hall.name} (${hall.capacity} osób, ${hall.pricePerPerson} PLN/os)`)
  }
  console.log()
  
  console.log('🎉 Tworzenie typów wydarzeń...')
  const createdEventTypes = []
  for (const eventTypeData of EVENT_TYPES) {
    const eventType = await prisma.eventType.create({
      data: {
        name: eventTypeData.name,
        color: eventTypeData.color,
        description: `Organizacja ${eventTypeData.name.toLowerCase()}`,
        isActive: true,
      }
    })
    createdEventTypes.push(eventType)
    console.log(`  ✓ ${eventType.name} (${eventType.color})`)
  }
  console.log()
  
  console.log('👥 Tworzenie 50 klientów...')
  const createdClients = []
  for (let i = 0; i < 50; i++) {
    const { firstName, lastName } = randomPolishName()
    const phone = randomPhone()
    const hasEmail = Math.random() > 0.3 // 70% have email
    const email = hasEmail ? `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com` : undefined
    
    const client = await prisma.client.create({
      data: {
        firstName,
        lastName,
        email,
        phone,
        notes: Math.random() > 0.7 ? randomElement(SAMPLE_NOTES) : undefined,
      }
    })
    createdClients.push(client)
    
    if ((i + 1) % 10 === 0) {
      console.log(`  ✓ ${i + 1}/50 klientów utworzonych`)
    }
  }
  console.log('  ✓ Wszystkich 50 klientów utworzonych')
  console.log()
  
  console.log('📋 Tworzenie 50 rezerwacji w kolejce (RESERVED)...')
  const queueDates = []
  for (let i = 0; i < 10; i++) {
    const date = new Date(2026, 3, 1 + i) // April 2026
    queueDates.push(date)
  }
  
  for (let i = 0; i < 50; i++) {
    const client = createdClients[i % createdClients.length]
    const queueDate = queueDates[i % queueDates.length]
    const position = Math.floor(i / queueDates.length) + 1
    
    const adults = randomInt(10, 80)
    const children = randomInt(0, 20)
    const toddlers = randomInt(0, 5)
    const guests = adults + children + toddlers
    
    await prisma.reservation.create({
      data: {
        clientId: client.id,
        createdById: adminUser.id,
        status: ReservationStatus.RESERVED,
        reservationQueueDate: queueDate,
        reservationQueuePosition: position,
        queueOrderManual: false,
        adults,
        children,
        toddlers,
        guests,
        pricePerAdult: 0,
        pricePerChild: 0,
        pricePerToddler: 0,
        totalPrice: 0,
        notes: Math.random() > 0.7 ? randomElement(SAMPLE_NOTES) : undefined,
      }
    })
    
    if ((i + 1) % 10 === 0) {
      console.log(`  ✓ ${i + 1}/50 rezerwacji w kolejce utworzonych`)
    }
  }
  console.log('  ✓ Wszystkich 50 rezerwacji w kolejce utworzonych')
  console.log()
  
  console.log('📅 Tworzenie 50 aktywnych rezerwacji (PENDING/CONFIRMED)...')
  const statuses = [ReservationStatus.PENDING, ReservationStatus.CONFIRMED]
  
  for (let i = 0; i < 50; i++) {
    const client = createdClients[(i + 25) % createdClients.length] // Different clients
    const hall = createdHalls[i % createdHalls.length]
    const eventType = createdEventTypes[i % createdEventTypes.length]
    const status = statuses[i % statuses.length]
    
    // Random date in next 6 months
    const startDate = new Date(2026, 2, 15) // March 15, 2026
    startDate.setDate(startDate.getDate() + randomInt(0, 180))
    startDate.setHours(randomInt(14, 18), 0, 0, 0)
    
    const endDate = new Date(startDate)
    endDate.setHours(endDate.getHours() + 6) // 6 hours duration
    
    const adults = randomInt(20, Math.min(100, hall.capacity - 20))
    const children = randomInt(5, 30)
    const toddlers = randomInt(0, 10)
    const guests = adults + children + toddlers
    
    const pricePerAdult = Number(hall.pricePerPerson)
    const pricePerChild = Math.round(pricePerAdult * 0.5)
    const pricePerToddler = Math.round(pricePerAdult * 0.25)
    const totalPrice = (adults * pricePerAdult) + (children * pricePerChild) + (toddlers * pricePerToddler)
    
    const reservation = await prisma.reservation.create({
      data: {
        clientId: client.id,
        createdById: adminUser.id,
        hallId: hall.id,
        eventTypeId: eventType.id,
        status,
        startDateTime: startDate,
        endDateTime: endDate,
        adults,
        children,
        toddlers,
        guests,
        pricePerAdult,
        pricePerChild,
        pricePerToddler,
        totalPrice,
        confirmationDeadline: status === ReservationStatus.PENDING ? new Date(startDate.getTime() - 86400000) : undefined,
        birthdayAge: eventType.name === 'Urodziny' ? randomInt(1, 90) : undefined,
        anniversaryYear: eventType.name === 'Rocznica/Jubileusz' ? randomInt(1, 50) : undefined,
        customEventType: eventType.name === 'Inne' ? 'Spotkanie firmowe' : undefined,
        notes: Math.random() > 0.5 ? randomElement(SAMPLE_NOTES) : undefined,
      }
    })
    
    // 40% have deposits
    if (Math.random() > 0.6) {
      const depositAmount = Math.round(totalPrice * 0.3) // 30% deposit
      const dueDate = new Date(startDate)
      dueDate.setDate(dueDate.getDate() - 14) // 2 weeks before event
      
      const isPaid = Math.random() > 0.5
      
      await prisma.deposit.create({
        data: {
          reservationId: reservation.id,
          amount: depositAmount,
          dueDate: dueDate.toISOString().split('T')[0],
          status: isPaid ? 'PAID' : 'PENDING',
          paid: isPaid,
          paidAt: isPaid ? new Date(dueDate.getTime() - 86400000 * randomInt(1, 7)) : undefined,
          paymentMethod: isPaid ? randomElement(['CASH', 'TRANSFER', 'BLIK']) : undefined,
        }
      })
    }
    
    if ((i + 1) % 10 === 0) {
      console.log(`  ✓ ${i + 1}/50 aktywnych rezerwacji utworzonych`)
    }
  }
  console.log('  ✓ Wszystkich 50 aktywnych rezerwacji utworzonych')
  console.log()
  
  console.log('✅ Seeding zakończony pomyślnie!')
  console.log()
  console.log('📊 Podsumowanie:')
  console.log(`  • Sale: ${HALLS.length}`)
  console.log(`  • Typy wydarzeń: ${EVENT_TYPES.length}`)
  console.log(`  • Klienci: 50`)
  console.log(`  • Rezerwacje w kolejce (RESERVED): 50`)
  console.log(`  • Aktywne rezerwacje (PENDING/CONFIRMED): 50`)
  console.log(`  • Zaliczki: ~20`)
}

main()
  .catch((e) => {
    console.error('❌ Błąd podczas seedowania:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
