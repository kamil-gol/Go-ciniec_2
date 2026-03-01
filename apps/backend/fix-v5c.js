#!/usr/bin/env node
/**
 * V5c: Unconditionally add db.reservation.findMany mock to main beforeEach.
 *
 * V5b bug: condition `!content.includes('findMany.mockResolvedValue')` was
 * false because the mock existed in getReservations section, not main beforeEach.
 *
 * This script: for EVERY reservation test file, insert
 * db.reservation.findMany.mockResolvedValue([]) right after
 * db.reservation.findFirst.mockResolvedValue(null) — but only if not
 * already followed by findMany on the next line.
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

  // Only process reservation-related test files
  if (!path.basename(filePath).includes('reservation')) continue;

  // Insert findMany mock after findFirst mock, but only if next line is NOT already findMany
  content = content.replace(
    /(db\.reservation\.findFirst\.mockResolvedValue\(null\);)\n(?!\s*db\.reservation\.findMany)/g,
    '$1\n  db.reservation.findMany.mockResolvedValue([]);\n'
  );

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    const lines = original.split('\n').filter((l, i) => l !== content.split('\n')[i]).length;
    console.log(`  \u2705 ${path.relative(TEST_DIR, filePath)} (${lines} lines changed)`);
    totalChanged++;
  }
}

console.log(`\n\u2705 V5c done! ${totalChanged} files modified.`);
