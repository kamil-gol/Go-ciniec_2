#!/usr/bin/env node
/**
 * V2: Fix remaining test failures after v1 bulk replacement.
 * Run: node - < apps/backend/fix-test-strings-v2.js
 */
const fs = require('fs');
const path = require('path');

const TEST_DIR = path.join(__dirname, 'src/tests/unit');

const EXACT = [
  // Missed by v1 — substring variants
  [`'not found'`, `'nie znaleziono'`],
  [`"not found"`, `'nie znaleziono'`],
  [`'not archived'`, `'nie jest zarchiwizowana'`],
  [`'already archived'`, `'już zarchiwizowana'`],
  [`'already exists'`, `'już istnieje'`],
  [`'already cancelled'`, `'już anulowana'`],
  [`'removed'`, `'usunięto'`],
  [`'required'`, `'wymagane'`],
  [`'wieksza od 0'`, `'większa od 0'`],

  // Full string misses from v1
  [`'Cannot update menu for completed or cancelled reservations'`, `'Nie można zmienić menu dla zakończonej, anulowanej lub zarchiwizowanej rezerwacji'`],
  [`"Cannot update menu for completed or cancelled reservations"`, `'Nie można zmienić menu dla zakończonej, anulowanej lub zarchiwizowanej rezerwacji'`],
  [`'Can only update RESERVED reservations'`, `'Można edytować tylko rezerwacje ze statusem RESERVED'`],
  [`"Can only update RESERVED reservations"`, `'Można edytować tylko rezerwacje ze statusem RESERVED'`],
  [`'Client, queue date, and guests are required'`, `'Klient, data kolejki i liczba gości są wymagane'`],
  [`'Event type name is required'`, `'Nazwa typu wydarzenia jest wymagana'`],
  [`"Event type name is required"`, `'Nazwa typu wydarzenia jest wymagana'`],
  [`'Confirmation email can only be sent for paid deposits'`, `'Email potwierdzenia można wysłać tylko dla opłaconej zaliczki'`],
  [`"Confirmation email can only be sent for paid deposits"`, `'Email potwierdzenia można wysłać tylko dla opłaconej zaliczki'`],
  [`'Menu has been removed from the reservation'`, `'Menu zostało usunięte z rezerwacji'`],
  [`"Menu has been removed from the reservation"`, `'Menu zostało usunięte z rezerwacji'`],
  [`'Reservation cancelled'`, `'Rezerwacja anulowana'`],
  [`'Status changed'`, `'Zmiana statusu'`],

  // toContain checks for archive/unarchive
  [`'archived'`, `'zarchiwizowana'`],
  [`'restored'`, `'przywrócona'`],
];

const REGEX_PATTERNS = [
  [`/exceeds hall capacity/`, `/przekracza pojemność sali/`],
  [`/exceeds capacity/`, `/przekracza pojemność/`],
  [`/Cannot update menu for completed/`, `/Nie można zmienić menu dla zakończonej/`],
  [`/Can only update RESERVED/`, `/Można edytować tylko rezerwacje ze statusem RESERVED/`],
  [`/cannot be sent/`, `/nie można wysłać/`],
  [`/already paid/`, `/już opłacona/`],
  [`/unknown client/`, `/nieznany klient/`],
  [`/Unknown client/`, `/nieznany klient/`],
];

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;

  // EXACT replacements — be careful with short strings
  // Only replace inside .toThrow(), .toContain(), stringContaining() contexts
  for (const [from, to] of EXACT) {
    // Replace in toThrow/toContain/stringContaining contexts
    content = content.replace(
      new RegExp(`\\.toThrow\\(${escapeRegex(from)}\\)`, 'g'),
      `.toThrow(${to})`
    );
    content = content.replace(
      new RegExp(`\\.toContain\\(${escapeRegex(from)}\\)`, 'g'),
      `.toContain(${to})`
    );
    content = content.replace(
      new RegExp(`stringContaining\\(${escapeRegex(from)}\\)`, 'g'),
      `stringContaining(${to})`
    );
    content = content.replace(
      new RegExp(`stringMatching\\(${escapeRegex(from)}\\)`, 'g'),
      `stringMatching(${to})`
    );
  }

  // REGEX pattern replacements (literal .toThrow(/pattern/))
  for (const [from, to] of REGEX_PATTERNS) {
    content = content.split(from).join(to);
  }

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    const changes = original.split('\n').filter((line, i) => line !== content.split('\n')[i]).length;
    console.log(`  ✅ ${path.relative(TEST_DIR, filePath)} (${changes} lines)`);
    return true;
  }
  return false;
}

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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

// ══════════════════════════════════════════════
// PART 2: Add missing mocks to reservation tests
// ══════════════════════════════════════════════
function addMissingMocks(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;
  const fname = path.basename(filePath);

  // Only process reservation service test files
  if (!fname.startsWith('reservation.service.')) return false;

  // Add findMany/findFirst defaults if missing
  if (content.includes('jest.clearAllMocks') && !content.includes('.findMany.mockResolvedValue([])')) {
    // Check if it's a beforeEach with jest.clearAllMocks
    content = content.replace(
      /jest\.clearAllMocks\(\);/,
      `jest.clearAllMocks();\n  // Default mocks for overlapping check\n  if (db.reservation?.findMany) db.reservation.findMany.mockResolvedValue([]);\n  if (db.reservation?.findFirst) db.reservation.findFirst.mockResolvedValue(null);\n  if (db.hall?.findFirst) db.hall.findFirst.mockResolvedValue(null);`
    );
  }

  // Fix for tests where mock is `mockPrisma` instead of `db`
  if (content.includes('jest.clearAllMocks') && content.includes('mockPrisma') && !content.includes('mockPrisma.reservation.findMany.mockResolvedValue')) {
    content = content.replace(
      /jest\.clearAllMocks\(\);/,
      `jest.clearAllMocks();\n  if (mockPrisma.reservation?.findMany) mockPrisma.reservation.findMany.mockResolvedValue([]);\n  if (mockPrisma.reservation?.findFirst) mockPrisma.reservation.findFirst.mockResolvedValue(null);\n  if (mockPrisma.hall?.findFirst) mockPrisma.hall.findFirst.mockResolvedValue(null);`
    );
  }

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`  🔧 ${path.relative(TEST_DIR, filePath)} (mocks added)`);
    return true;
  }
  return false;
}

console.log('\n🔧 V2: Fixing remaining test strings + mocks...\n');

const files = walk(TEST_DIR);
let changed = 0;
for (const f of files) {
  const a = processFile(f);
  const b = addMissingMocks(f);
  if (a || b) changed++;
}

console.log(`\n✅ V2 done! ${changed}/${files.length} files modified.`);
console.log('Run tests: npx jest --config jest.config.js --selectProjects unit\n');
