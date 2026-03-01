#!/usr/bin/env node
/**
 * V3: Fix controller catch blocks that match English error messages.
 * Services now throw Polish errors, but controllers still match English.
 * This script makes controller catch blocks bilingual.
 *
 * Also fixes remaining test string issues from V2 regressions.
 */
const fs = require('fs');
const path = require('path');

const CTRL_DIR = path.join(__dirname, 'src/controllers');
const TEST_DIR = path.join(__dirname, 'src/tests/unit');

// ════════════════════════════════════════════
// PART 1: Fix controller error matching
// ════════════════════════════════════════════
const CTRL_REPLACEMENTS = [
  // menuTemplate.controller.ts
  [`error.message === 'Menu template not found'`, `(error.message.includes('nie znaleziono') || error.message.includes('not found'))`],
  [`error.message.includes('No active menu found')`, `(error.message.includes('Nie znaleziono aktywnego menu') || error.message.includes('No active menu found'))`],
  [`error.message.includes('Cannot delete')`, `(error.message.includes('Nie można usunąć') || error.message.includes('Cannot delete'))`],

  // menuCourse.controller.ts
  [`error.message === 'Course not found'`, `(error.message.includes('nie znaleziono') || error.message.includes('not found'))`],
  [`error.message === 'Dish not found'`, `(error.message.includes('nie znaleziono') || error.message.includes('not found'))`],
  [`error.message.includes('not found')`, `(error.message.toLowerCase().includes('nie znaleziono') || error.message.toLowerCase().includes('not found'))`],

  // menuPackage.controller.ts
  [`error.message === 'Package not found'`, `(error.message.includes('nie znaleziono') || error.message.includes('not found'))`],
  [`error.message === 'Menu package not found'`, `(error.message.includes('nie znaleziono') || error.message.includes('not found'))`],
  [`error.message === 'Selected menu package not found'`, `(error.message.includes('nie znaleziono') || error.message.includes('not found'))`],

  // packageCategory.controller.ts
  [`error.message === 'Package category not found'`, `(error.message.includes('nie znaleziono') || error.message.includes('not found'))`],
  [`error.message === 'Category not found'`, `(error.message.includes('nie znaleziono') || error.message.includes('not found'))`],

  // eventType.controller.ts
  [`error.message === 'Event type not found'`, `(error.message.includes('nie znaleziono') || error.message.includes('not found'))`],
  [`error.message.includes('Event type name already exists')`, `(error.message.includes('już istnieje') || error.message.includes('already exists'))`],

  // client.controller.ts
  [`error.message === 'Client not found'`, `(error.message.includes('nie znaleziono') || error.message.includes('not found'))`],
  [`error.message.includes('already exists')`, `(error.message.toLowerCase().includes('już istnieje') || error.message.toLowerCase().includes('already exists'))`],

  // hall.controller.ts
  [`error.message === 'Hall not found'`, `(error.message.includes('nie znaleziono') || error.message.includes('not found'))`],
  [`error.message === 'Hall is not active'`, `(error.message.includes('nieaktywna') || error.message.includes('not active'))`],

  // reservation.controller.ts
  [`error.message === 'Reservation not found'`, `(error.message.includes('nie znaleziono') || error.message.includes('not found'))`],

  // deposit.controller.ts
  [`error.message === 'Deposit not found'`, `(error.message.includes('nie znaleziono') || error.message.includes('not found'))`],
  [`error.message.includes('already been paid')`, `(error.message.includes('już opłacona') || error.message.includes('already been paid') || error.message.includes('już oznaczona'))`],
  [`error.message.includes('Cannot modify paid')`, `(error.message.includes('Nie można modyfikować opłaconej') || error.message.includes('Cannot modify paid'))`],
  [`error.message.includes('Cannot delete paid')`, `(error.message.includes('Nie można usunąć opłaconej') || error.message.includes('Cannot delete paid'))`],

  // auth.controller.ts
  [`error.message === 'Invalid credentials'`, `(error.message.includes('Nieprawidłowe dane logowania') || error.message.includes('Invalid credentials'))`],
  [`error.message === 'User not found'`, `(error.message.includes('nie znaleziono') || error.message.includes('not found'))`],
  [`error.message.includes('Token has expired')`, `(error.message.includes('Token wygasł') || error.message.includes('Token has expired'))`],
  [`error.message.includes('Invalid token')`, `(error.message.includes('Nieprawidłowy token') || error.message.includes('Invalid token'))`],

  // discount.controller.ts
  [`error.message === 'Discount not found'`, `(error.message.includes('nie znaleziono') || error.message.includes('not found'))`],

  // queue.controller.ts
  [`error.message.includes('Queue entry not found')`, `(error.message.includes('nie znaleziono') || error.message.includes('not found'))`],
  [`error.message.includes('another user')`, `(error.message.toLowerCase().includes('inny użytkownik') || error.message.toLowerCase().includes('another user'))`],

  // reservationMenu.controller.ts
  [`error.message === 'Menu not selected for this reservation'`, `(error.message.includes('Menu nie zostało wybrane') || error.message.includes('Menu not selected'))`],
  [`error.message.includes('Menu snapshot not found')`, `(error.message.includes('nie znaleziono') || error.message.includes('not found'))`],

  // Generic Validation error → Błąd walidacji
  [`error: 'Validation error'`, `error: 'Błąd walidacji'`],

  // PDF service
  [`error: 'PDF generation failed'`, `error: 'Nie udało się wygenerować PDF'`],
];

function fixControllers() {
  let changed = 0;
  const files = fs.readdirSync(CTRL_DIR).filter(f => f.endsWith('.ts'));

  for (const file of files) {
    const filePath = path.join(CTRL_DIR, file);
    let content = fs.readFileSync(filePath, 'utf8');
    const original = content;

    for (const [from, to] of CTRL_REPLACEMENTS) {
      content = content.split(from).join(to);
    }

    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf8');
      const lines = original.split('\n').filter((l, i) => l !== content.split('\n')[i]).length;
      console.log(`  ✅ controllers/${file} (${lines} lines)`);
      changed++;
    }
  }
  return changed;
}

// ════════════════════════════════════════════
// PART 2: Fix test regressions from V2
// ════════════════════════════════════════════
const TEST_FIXES = [
  // V2 broke some strings by being too aggressive with short matches
  // Fix "Zaliczka not found" → should be "Nie znaleziono zaliczki"
  [`'Zaliczka not found'`, `'Nie znaleziono zaliczki'`],
  [`"Zaliczka not found"`, `'Nie znaleziono zaliczki'`],

  // Fix tests that expect "Validation error" in response JSON
  [`error: 'Validation error'`, `error: 'Błąd walidacji'`],
  [`"error": "Validation error"`, `"error": "Błąd walidacji"`],

  // PDF test expectations
  [`error: 'PDF generation failed'`, `error: 'Nie udało się wygenerować PDF'`],
  [`'PDF generation failed'`, `'Nie udało się wygenerować PDF'`],

  // Error handler test — 'Validation error' in response
  [`{ error: 'Validation error',`, `{ error: 'Błąd walidacji',`],
];

function fixTestRegressions() {
  let changed = 0;
  function walk(dir) {
    const files = [];
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) files.push(...walk(full));
      else if (entry.name.endsWith('.test.ts')) files.push(full);
    }
    return files;
  }

  const files = walk(TEST_DIR);
  for (const filePath of files) {
    let content = fs.readFileSync(filePath, 'utf8');
    const original = content;

    for (const [from, to] of TEST_FIXES) {
      content = content.split(from).join(to);
    }

    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf8');
      const lines = original.split('\n').filter((l, i) => l !== content.split('\n')[i]).length;
      console.log(`  ✅ ${path.relative(TEST_DIR, filePath)} (${lines} lines)`);
      changed++;
    }
  }
  return changed;
}

console.log('\n🔧 V3: Fixing controller error matching + test regressions...\n');
console.log('--- Controllers ---');
const c1 = fixControllers();
console.log('\n--- Test regressions ---');
const c2 = fixTestRegressions();
console.log(`\n✅ V3 done! Controllers: ${c1}, Tests: ${c2} files modified.`);
console.log('Commit changes and re-run tests.\n');
