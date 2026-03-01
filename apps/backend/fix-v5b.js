#!/usr/bin/env node
/**
 * V5b: Targeted fix for reservation.service.branches.test.ts
 *
 * 1. Add db.reservation.findMany.mockResolvedValue([]) to beforeEach
 * 2. Fix /maximum 10 guests/ → /maksimum 10 go/
 * 3. Fix /Cena za osobę dorosłą/ → /Cena za dorosłego/
 * 4. Fix /Maximum 3/ → /aksimum 3/
 * 5. Fix 'Cannot cancel completed' → Polish
 * 6. Fix 'Status changed' default reason → 'Zmiana statusu'
 */
const fs = require('fs');
const path = require('path');

const TEST_DIR = path.join(__dirname, 'src/tests/unit');
let totalChanged = 0;

function walk(dir) {
  const files = [];
  if (!fs.existsSync(dir)) return files;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walk(full));
    else if (entry.name.endsWith('.test.ts')) files.push(full);
  }
  return files;
}

const testFiles = walk(TEST_DIR);

for (const filePath of testFiles) {
  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;
  const fname = path.basename(filePath);

  // ====================================================
  // FIX 1: Add db.reservation.findMany mock in beforeEach
  // Only if file uses db.reservation.findFirst mock but not findMany
  // ====================================================
  if (content.includes('db.reservation.findFirst.mockResolvedValue') &&
      !content.includes('db.reservation.findMany.mockResolvedValue')) {
    content = content.replace(
      /db\.reservation\.findFirst\.mockResolvedValue\(null\);/,
      'db.reservation.findFirst.mockResolvedValue(null);\n  db.reservation.findMany.mockResolvedValue([]);'
    );
  }

  // ====================================================
  // FIX 2: String pattern fixes (V1 missed these)
  // ====================================================
  // /maximum N guests/ → /maksimum N go/  (V1 used capture groups with split/join = no match)
  content = content.replace(/\/maximum (\d+) guests\//g, '/maksimum $1 go/');

  // /Maximum N/ → /aksimum N/  (case-insensitive match for Maksimum/maksimum)
  content = content.replace(/\.toThrow\(\/Maximum (\d+)\/\)/g, '.toThrow(/aksimum $1/)');

  // /Cena za osobę dorosłą/ → /Cena za dorosłego/  (service uses different form)
  content = content.split('/Cena za osob\u0119 doros\u0142\u0105/').join('/Cena za doros\u0142ego/');
  content = content.split('/Cena za osobę dorosłą/').join('/Cena za dorosłego/');

  // 'Cannot cancel completed' → Polish
  content = content.split("'Cannot cancel completed'").join("'Nie mo\u017cna anulowa\u0107 zako\u0144czonej'");
  content = content.split(".toThrow('Cannot cancel completed')").join(".toThrow(/zako\u0144czon/)");

  // 'Status changed' default reason might now be 'Zmiana statusu'
  content = content.split("expect(hist.data.reason).toBe('Status changed')").join("expect(hist.data.reason).toContain('Zmiana statusu')");

  // /already booked/ → /już zarezerwowana/
  content = content.split('/already booked/').join('/ju\u017c zarezerwowana/');

  // ====================================================
  // FIX 3: Fix other reservation test files
  // ====================================================
  // reservation.service.branches2-5: same findMany issue
  // Add findMany to txMock if it only has update+findFirst
  if (content.includes('txMock') && 
      content.includes('reservation: { update: jest.fn(), findFirst: jest.fn() }') &&
      !content.includes('reservation: { update: jest.fn(), findFirst: jest.fn(), findMany: jest.fn()')) {
    content = content.replace(
      'reservation: { update: jest.fn(), findFirst: jest.fn() }',
      'reservation: { update: jest.fn(), findFirst: jest.fn(), findMany: jest.fn() }'
    );
    // Also add txMock.reservation.findMany default in beforeEach after txMock.reservation.findFirst mock
    if (content.includes('txMock.reservation.findFirst.mockResolvedValue') &&
        !content.includes('txMock.reservation.findMany.mockResolvedValue')) {
      content = content.replace(
        /txMock\.reservation\.findFirst\.mockResolvedValue\(null\);/,
        'txMock.reservation.findFirst.mockResolvedValue(null);\n  txMock.reservation.findMany.mockResolvedValue([]);'
      );
    }
  }

  // ====================================================
  // FIX 4: deposit tests - remaining English
  // ====================================================
  // 'already paid' / 'already been paid'
  content = content.replace(
    /\.toThrow\('Deposit has already been paid'\)/g,
    '.toThrow(/ju\u017c.*op\u0142acon/)'
  );
  content = content.replace(
    /\.toThrow\('already been paid'\)/g,
    '.toThrow(/ju\u017c.*op\u0142acon/)'
  );

  // 'Cannot cancel paid deposit' → Polish
  content = content.replace(
    /\.toThrow\('Cannot cancel paid deposit'\)/g,
    '.toThrow(/op\u0142acon/)'
  );

  // deposit 'already paid' → 'już oznaczona jako opłacona'
  content = content.replace(
    /\.toThrow\(['"].*already.*paid.*['"]\)/g,
    '.toThrow(/ju\u017c.*op\u0142acon/)'
  );

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    const lines = original.split('\n').filter((l, i) => l !== content.split('\n')[i]).length;
    console.log(`  \u2705 ${path.relative(TEST_DIR, filePath)} (${lines} lines)`);
    totalChanged++;
  }
}

console.log(`\n\u2705 V5b done! ${totalChanged} files modified.`);
