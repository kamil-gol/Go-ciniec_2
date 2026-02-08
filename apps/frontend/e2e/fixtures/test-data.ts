/**
 * Test Data for E2E Tests
 * 
 * Contains all test data used across E2E test suites.
 * Update these values to match your test environment.
 */

export const testData = {
  /**
   * Admin user credentials
   */
  admin: {
    email: 'admin@gosciniecrodzinny.pl',
    password: 'Admin123!@#',
    firstName: 'Admin',
    lastName: 'System',
  },
  
  /**
   * Employee user credentials
   */
  employee: {
    email: 'pracownik@gosciniecrodzinny.pl',
    password: 'Employee123!@#',
    firstName: 'Pracownik',
    lastName: 'Testowy',
  },
  
  /**
   * Test client data
   */
  client: {
    firstName: 'Jan',
    lastName: 'Kowalski',
    email: 'jan.kowalski@example.com',
    phone: '+48123456789',
    notes: 'Test client for E2E tests',
  },
  
  /**
   * Additional test clients
   */
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
  
  /**
   * Test reservation data
   */
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
  
  /**
   * Test reservation variants
   */
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
  
  /**
   * Test queue entry data
   */
  queueEntry: {
    date: '2026-03-20',
    guestsAdults: 40,
    guestsChildren4to12: 10,
    guestsChildren0to3: 5,
    notes: 'Test queue entry from E2E tests',
  },
  
  /**
   * Event types
   */
  eventTypes: [
    'Wesele',
    'Urodziny',
    'Rocznica/Jubileusz',
    'Kominia',
    'Chrzciny',
    'Inne',
  ],
  
  /**
   * Halls
   */
  halls: [
    {
      name: 'Sala Bankietowa',
      capacity: 150,
    },
    {
      name: 'Sala Mała',
      capacity: 50,
    },
  ],
  
  /**
   * Statuses
   */
  statuses: [
    'PENDING',
    'CONFIRMED',
    'RESERVED',
    'CANCELLED',
    'COMPLETED',
  ],
};

/**
 * Helper: Get future date
 */
export function getFutureDate(daysFromNow: number): string {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toISOString().split('T')[0]; // YYYY-MM-DD
}

/**
 * Helper: Get past date
 */
export function getPastDate(daysAgo: number): string {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().split('T')[0]; // YYYY-MM-DD
}

/**
 * Helper: Format date for Polish locale (DD.MM.YYYY)
 */
export function formatDatePL(dateString: string): string {
  const [year, month, day] = dateString.split('-');
  return `${day}.${month}.${year}`;
}

/**
 * Helper: Get today's date
 */
export function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Helper: Generate random email
 */
export function generateRandomEmail(): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  return `test-${timestamp}-${random}@example.com`;
}

/**
 * Helper: Generate random phone
 */
export function generateRandomPhone(): string {
  const random = Math.floor(Math.random() * 900000000) + 100000000;
  return `+48${random}`;
}
