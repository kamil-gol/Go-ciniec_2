/**
 * Mock Factories
 * 
 * Factory functions for generating test data objects.
 * Use these in unit tests where you need realistic but
 * deterministic data without touching the database.
 */

// ========================================
// Base helpers
// ========================================

let _counter = 0;
function nextId(): number {
  return ++_counter;
}

function randomDate(daysFromNow: number = 30): Date {
  const date = new Date();
  date.setDate(date.getDate() + Math.floor(Math.random() * daysFromNow) + 1);
  return date;
}

export function resetFactoryCounter(): void {
  _counter = 0;
}

// ========================================
// Client
// ========================================

export function buildClient(overrides: Record<string, any> = {}) {
  const id = nextId();
  return {
    id,
    name: `Klient Testowy ${id}`,
    email: `klient${id}@test.pl`,
    phone: `+48 ${String(id).padStart(9, '0')}`,
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

// ========================================
// Hall
// ========================================

export function buildHall(overrides: Record<string, any> = {}) {
  const id = nextId();
  return {
    id,
    name: `Sala ${id}`,
    capacity: 100,
    description: `Sala testowa ${id}`,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

// ========================================
// Event Type
// ========================================

export function buildEventType(overrides: Record<string, any> = {}) {
  const id = nextId();
  const types = ['Wesele', 'Komunia', 'Chrzciny', 'Konferencja', 'Urodziny'];
  return {
    id,
    name: overrides.name || types[id % types.length],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

// ========================================
// Reservation
// ========================================

export function buildReservation(overrides: Record<string, any> = {}) {
  const id = nextId();
  const date = randomDate();
  return {
    id,
    clientId: overrides.clientId || 1,
    hallId: overrides.hallId || 1,
    eventTypeId: overrides.eventTypeId || 1,
    date,
    startTime: '14:00',
    endTime: '22:00',
    guestCount: 80,
    status: 'CONFIRMED',
    notes: null,
    totalPrice: 15000,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

// ========================================
// Queue Item
// ========================================

export function buildQueueItem(overrides: Record<string, any> = {}) {
  const id = nextId();
  return {
    id,
    clientName: `Kolejka Klient ${id}`,
    clientPhone: `+48 ${String(id).padStart(9, '5')}`,
    clientEmail: `kolejka${id}@test.pl`,
    eventTypeId: 1,
    hallId: null,
    preferredDate: randomDate(60),
    guestCount: 50,
    notes: null,
    position: id,
    status: 'WAITING',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

// ========================================
// Deposit
// ========================================

export function buildDeposit(overrides: Record<string, any> = {}) {
  const id = nextId();
  return {
    id,
    reservationId: overrides.reservationId || 1,
    amount: 3000,
    status: 'PENDING',
    dueDate: randomDate(14),
    paidAt: null,
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

// ========================================
// User
// ========================================

export function buildUser(overrides: Record<string, any> = {}) {
  const id = nextId();
  return {
    id,
    email: `user${id}@test.pl`,
    name: `Test User ${id}`,
    password: '$2b$10$hashedPasswordPlaceholder',
    role: 'USER',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

// ========================================
// Menu Template
// ========================================

export function buildMenuTemplate(overrides: Record<string, any> = {}) {
  const id = nextId();
  return {
    id,
    name: `Szablon Menu ${id}`,
    description: `Testowy szablon ${id}`,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

// ========================================
// Dish
// ========================================

export function buildDish(overrides: Record<string, any> = {}) {
  const id = nextId();
  return {
    id,
    name: `Danie Testowe ${id}`,
    description: `Opis dania ${id}`,
    categoryId: overrides.categoryId || 1,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}
