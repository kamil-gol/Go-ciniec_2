/**
 * Test Data for E2E Tests
 *
 * Contains all test data used across E2E test suites.
 * Update these values to match your test environment.
 */

export const testData = {
  admin: {
    email: 'admin@gosciniecrodzinny.pl',
    password: 'Admin123!@#',
    firstName: 'Admin',
    lastName: 'System',
  },
  employee: {
    email: 'pracownik@gosciniecrodzinny.pl',
    password: 'Employee123!@#',
    firstName: 'Pracownik',
    lastName: 'Testowy',
  },
  client: {
    firstName: 'Jan',
    lastName: 'Kowalski',
    email: 'jan.kowalski@example.com',
    phone: '+48123456789',
    notes: 'Test client for E2E tests',
  },
  clients: [
    {
      firstName: 'Anna',
      lastName: 'Nowak',
      email: 'anna.nowak@example.com',
      phone: '+48234567890',
    },
    {
      firstName: 'Piotr',
      lastName: 'Wiśniewski',
      email: 'piotr.wisniewski@example.com',
      phone: '+48345678901',
    },
    {
      firstName: 'Maria',
      lastName: 'Wójcik',
      email: 'maria.wojcik@example.com',
      phone: '+48456789012',
    },
  ],
  reservation: {
    date: '2026-03-15',
    startTime: '18:00',
    endTime: '23:00',
    guestsAdults: 50,
    guestsChildren4to12: 10,
    guestsChildren0to3: 5,
    eventType: 'Wesele',
    hall: 'Sala Bankietowa',
    notes: 'Test reservation from E2E tests',
    pricePerPerson: 350,
  },
  reservations: {
    birthday: {
      date: '2026-03-20',
      startTime: '16:00',
      endTime: '20:00',
      guestsAdults: 30,
      guestsChildren4to12: 15,
      guestsChildren0to3: 5,
      eventType: 'Urodziny',
      birthdayAge: 30,
      hall: 'Sala Mała',
      notes: 'Birthday party test',
    },
    anniversary: {
      date: '2026-04-10',
      startTime: '19:00',
      endTime: '01:00',
      guestsAdults: 80,
      guestsChildren4to12: 0,
      guestsChildren0to3: 0,
      eventType: 'Rocznica/Jubileusz',
      anniversaryYears: 25,
      anniversaryType: 'Ślub',
      hall: 'Sala Bankietowa',
      notes: '25th wedding anniversary',
    },
    communion: {
      date: '2026-05-15',
      startTime: '14:00',
      endTime: '20:00',
      guestsAdults: 40,
      guestsChildren4to12: 20,
      guestsChildren0to3: 10,
      eventType: 'Kominia',
      hall: 'Sala Bankietowa',
      notes: 'First communion celebration',
    },
  },
  queueEntry: {
    date: '2026-03-20',
    guestsAdults: 40,
    guestsChildren4to12: 10,
    guestsChildren0to3: 5,
    notes: 'Test queue entry from E2E tests',
  },
  eventTypes: [
    'Wesele',
    'Urodziny',
    'Rocznica/Jubileusz',
    'Kominia',
    'Chrzciny',
    'Inne',
  ],
  halls: [
    { name: 'Sala Bankietowa', capacity: 150 },
    { name: 'Sala Mała', capacity: 50 },
  ],
  statuses: [
    'PENDING',
    'CONFIRMED',
    'RESERVED',
    'CANCELLED',
    'COMPLETED',
  ],
};

/**
 * Test reservations used in reservation E2E tests.
 * Field 'toddlers' matches app schema (not 'babies').
 */
export const TEST_RESERVATIONS = {
  pending: {
    clientId: '',
    hallId: '',
    eventTypeId: '',
    date: getFutureDate(30),
    startTime: '18:00',
    endTime: '23:00',
    adults: 50,
    children: 10,
    toddlers: 5,
    notes: 'Test pending reservation',
    birthdayAge: undefined as number | undefined,
    anniversaryOccasion: undefined as string | undefined,
    anniversaryYear: undefined as number | undefined,
  },
  confirmed: {
    clientId: '',
    hallId: '',
    eventTypeId: '',
    date: getFutureDate(45),
    startTime: '17:00',
    endTime: '00:00',
    adults: 80,
    children: 15,
    toddlers: 5,
    notes: 'Test confirmed reservation',
    birthdayAge: undefined as number | undefined,
    anniversaryOccasion: undefined as string | undefined,
    anniversaryYear: undefined as number | undefined,
  },
  birthday: {
    clientId: '',
    hallId: '',
    eventTypeId: '',
    date: getFutureDate(20),
    startTime: '16:00',
    endTime: '20:00',
    adults: 30,
    children: 15,
    toddlers: 5,
    notes: 'Test birthday reservation',
    birthdayAge: 30,
    anniversaryOccasion: undefined as string | undefined,
    anniversaryYear: undefined as number | undefined,
  },
  anniversary: {
    clientId: '',
    hallId: '',
    eventTypeId: '',
    date: getFutureDate(60),
    startTime: '19:00',
    endTime: '01:00',
    adults: 80,
    children: 0,
    toddlers: 0,
    notes: 'Test anniversary reservation',
    birthdayAge: undefined as number | undefined,
    anniversaryOccasion: 'Ślub',
    anniversaryYear: 25,
  },
};

/**
 * Test queue entries used in queue E2E tests.
 */
export const TEST_QUEUE_ENTRIES = [
  {
    clientId: '',
    eventTypeId: '',
    reservationQueueDate: getFutureDate(15),
    adults: 40,
    children: 10,
    toddlers: 5,
    notes: 'Test queue entry 1',
    birthdayAge: undefined as number | undefined,
  },
  {
    clientId: '',
    eventTypeId: '',
    reservationQueueDate: getFutureDate(20),
    adults: 60,
    children: 15,
    toddlers: 3,
    notes: 'Test queue entry 2',
    birthdayAge: undefined as number | undefined,
  },
  {
    clientId: '',
    eventTypeId: '',
    reservationQueueDate: getFutureDate(30),
    adults: 25,
    children: 5,
    toddlers: 2,
    notes: 'Test queue entry 3',
    birthdayAge: 30,
  },
];

export function getFutureDate(daysFromNow: number): string {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toISOString().split('T')[0];
}

export function getPastDate(daysAgo: number): string {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().split('T')[0];
}

export function formatDatePL(dateString: string): string {
  const [year, month, day] = dateString.split('-');
  return `${day}.${month}.${year}`;
}

export function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

export function generateRandomEmail(): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  return `test-${timestamp}-${random}@example.com`;
}

export function generateRandomPhone(): string {
  const random = Math.floor(Math.random() * 900000000) + 100000000;
  return `+48${random}`;
}
