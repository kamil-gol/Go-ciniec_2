#!/usr/bin/env node
/**
 * Bulk replace English test expectations with Polish i18n equivalents.
 * Run: node apps/backend/fix-test-strings.js
 * Then delete this file.
 */
const fs = require('fs');
const path = require('path');

const TEST_DIR = path.join(__dirname, 'src/tests/unit');

// ══════════════════════════════════════════
// 1. Exact string replacements (toThrow('...'))
// ══════════════════════════════════════════
const EXACT = [
  // Reservation
  [`'Reservation not found'`, `'Nie znaleziono rezerwacji'`],
  [`"Reservation not found"`, `'Nie znaleziono rezerwacji'`],
  [`'Reservation date must be in the future'`, `'Data rezerwacji musi być w przyszłości'`],
  [`'Reservation has no queue date'`, `'Rezerwacja nie ma przypisanej daty kolejki'`],
  [`'Reservation is already cancelled'`, `'Rezerwacja jest już anulowana'`],
  [`'Reservation is already archived'`, `'Rezerwacja jest już zarchiwizowana'`],
  [`'Reservation is not archived'`, `'Rezerwacja nie jest zarchiwizowana'`],
  [`'Reservation ID is required'`, `'Identyfikator rezerwacji jest wymagany'`],
  [`'Both reservation IDs are required'`, `'Wymagane są identyfikatory obu rezerwacji'`],
  [`'One or both reservations not found'`, `'Nie znaleziono jednej lub obu rezerwacji'`],
  [`'Reservations must be from the same date'`, `'Można zamieniać tylko rezerwacje z tego samego dnia'`],
  [`'Cannot swap reservation with itself'`, `'Nie można zamienić rezerwacji z samą sobą'`],
  [`'Only RESERVED reservations can be modified'`, `'Można modyfikować tylko rezerwacje ze statusem RESERVED'`],
  [`'Only RESERVED reservations can be swapped'`, `'Można zamieniać tylko rezerwacje ze statusem RESERVED'`],
  [`'Cannot update completed reservation'`, `'Nie można edytować zakończonej rezerwacji'`],
  [`'Cannot update cancelled reservation'`, `'Nie można edytować anulowanej rezerwacji'`],
  [`'Cannot update archived reservation'`, `'Nie można edytować zarchiwizowanej rezerwacji'`],
  [`'Cannot cancel completed reservation'`, `'Nie można anulować zakończonej rezerwacji'`],
  [`'At least one update is required'`, `'Wymagana jest co najmniej jedna aktualizacja'`],

  // Client
  [`'Client not found'`, `'Nie znaleziono klienta'`],
  [`"Client not found"`, `'Nie znaleziono klienta'`],
  [`'Client, queue date and guests are required'`, `'Klient, data kolejki i liczba gości są wymagane'`],
  [`'Client already exists'`, `'Klient z takimi danymi już istnieje'`],
  [`'Phone number already exists'`, `'Numer telefonu jest już przypisany do innego klienta'`],

  // Hall
  [`'Hall not found'`, `'Nie znaleziono sali'`],
  [`"Hall not found"`, `'Nie znaleziono sali'`],
  [`'Hall is not active'`, `'Sala jest nieaktywna'`],
  [`'Hall is already booked'`, `'Sala jest już zarezerwowana w tym terminie'`],
  [`'Hall is already booked for this time'`, `'Sala jest już zarezerwowana w tym terminie'`],

  // Event type
  [`'Event type not found'`, `'Nie znaleziono typu wydarzenia'`],
  [`"Event type not found"`, `'Nie znaleziono typu wydarzenia'`],
  [`'Event type name already exists'`, `'Typ wydarzenia o tej nazwie już istnieje'`],

  // Menu
  [`'Menu package not found'`, `'Nie znaleziono pakietu menu'`],
  [`'Selected menu package not found'`, `'Nie znaleziono wybranego pakietu menu'`],
  [`'Menu template not found'`, `'Nie znaleziono szablonu menu'`],
  [`'Package not found'`, `'Nie znaleziono pakietu menu'`],
  [`'Course not found'`, `'Nie znaleziono kursu menu'`],
  [`'Dish not found'`, `'Nie znaleziono dania'`],
  [`'Option not found'`, `'Nie znaleziono opcji menu'`],
  [`'Menu not selected for this reservation'`, `'Menu nie zostało wybrane dla tej rezerwacji'`],
  [`'Invalid menu update data'`, `'Nieprawidłowe dane aktualizacji menu'`],
  [`'Menu snapshot not found'`, `'Nie znaleziono snapshotu menu'`],

  // Queue
  [`'Queue date cannot be in the past'`, `'Data kolejki nie może być w przeszłości'`],
  [`'Invalid queue date format'`, `'Nieprawidłowy format daty kolejki'`],
  [`'Another user is modifying the queue'`, `'Inny użytkownik modyfikuje kolejkę'`],
  [`'Another user is modifying the queue. Please refresh and try again.'`, `'Inny użytkownik modyfikuje kolejkę. Odśwież stronę i spróbuj ponownie.'`],
  [`'Queue entry not found'`, `'Nie znaleziono pozycji w kolejce'`],

  // Time
  [`'End time must be after start time'`, `'Godzina zakończenia musi być po godzinie rozpoczęcia'`],
  [`"End time must be after start time"`, `'Godzina zakończenia musi być po godzinie rozpoczęcia'`],
  [`'Number of guests must be at least 1'`, `'Liczba gości musi wynosić co najmniej 1'`],

  // Deposit
  [`'Deposit not found'`, `'Nie znaleziono zaliczki'`],
  [`'Payment method is required'`, `'Metoda płatności jest wymagana'`],
  [`'Payment method is required for paid deposits'`, `'Metoda płatności jest wymagana dla opłaconych zaliczek'`],
  [`'Deposit amount must be greater than 0'`, `'Kwota zaliczki musi być większa od 0'`],
  [`'Deposit has already been paid'`, `'Zaliczka została już opłacona'`],
  [`'Cannot modify paid deposit'`, `'Nie można modyfikować opłaconej zaliczki'`],
  [`'Cannot delete paid deposit'`, `'Nie można usunąć opłaconej zaliczki'`],

  // Discount
  [`'Discount not found'`, `'Nie znaleziono rabatu'`],
  [`'Discount name already exists'`, `'Rabat o tej nazwie już istnieje'`],

  // Auth
  [`'Invalid credentials'`, `'Nieprawidłowe dane logowania'`],
  [`'User not found'`, `'Nie znaleziono użytkownika'`],
  [`'User account is inactive'`, `'Konto użytkownika jest nieaktywne'`],
  [`'Email already exists'`, `'Użytkownik z tym adresem email już istnieje'`],
  [`'Authentication failed'`, `'Uwierzytelnienie nie powiodło się'`],
  [`'Token has expired'`, `'Token wygasł'`],
  [`'Invalid token'`, `'Nieprawidłowy token'`],
  [`'Insufficient permissions'`, `'Niewystarczające uprawnienia'`],
  [`'User not authenticated'`, `'Wymagane uwierzytelnienie'`],
  [`'Current password is incorrect'`, `'Aktualne hasło jest nieprawidłowe'`],
  [`'New password must be different'`, `'Nowe hasło musi się różnić od aktualnego'`],

  // Error handler
  [`'Validation error'`, `'Błąd walidacji'`],
  [`'Internal server error'`, `'Wewnętrzny błąd serwera'`],
  [`'Record not found'`, `'Nie znaleziono rekordu'`],

  // Reports
  [`'N/A'`, `'Brak danych'`],

  // PDF
  [`'Reservation not found or missing details'`, `'Nie znaleziono rezerwacji lub brakuje szczegółów'`],
  [`'Failed to generate PDF'`, `'Nie udało się wygenerować PDF'`],

  // Archive scheduler
  [`'Cannot archive active reservations'`, `'Nie można archiwizować aktywnych rezerwacji'`],
];

// ══════════════════════════════════════════
// 2. Regex pattern replacements
// ══════════════════════════════════════════
const REGEX_PATTERNS = [
  // toThrow(/regex/) patterns
  [`/Cannot change status/`, `/Nie można zmienić statusu/`],
  [`/completed or cancelled/`, `/zakończonej/`],
  [`/cannot be completed before/`, `/przed datą wydarzenia/`],
  [`/Cannot cancel completed/`, `/Nie można anulować zakończonej/`],
  [`/oplaconej/`, `/opłaconej/`],
  [`/wieksza od 0/`, `/większa od 0/`],
  [`/at least 100 guests/`, `/minimum 100 gości/`],
  [`/at least (\d+) guests/`, `/minimum $1 gości/`],
  [`/maximum (\d+) guests/`, `/maksimum $1 gości/`],
  [`/already booked/`, `/już zarezerwowana/`],
  [`/not found/`, `/nie znaleziono/i`],
  [`/not active/`, `/nieaktywna/`],
  [`/is not active/`, `/nieaktywna/`],
  [`/does not allow multiple/`, `/nie pozwala na wielokrotny wybór/`],
  [`/Maximum (\d+)/`, `/Maksimum $1/`],
  [`/already archived/`, `/już zarchiwizowana/`],
  [`/not archived/`, `/nie jest zarchiwizowana/`],
  [`/already cancelled/`, `/już anulowana/`],
  [`/before event date/`, `/przed datą wydarzenia/`],
  [`/Price per adult and per child/`, `/Cena za osobę dorosłą/`],
  [`/Confirmation deadline/`, `/Termin potwierdzenia/`],
  [`/before the event/`, `/przed wydarzeniem/`],
  [`/completed, cancelled or archived/`, `/zakończonej, anulowanej lub zarchiwizowanej/`],
  [`/completed or cancelled or archived/`, `/zakończonej, anulowanej lub zarchiwizowanej/`],
  [`/menu for completed/`, `/menu dla zakończonej/`],
];

// ══════════════════════════════════════════
// 3. Substring expectation replacements
//    expect(...).toThrow(expect.stringContaining('...'))
//    or .toContain('...')
// ══════════════════════════════════════════
const SUBSTRINGS = [
  [`'Reservation cancelled'`, `'Rezerwacja anulowana'`],
  [`'Status changed'`, `'Zmiana statusu'`],
  [`'archived'`, `'zarchiwizowana'`],
  [`'restored'`, `'przywrócona'`],
  [`'removed'`, `'usunięto'`],
];

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;

  // Apply exact replacements
  for (const [from, to] of EXACT) {
    content = content.split(from).join(to);
  }

  // Apply regex pattern replacements
  for (const [from, to] of REGEX_PATTERNS) {
    content = content.split(from).join(to);
  }

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    const changes = original.split('\n').filter((line, i) => line !== content.split('\n')[i]).length;
    console.log(`  ✅ ${path.relative(TEST_DIR, filePath)} (${changes} lines changed)`);
    return true;
  }
  return false;
}

function walk(dir) {
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walk(full));
    else if (entry.name.endsWith('.test.ts')) files.push(full);
  }
  return files;
}

console.log('\n🔧 Fixing test strings (English → Polish i18n)...\n');

const files = walk(TEST_DIR);
let changed = 0;
for (const f of files) {
  if (processFile(f)) changed++;
}

console.log(`\n✅ Done! ${changed}/${files.length} files modified.`);
console.log('Run tests: npx jest --config jest.config.js --selectProjects unit');
console.log('Then delete this file: rm apps/backend/fix-test-strings.js\n');
