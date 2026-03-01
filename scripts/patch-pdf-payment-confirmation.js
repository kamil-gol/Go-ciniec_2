#!/usr/bin/env node
/**
 * Patch: PDF potwierdzenia wpłaty zaliczki (#172)
 *
 * Zmiany w buildPaymentConfirmationPremium (pdf.service.ts):
 * 1. Usunięcie nazwy sali z reservation info box
 * 2. Usunięcie całej sekcji PODSUMOWANIE FINANSOWE
 *
 * Użycie: node scripts/patch-pdf-payment-confirmation.js
 */

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'apps', 'backend', 'src', 'services', 'pdf.service.ts');

if (!fs.existsSync(filePath)) {
  console.error('❌ Nie znaleziono pliku:', filePath);
  process.exit(1);
}

let content = fs.readFileSync(filePath, 'utf-8');
const originalLength = content.length;

// === Znalezienie metody buildPaymentConfirmationPremium ===
const methodStart = content.indexOf('private buildPaymentConfirmationPremium(');
if (methodStart === -1) {
  console.error('❌ Nie znaleziono metody buildPaymentConfirmationPremium');
  process.exit(1);
}

// Znalezienie następnej metody (koniec buildPaymentConfirmationPremium)
const nextMethodMarker = '  // \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\n  // \u2588\u2588  PREMIUM MENU CARD';
const nextMethodStart = content.indexOf(nextMethodMarker, methodStart);
if (nextMethodStart === -1) {
  console.error('❌ Nie znaleziono ko\u0144ca metody (PREMIUM MENU CARD marker)');
  console.error('   Pr\u00f3buj\u0119 alternatywnego markera...');
  const altMarker = content.indexOf('private buildMenuCardPremium(', methodStart);
  if (altMarker === -1) {
    console.error('❌ Nie znaleziono metody buildMenuCardPremium');
    process.exit(1);
  }
}

const methodEnd = nextMethodStart !== -1 ? nextMethodStart : content.indexOf('private buildMenuCardPremium(', methodStart);
const methodBody = content.substring(methodStart, methodEnd);

console.log(`\n\u{1F50D} Znaleziono metod\u0119 (pozycja ${methodStart}-${methodEnd}, ${methodBody.length} znak\u00f3w)`);

// === ZMIANA 1: Usuni\u0119cie linii z nazw\u0105 sali ===
const hallLinePattern = /\s*if \(data\.reservation\.hall\) resLines\.push\(`Sala: \$\{data\.reservation\.hall\}`\);\n/;
let modifiedMethod = methodBody;

if (hallLinePattern.test(modifiedMethod)) {
  modifiedMethod = modifiedMethod.replace(hallLinePattern, '\n');
  console.log('\u2705 Zmiana 1: Usuni\u0119to lini\u0119 z nazw\u0105 sali');
} else {
  console.warn('\u26a0\ufe0f  Zmiana 1: Linia z sal\u0105 nie znaleziona (mo\u017ce ju\u017c usuni\u0119ta?)');
}

// === ZMIANA 2: Usuni\u0119cie sekcji PODSUMOWANIE FINANSOWE ===
// Szukamy separatora przed sekcj\u0105 finansow\u0105 i ca\u0142ej sekcji a\u017c do footera
const finSectionComment = '// \u2500\u2500 5. FINANCIAL SUMMARY BOX \u2500\u2500';
const footerComment = '// \u2500\u2500 6. FOOTER \u2500\u2500';

const finIdx = modifiedMethod.indexOf(finSectionComment);
const footerIdx = modifiedMethod.indexOf(footerComment);

if (finIdx !== -1 && footerIdx !== -1) {
  // Znajd\u017a separator przed sekcj\u0105 finansow\u0105 (ostatni wyst\u0119puj\u0105cy przed finIdx)
  const beforeFin = modifiedMethod.substring(0, finIdx);
  const lastSepIdx = beforeFin.lastIndexOf('this.drawSeparator(doc, left, pageWidth);');
  
  let cutStart;
  if (lastSepIdx !== -1) {
    // Cofnij si\u0119 do doc.moveDown przed separatorem
    const beforeSep = beforeFin.substring(0, lastSepIdx);
    const lastMoveDown = beforeSep.lastIndexOf('doc.moveDown');
    cutStart = lastMoveDown !== -1 ? lastMoveDown : lastSepIdx;
    // Znajd\u017a pocz\u0105tek linii
    cutStart = beforeFin.lastIndexOf('\n', cutStart) + 1;
  } else {
    cutStart = beforeFin.lastIndexOf('\n', finIdx) + 1;
  }

  // Koniec wycinania: po footerComment (zachowujemy tre\u015b\u0107 footera)
  const afterFooterComment = modifiedMethod.indexOf('\n', footerIdx) + 1;
  
  const newFooterComment = '    // \u2500\u2500 5. FOOTER (sekcja finansowa usuni\u0119ta na pro\u015bb\u0119 klienta) \u2500\u2500\n';
  
  modifiedMethod = modifiedMethod.substring(0, cutStart) + newFooterComment + modifiedMethod.substring(afterFooterComment);
  console.log('\u2705 Zmiana 2: Usuni\u0119to sekcj\u0119 PODSUMOWANIE FINANSOWE');
} else {
  console.warn('\u26a0\ufe0f  Zmiana 2: Sekcja finansowa nie znaleziona');
  if (finIdx === -1) console.warn('   Brak markera:', finSectionComment);
  if (footerIdx === -1) console.warn('   Brak markera:', footerComment);
}

// === Zapisanie wyniku ===
content = content.substring(0, methodStart) + modifiedMethod + content.substring(methodEnd);

if (content.length === originalLength) {
  console.warn('\n\u26a0\ufe0f  D\u0142ugo\u015b\u0107 pliku nie zmieni\u0142a si\u0119 \u2014 sprawd\u017a czy zmiany zosta\u0142y zastosowane');
} else {
  const diff = originalLength - content.length;
  console.log(`\n\u{1F4CA} Rozmiar: ${originalLength} \u2192 ${content.length} (${diff > 0 ? '-' : '+'}${Math.abs(diff)} znak\u00f3w)`);
}

fs.writeFileSync(filePath, content, 'utf-8');
console.log('\u2705 Plik zapisany:', filePath);
console.log('\n\u{1F3C1} Gotowe! Struktura PDF po zmianach:');
console.log('   Header banner (\"OPLACONA\") \u2192 Title \u2192 Two-column (Client | Payment)');
console.log('   \u2192 Reservation info box (data+godzina, typ, go\u015bci, nr rez.) \u2192 Footer');
console.log('   [USUNI\u0118TO: nazwa sali, podsumowanie finansowe]');
