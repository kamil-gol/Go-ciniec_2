#!/usr/bin/env node
/**
 * Patch: PDF potwierdzenia wplaty zaliczki (#172)
 *
 * Zmiany w buildPaymentConfirmationPremium (pdf.service.ts):
 * 1. Usuniecie nazwy sali z reservation info box
 * 2. Usuniecie calej sekcji PODSUMOWANIE FINANSOWE
 *
 * Uzycie: node scripts/patch-pdf-payment-confirmation.js
 */

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'apps', 'backend', 'src', 'services', 'pdf.service.ts');

if (!fs.existsSync(filePath)) {
  console.error('\u274c Nie znaleziono pliku:', filePath);
  process.exit(1);
}

let content = fs.readFileSync(filePath, 'utf-8');
const originalLength = content.length;

// ======= Znalezienie metody buildPaymentConfirmationPremium =======
const methodStart = content.indexOf('private buildPaymentConfirmationPremium(');
if (methodStart === -1) {
  console.error('\u274c Nie znaleziono metody buildPaymentConfirmationPremium');
  process.exit(1);
}
console.log('\u2705 Znaleziono metode buildPaymentConfirmationPremium na pozycji', methodStart);

// ======= ZMIANA 1: Usuniecie linii z nazwa sali =======
const hallLine = "    if (data.reservation.hall) resLines.push(`Sala: ${data.reservation.hall}`);";
const hallIdx = content.indexOf(hallLine, methodStart);

if (hallIdx !== -1 && hallIdx < methodStart + 5000) {
  // Usun cala linie (wraz z newline)
  const lineStart = content.lastIndexOf('\n', hallIdx);
  const lineEnd = content.indexOf('\n', hallIdx);
  content = content.substring(0, lineStart) + content.substring(lineEnd);
  console.log('\u2705 Zmiana 1: Usunieto linie z nazwa sali (pozycja ' + hallIdx + ')');
} else {
  console.warn('\u26a0\ufe0f  Zmiana 1: Linia z sala nie znaleziona (moze juz usunieta?)');
}

// ======= ZMIANA 2: Usuniecie sekcji PODSUMOWANIE FINANSOWE =======
// Szukamy unikalnego markera sekcji finansowej w PAYMENT CONFIRMATION
// (nie w reservation builder ktory ma podobna sekcje)
const finMarker = "'PODSUMOWANIE FINANSOWE'";
const finMarkerIdx = content.indexOf(finMarker, methodStart);

if (finMarkerIdx !== -1) {
  // Szukamy poczatku sekcji finansowej - separator + moveDown przed nia
  // Pattern: doc.moveDown(0.4); this.drawSeparator(...); doc.moveDown(0.4); // -- 5. FINANCIAL...
  const searchArea = content.substring(methodStart, finMarkerIdx);
  
  // Znajdz komentarz sekcji 5
  const section5Comment = '// \u2500\u2500 5. FINANCIAL SUMMARY BOX \u2500\u2500';
  const section5Idx = content.indexOf(section5Comment, methodStart);
  
  // Znajdz komentarz sekcji 6 (footer)
  const section6Comment = '// \u2500\u2500 6. FOOTER';
  const section6Idx = content.indexOf(section6Comment, section5Idx || methodStart);
  
  if (section5Idx !== -1 && section6Idx !== -1) {
    // Cofnij sie do separatora przed sekcja 5
    // Szukamy bloku: doc.moveDown(0.4); this.drawSeparator(doc, left, pageWidth); doc.moveDown(0.4);
    const beforeSection5 = content.substring(methodStart, section5Idx);
    const lastSeparatorCall = beforeSection5.lastIndexOf('this.drawSeparator(doc, left, pageWidth);');
    
    let cutStart;
    if (lastSeparatorCall !== -1) {
      // Znajdz doc.moveDown przed separatorem
      const areaBeforeSep = beforeSection5.substring(0, lastSeparatorCall);
      const moveDownBeforeSep = areaBeforeSep.lastIndexOf('doc.moveDown');
      if (moveDownBeforeSep !== -1) {
        // Znajdz poczatek tej linii
        cutStart = methodStart + beforeSection5.lastIndexOf('\n', moveDownBeforeSep) + 1;
      } else {
        cutStart = methodStart + beforeSection5.lastIndexOf('\n', lastSeparatorCall) + 1;
      }
    } else {
      cutStart = methodStart + beforeSection5.lastIndexOf('\n', section5Idx - methodStart) + 1;
    }
    
    // Koniec wycinania: cala linia z komentarzem sekcji 6
    const section6LineEnd = content.indexOf('\n', section6Idx) + 1;
    
    // Nowy komentarz footera
    const newFooterComment = '    // \u2500\u2500 5. FOOTER (sekcja finansowa usunieta - #172) \u2500\u2500\n';
    
    content = content.substring(0, cutStart) + newFooterComment + content.substring(section6LineEnd);
    
    console.log('\u2705 Zmiana 2: Usunieto sekcje PODSUMOWANIE FINANSOWE');
    console.log('   Wycieto od pozycji', cutStart, 'do', section6LineEnd);
  } else {
    console.error('\u274c Nie znaleziono markerow sekcji:');
    if (section5Idx === -1) console.error('   Brak:', section5Comment);
    if (section6Idx === -1) console.error('   Brak:', section6Comment);
    process.exit(1);
  }
} else {
  console.warn('\u26a0\ufe0f  Zmiana 2: Marker PODSUMOWANIE FINANSOWE nie znaleziony');
  console.warn('   Szukano:', finMarker, 'po pozycji', methodStart);
}

// ======= Zapis =======
const diff = originalLength - content.length;
if (diff === 0) {
  console.warn('\n\u26a0\ufe0f  Dlugosc pliku nie zmienila sie');
} else {
  console.log('\nRozmiar:', originalLength, '->', content.length, '(' + (diff > 0 ? '-' : '+') + Math.abs(diff) + ' znakow)');
}

fs.writeFileSync(filePath, content, 'utf-8');
console.log('\n\u2705 Plik zapisany:', filePath);
console.log('\nStruktura PDF po zmianach:');
console.log('  Header banner (OPLACONA) -> Title -> Two-column (Client | Payment)');
console.log('  -> Reservation info box (data+godzina, typ, gosci, nr rez.) -> Footer');
console.log('  [USUNIETO: nazwa sali, podsumowanie finansowe]');
console.log('\nTeraz uruchom:');
console.log('  git add apps/backend/src/services/pdf.service.ts');
console.log('  git commit -m "feat(pdf): remove hall + financial summary from payment confirmation (#172)"');
console.log('  git push');
