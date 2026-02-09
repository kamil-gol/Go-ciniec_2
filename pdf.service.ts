import PDFDocument from 'pdfkit';
import type { Reservation } from '@prisma/client';

export class PDFService {
  generateReservationPDF(reservation: any): PDFKit.PDFDocument {
    // Utwórz nowy dokument z odpowiednimi ustawieniami
    const doc = new PDFDocument({
      size: 'A4',
      margin: 50,
      bufferPages: true,
      autoFirstPage: true,
      info: {
        Title: 'Potwierdzenie Rezerwacji',
        Author: 'Gościniec Rodzinny',
      },
    });

    // Użyj wbudowanego fontu z obsługą Unicode
    // PDFKit ma wbudowane fonty: Helvetica, Times-Roman, Courier
    // Dla polskich znaków użyjemy Helvetica (podstawowa obsługa)
    doc.font('Helvetica');

    // === HEADER ===
    doc.fontSize(24)
      .fillColor('#2c5530')
      .text('Gościniec Rodzinny', { align: 'center' });

    doc.fontSize(10)
      .fillColor('#666666')
      .text('ul. Przyk & Fòwa 123, 00-000 Miasto', { align: 'center' })
      .text('Tel: +48 123 456 789 | Email: kontakt@gosciniecrodzinny.pl', { align: 'center' })
      .text('www.gosciniecrodzinny.pl', { align: 'center' })
      .text('NIP: 123-456-78-90', { align: 'center' });

    doc.moveDown(2);

    // === TITLE ===
    doc.fontSize(18)
      .fillColor('#000000')
      .text('POTWIERDZENIE REZERWACJI SALI', { align: 'center' });

    doc.moveDown(1);

    // Numer rezerwacji i data
    doc.fontSize(10)
      .fillColor('#666666')
      .text(`Numer rezerwacji: ${reservation.id}`, { align: 'center' })
      .text(`Data wygenerowania: ${new Date().toLocaleDateString('pl-PL')}`, { align: 'center' });

    doc.moveDown(2);

    // === DANE KLIENTA ===
    doc.fontSize(14)
      .fillColor('#000000')
      .text('Dane klienta', { underline: true });

    doc.moveDown(0.5);

    doc.fontSize(10)
      .fillColor('#333333')
      .text(`Imię i nazwisko: ${reservation.firstName} ${reservation.lastName}`)
      .text(`Email: ${reservation.email}`)
      .text(`Telefon: ${reservation.phone}`);

    doc.moveDown(2);

    // === SZCZEGÓŁY REZERWACJI ===
    doc.fontSize(14)
      .fillColor('#000000')
      .text('Szczegóły rezerwacji', { underline: true });

    doc.moveDown(0.5);

    // Status badge
    const statusColors: Record<string, { bg: string; text: string }> = {
      CONFIRMED: { bg: '#22c55e', text: '#ffffff' },
      PENDING: { bg: '#eab308', text: '#ffffff' },
      CANCELLED: { bg: '#ef4444', text: '#ffffff' },
    };

    const statusLabels: Record<string, string> = {
      CONFIRMED: 'POTWIERDZONA',
      PENDING: 'OCZEKUJĄCA',
      CANCELLED: 'ANULOWANA',
    };

    const statusColor = statusColors[reservation.status] || { bg: '#gray', text: '#ffffff' };
    const statusLabel = statusLabels[reservation.status] || reservation.status;

    const statusX = 50;
    const statusY = doc.y;

    doc.rect(statusX, statusY, 100, 20)
      .fillAndStroke(statusColor.bg, statusColor.bg);

    doc.fillColor(statusColor.text)
      .fontSize(10)
      .text(statusLabel, statusX, statusY + 5, { width: 100, align: 'center' });

    doc.moveDown(2);

    // Szczegóły
    doc.fillColor('#333333')
      .fontSize(10)
      .text(`Sala: ${reservation.hall?.name || 'N/A'}`)
      .text(`Typ wydarzenia: ${reservation.eventType || 'N/A'}`)
      .text(`Data: ${new Date(reservation.eventDate).toLocaleDateString('pl-PL')}`)
      .text(`Godzina: ${reservation.eventStartTime} - ${reservation.eventEndTime}`)
      .text(`Liczba gości: ${reservation.guestCount}`);

    if (reservation.adultsCount || reservation.childrenCount || reservation.infantsCount) {
      doc.text(`  • Dorośli: ${reservation.adultsCount || 0} os.`)
        .text(`  • Dzieci (4-12 lat): ${reservation.childrenCount || 0} os.`)
        .text(`  • Maluchy (0-3 lata): ${reservation.infantsCount || 0} os.`);
    }

    if (reservation.ageOfCelebrant) {
      doc.text(`Wiek jubilata: ${reservation.ageOfCelebrant} lat`);
    }

    doc.moveDown(1);

    if (reservation.specialRequests) {
      doc.text('Uwagi:', { continued: false });
      doc.fontSize(9)
        .fillColor('#666666')
        .text(reservation.specialRequests, { indent: 20 });
    }

    if (reservation.additionalDecorations) {
      doc.fontSize(10)
        .fillColor('#333333')
        .text(`Dodatkowe dekoracje: ${reservation.additionalDecorations}`);
    }

    doc.moveDown(2);

    // === KALKULACJA KOSZTÓW ===
    doc.fontSize(14)
      .fillColor('#000000')
      .text('Kalkulacja kosztów', { underline: true });

    doc.moveDown(0.5);

    const totalPrice = reservation.totalPrice || 0;
    const deposit = reservation.depositAmount || 0;
    const remaining = totalPrice - deposit;

    doc.fontSize(10)
      .fillColor('#333333')
      .text(`Cena całkowita: ${totalPrice.toFixed(2)} zł`)
      .text(`Zaliczka: ${deposit.toFixed(2)} zł`)
      .text(`Do zapłaty: ${remaining.toFixed(2)} zł`, { bold: true });

    // === FOOTER ===
    doc.moveDown(3);
    doc.fontSize(8)
      .fillColor('#999999')
      .text('Dziękujemy za wybranie Gościńca Rodzinnego!', { align: 'center' })
      .text('W razie pytań prosimy o kontakt.', { align: 'center' });

    // Finalizuj dokument
    doc.end();

    return doc;
  }
}
