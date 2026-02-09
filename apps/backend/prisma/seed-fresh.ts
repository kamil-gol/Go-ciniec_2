import { PrismaClient, ReservationStatus } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

// ============================================
// KONFIGURACJA - Sale i Typy Wydarzeń
// ============================================
const HALLS = [
  { name: 'Sala Kryształowa', capacity: 80, pricePerPerson: 250, description: 'Elegancka sala z kryształowymi żyrandolami', amenities: ['Klimatyzacja', 'Parkiet'], images: [] },
  { name: 'Sala Taneczna', capacity: 120, pricePerPerson: 280, description: 'Przestronna sala z parkietem tanecznym', amenities: ['Parkiet', 'Nagłośnienie'], images: [] },
  { name: 'Sala Złota', capacity: 150, pricePerPerson: 320, description: 'Reprezentacyjna sala ze złotymi zdobieniami', amenities: ['Scena', 'Oświetlenie LED'], images: [] },
  { name: 'Cały obiekt', capacity: 300, pricePerPerson: 400, description: 'Wynajem całego obiektu na ekskluzywne wydarzenia', amenities: ['Wszystkie sale', 'Ogród', 'Parking'], images: [] },
  { name: 'Strzecha 1', capacity: 50, pricePerPerson: 200, description: 'Kameralna sala w stylu rustykalnym', amenities: ['Kominek', 'Drewniane wnętrze'], images: [] },
  { name: 'Strzecha 2', capacity: 60, pricePerPerson: 220, description: 'Druga sala w stylu wiejskim z kominkiem', amenities: ['Kominek', 'Taras'], images: [] },
]

const EVENT_TYPES = [
  { name: 'Wesele', description: 'Uroczystość weselna z przyjęciem', color: '#FF69B4' },
  { name: 'Urodziny', description: 'Przyjęcie urodzinowe', color: '#FFA500' },
  { name: 'Rocznica/Jubileusz', description: 'Rocznica ślubu lub jubileusz', color: '#FFD700' },
  { name: 'Komunia', description: 'Pierwsza Komunia Święta', color: '#87CEEB' },
  { name: 'Chrzest/Roczek', description: 'Chrzest lub pierwsze urodziny dziecka', color: '#98FB98' },
  { name: 'Stypa', description: 'Stypa pogrzebowa', color: '#696969' },
  { name: 'Inne', description: 'Inne rodzaje wydarzeń', color: '#9370DB' },
]

// ============================================
// GENERATOR DANYCH
// ============================================
const FIRST_NAMES_M = ['Jan', 'Piotr', 'Andrzej', 'Tomasz', 'Krzysztof', 'Marek', 'Michał', 'Adam', 'Paweł', 'Bartosz', 'Jakub', 'Mateusz', 'Kamil', 'Łukasz', 'Wojciech']
const FIRST_NAMES_F = ['Anna', 'Maria', 'Katarzyna', 'Małgorzata', 'Agnieszka', 'Barbara', 'Ewa', 'Joanna', 'Magdalena', 'Monika', 'Aleksandra', 'Natalia', 'Karolina', 'Justyna', 'Weronika']
const LAST_NAMES = ['Kowalski', 'Nowak', 'Wiśniewski', 'Wójcik', 'Kowalczyk', 'Kamiński', 'Lewandowski', 'Zieliński', 'Szymański', 'Woźniak', 'Dąbrowski', 'Kozłowski', 'Jankowski', 'Mazur', 'Kwiatkowski']

function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
}

function generatePhone(): string {
  return `+48 ${randomInt(500, 799)} ${randomInt(100, 999)} ${randomInt(100, 999)}`
}

function generateEmail(firstName: string, lastName: string, index: number): string {
  const domains = ['gmail.com', 'wp.pl', 'o2.pl', 'interia.pl', 'onet.pl']
  const suffix = String(index).padStart(3, '0') // Unikalny sufiks 001, 002, etc.
  return `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${suffix}@${randomElement(domains)}`
}

function formatDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// ============================================
// MAIN SEED FUNCTION
// ============================================
async function main() {
  console.log('🗑️  Czyszczenie bazy danych...')
  
  // Usuń wszystkie dane (w odpowiedniej kolejności - foreign keys)
  await prisma.activityLog.deleteMany()
  await prisma.reservationHistory.deleteMany()
  await prisma.deposit.deleteMany()
  await prisma.reservation.deleteMany()
  await prisma.client.deleteMany()
  await prisma.eventType.deleteMany()
  await prisma.hall.deleteMany()
  await prisma.user.deleteMany()
  
  console.log('✅ Baza wyczyszczona\n')

  // ============================================
  // 0. UŻYTKOWNIK SYSTEMOWY
  // ============================================
  console.log('👤 Tworzenie użytkownika systemowego...')
  
  // Generate proper bcrypt hash for password: Admin123!@#
  const adminPassword = 'Admin123!@#'
  const hashedPassword = bcrypt.hashSync(adminPassword, 10)
  
  const systemUser = await prisma.user.create({
    data: {
      email: 'admin@gosciniecrodzinny.pl',
      password: hashedPassword,
      firstName: 'System',
      lastName: 'Administrator',
      role: 'ADMIN',
      isActive: true,
    },
  })
  console.log(`✅ Utworzono użytkownika: ${systemUser.email}`)
  console.log(`   Hasło: ${adminPassword}\n`)

  // ============================================
  // 1. SALE
  // ============================================
  console.log('🏛️  Tworzenie sal...')
  const halls = []
  for (const hallData of HALLS) {
    const hall = await prisma.hall.create({
      data: hallData,
    })
    halls.push(hall)
    console.log(`   ✓ ${hall.name} (${hall.capacity} osób, ${hall.pricePerPerson} zł/os.)`)
  }
  console.log(`✅ Utworzono ${halls.length} sal\n`)

  // ============================================
  // 2. TYPY WYDARZEŃ
  // ============================================
  console.log('🎭 Tworzenie typów wydarzeń...')
  const eventTypes = []
  for (const eventTypeData of EVENT_TYPES) {
    const eventType = await prisma.eventType.create({
      data: eventTypeData,
    })
    eventTypes.push(eventType)
    console.log(`   ✓ ${eventType.name}`)
  }
  console.log(`✅ Utworzono ${eventTypes.length} typów wydarzeń\n`)

  // ============================================
  // 3. KLIENCI (50 szt.)
  // ============================================
  console.log('👥 Tworzenie klientów...')
  const clients = []
  for (let i = 0; i < 50; i++) {
    const isMale = Math.random() > 0.5
    const firstName = isMale ? randomElement(FIRST_NAMES_M) : randomElement(FIRST_NAMES_F)
    const lastName = randomElement(LAST_NAMES)
    
    const client = await prisma.client.create({
      data: {
        firstName,
        lastName,
        email: generateEmail(firstName, lastName, i + 1), // Unikalny email z indeksem
        phone: generatePhone(),
        notes: Math.random() > 0.7 ? 'Klient stały, preferuje rezerwacje z wyprzedzeniem' : null,
      },
    })
    clients.push(client)
    
    if ((i + 1) % 10 === 0) {
      console.log(`   ✓ Utworzono ${i + 1}/50 klientów`)
    }
  }
  console.log(`✅ Utworzono ${clients.length} klientów\n`)

  // ============================================
  // 4. REZERWACJE (50 szt.)
  // ============================================
  console.log('📅 Tworzenie rezerwacji...')
  const now = new Date()
  const startDate = new Date(now.getFullYear(), now.getMonth() - 2, 1)
  const endDate = new Date(now.getFullYear(), now.getMonth() + 6, 1)
  
  const statuses: ReservationStatus[] = ['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED']
  const reservations = []

  for (let i = 0; i < 50; i++) {
    const client = randomElement(clients)
    const hall = randomElement(halls)
    const eventType = randomElement(eventTypes)
    
    const eventDate = randomDate(startDate, endDate)
    const status = randomElement(statuses)
    
    // Liczba gości
    const adults = randomInt(Math.floor(hall.capacity * 0.3), hall.capacity)
    const children = randomInt(0, Math.floor(adults * 0.2))
    const toddlers = randomInt(0, Math.floor(adults * 0.1))
    const guests = adults + children + toddlers
    
    // DateTime dla eventu
    const startHour = randomInt(14, 18)
    const startDateTime = new Date(eventDate)
    startDateTime.setHours(startHour, 0, 0, 0)
    
    const endHour = randomInt(22, 23)
    const endDateTime = new Date(eventDate)
    endDateTime.setHours(endHour, 0, 0, 0)
    
    // Ceny (konwersja do Decimal poprzez string)
    const pricePerAdult = Number(hall.pricePerPerson)
    const pricePerChild = Math.floor(pricePerAdult * 0.7)
    const pricePerToddler = 0
    
    const totalPrice = (adults * pricePerAdult) + (children * pricePerChild) + (toddlers * pricePerToddler)
    
    // Legacy fields dla kompatybilności
    const dateStr = formatDate(eventDate)
    const startTimeStr = `${String(startHour).padStart(2, '0')}:00`
    const endTimeStr = `${String(endHour).padStart(2, '0')}:00`
    
    const reservation = await prisma.reservation.create({
      data: {
        clientId: client.id,
        createdById: systemUser.id,
        hallId: hall.id,
        eventTypeId: eventType.id,
        
        // DateTime fields
        startDateTime,
        endDateTime,
        
        // Legacy fields
        date: dateStr,
        startTime: startTimeStr,
        endTime: endTimeStr,
        
        // Guests
        adults,
        children,
        toddlers,
        guests,
        
        // Prices
        pricePerAdult,
        pricePerChild,
        pricePerToddler,
        totalPrice,
        
        status,
        notes: Math.random() > 0.7 ? 'Klient prosi o specjalne menu wegetariańskie' : null,
      },
    })
    
    reservations.push(reservation)
    
    // Dodaj zaliczkę jeśli status = CONFIRMED
    if (status === 'CONFIRMED' && Math.random() > 0.3) {
      const advancePayment = Math.floor(totalPrice * 0.3)
      const dueDateObj = new Date(eventDate.getTime() - 30 * 24 * 60 * 60 * 1000)
      const paidAtObj = new Date(now.getTime() - randomInt(10, 60) * 24 * 60 * 60 * 1000)
      
      await prisma.deposit.create({
        data: {
          reservationId: reservation.id,
          amount: advancePayment,
          dueDate: formatDate(dueDateObj),
          paid: true,
          status: 'PAID',
          paidAt: paidAtObj,
          paymentMethod: randomElement(['CASH', 'TRANSFER', 'BLIK']),
        },
      })
    }
    
    if ((i + 1) % 10 === 0) {
      console.log(`   ✓ Utworzono ${i + 1}/50 rezerwacji`)
    }
  }
  console.log(`✅ Utworzono ${reservations.length} rezerwacji\n`)

  // ============================================
  // 5. KOLEJKA (50 szt.)
  // ============================================
  console.log('⏳ Tworzenie wpisów w kolejce...')
  const futureDate = new Date(now.getFullYear(), now.getMonth() + 3, 1)
  
  // Generuj 10 UNIKALNYCH dat z odstepem 7 dni
  const queueDates = []
  for (let i = 0; i < 10; i++) {
    const date = new Date(futureDate)
    date.setDate(date.getDate() + (i * 7)) // Co 7 dni
    date.setHours(0, 0, 0, 0) // Reset godzin
    queueDates.push(date)
  }
  
  let queueCount = 0
  for (const targetDate of queueDates) {
    // 5 wpisów na każdą datę
    for (let pos = 1; pos <= 5; pos++) {
      const client = randomElement(clients)
      const eventType = randomElement(eventTypes)
      
      const adults = randomInt(30, 100)
      const children = randomInt(0, 20)
      const toddlers = randomInt(0, 10)
      const guests = adults + children + toddlers
      
      await prisma.reservation.create({
        data: {
          clientId: client.id,
          createdById: systemUser.id,
          eventTypeId: eventType.id,
          
          // Queue specific
          reservationQueueDate: targetDate,
          reservationQueuePosition: pos,
          
          // Guests
          adults,
          children,
          toddlers,
          guests,
          
          // Prices (default)
          pricePerAdult: 0,
          pricePerChild: 0,
          pricePerToddler: 0,
          totalPrice: 0,
          
          status: 'RESERVED',
          notes: `W kolejce na ${formatDate(targetDate)} - pozycja ${pos}`,
        },
      })
      
      queueCount++
    }
  }
  
  console.log(`✅ Utworzono ${queueCount} wpisów w kolejce\n`)

  // ============================================
  // PODSUMOWANIE
  // ============================================
  console.log('═══════════════════════════════════════')
  console.log('📊 PODSUMOWANIE SEED')
  console.log('═══════════════════════════════════════')
  console.log(`👤 Użytkownik:        1 (admin@gosciniecrodzinny.pl)`)
  console.log(`🏛️  Sale:              ${halls.length}`)
  console.log(`🎭 Typy wydarzeń:     ${eventTypes.length}`)
  console.log(`👥 Klienci:           ${clients.length}`)
  console.log(`📅 Rezerwacje:        ${reservations.length}`)
  console.log(`⏳ Kolejka:           ${queueCount}`)
  console.log('═══════════════════════════════════════')
  console.log('✅ Seed zakończony pomyślnie!')
  console.log('\n🔑 Dane logowania:')
  console.log('   Email: admin@gosciniecrodzinny.pl')
  console.log('   Hasło: Admin123!@#')
}

main()
  .catch((e) => {
    console.error('❌ Błąd podczas seedowania:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
