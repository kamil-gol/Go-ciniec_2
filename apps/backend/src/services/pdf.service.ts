import PDFDocument from 'pdfkit';
import path from 'path';
import { Readable } from 'stream';

interface ReservationPDFData {
  id: string;
  client: {
    firstName: string;
    lastName: string;
    email?: string;
    phone: string;
    address?: string;
  };
  hall?: {
    name: string;
  };
  eventType?: {
    name: string;
  };
  customEventType?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  startDateTime?: Date;
  endDateTime?: Date;
  adults: number;
  children: number;
  toddlers: number;
  guests: number;
  pricePerAdult: number;
  pricePerChild: number;
  pricePerToddler: number;
  totalPrice: number;
  status: string;
  notes?: string;
  birthdayAge?: number;
  anniversaryYear?: number;
  anniversaryOccasion?: string;
  deposit?: {
    amount: number;
    dueDate: string;
    status: string;
    paid: boolean;
  };
  createdAt: Date;
}

interface RestaurantData {
  name: string;
  address: string;
  phone: string;
  email: string;
  website?: string;
  nip?: string;
}

export class PDFService {
  // FIXED: Use absolute path instead of relative path
  private readonly FONT_REGULAR = '/app/fonts/Roboto-Regular.ttf';
  private readonly FONT_BOLD = '/app/fonts/Roboto-Bold.ttf';

  private restaurantData: RestaurantData = {
    name: 'Go\u015bciniec Rodzinny',
    address: 'ul. Przyk\u0142adowa 123, 00-000 Miasto',
    phone: '+48 123 456 789',
    email: 'kontakt@gosciniecdrodizinny.pl',
    website: 'www.gosciniecrodzinny.pl',
    nip: '123-456-78-90',
  };

  /**
   * Generate PDF for reservation
   */
  async generateReservationPDF(reservation: ReservationPDFData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margin: 50,
          info: {
            Title: `Rezerwacja ${reservation.id}`,
            Author: this.restaurantData.name,
            Subject: 'Potwierdzenie rezerwacji sali',
          },
        });

        // Register Roboto fonts for proper UTF-8 support
        doc.registerFont('Roboto', this.FONT_REGULAR);
        doc.registerFont('Roboto-Bold', this.FONT_BOLD);
        doc.font('Roboto');

        const chunks: Buffer[] = [];

        doc.on('data', (chunk: Buffer) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Build PDF content
        this.buildPDFContent(doc, reservation);

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Build PDF content
   */
  private buildPDFContent(doc: PDFKit.PDFDocument, reservation: ReservationPDFData): void {
    const pageWidth = doc.page.width - 100; // Account for margins

    // HEADER
    this.addHeader(doc);

    // TITLE
    doc.moveDown(2);
    doc.fontSize(20).font('Roboto-Bold').text('POTWIERDZENIE REZERWACJI SALI', {
      align: 'center',
    });

    // Reservation ID & Date
    doc.moveDown(0.5);
    doc.fontSize(10).font('Roboto').fillColor('#666666');
    doc.text(`Numer rezerwacji: ${reservation.id}`, { align: 'center' });
    doc.text(`Data wygenerowania: ${this.formatDate(new Date())}`, { align: 'center' });

    // SEPARATOR
    doc.moveDown(1);
    this.addSeparator(doc);

    // CLIENT DATA
    doc.moveDown(1);
    doc.fillColor('#000000').fontSize(14).font('Roboto-Bold').text('Dane klienta');
    doc.moveDown(0.5);
    doc.fontSize(11).font('Roboto');
    doc.text(`Imi\u0119 i nazwisko: ${reservation.client.firstName} ${reservation.client.lastName}`);
    if (reservation.client.email) {
      doc.text(`Email: ${reservation.client.email}`);
    }
    doc.text(`Telefon: ${reservation.client.phone}`);
    if (reservation.client.address) {
      doc.text(`Adres: ${reservation.client.address}`);
    }

    // SEPARATOR
    doc.moveDown(1);
    this.addSeparator(doc);

    // RESERVATION DETAILS
    doc.moveDown(1);
    doc.fontSize(14).font('Roboto-Bold').text('Szczeg\u00f3\u0142y rezerwacji');
    doc.moveDown(0.5);
    doc.fontSize(11).font('Roboto');

    // Status badge
    this.addStatusBadge(doc, reservation.status);

    doc.moveDown(0.5);

    // Hall
    if (reservation.hall) {
      doc.text(`Sala: ${reservation.hall.name}`);
    } else {
      doc.text('Sala: Nie przypisano (lista rezerwowa)');
    }

    // Event Type
    const eventTypeName = reservation.customEventType || reservation.eventType?.name || 'Nie okre\u015blono';
    doc.text(`Typ wydarzenia: ${eventTypeName}`);

    // Date & Time
    if (reservation.startDateTime && reservation.endDateTime) {
      doc.text(`Data: ${this.formatDate(reservation.startDateTime)}`);
      doc.text(`Godzina: ${this.formatTime(reservation.startDateTime)} - ${this.formatTime(reservation.endDateTime)}`);
    } else if (reservation.date && reservation.startTime && reservation.endTime) {
      doc.text(`Data: ${reservation.date}`);
      doc.text(`Godzina: ${reservation.startTime} - ${reservation.endTime}`);
    }

    // Guests breakdown
    doc.text(`Liczba go\u015bci: ${reservation.guests}`);
    if (reservation.adults > 0) {
      doc.text(`  \u2022 Doro\u015bli: ${reservation.adults} os.`, { indent: 20 });
    }
    if (reservation.children > 0) {
      doc.text(`  \u2022 Dzieci (4-12 lat): ${reservation.children} os.`, { indent: 20 });
    }
    if (reservation.toddlers > 0) {
      doc.text(`  \u2022 Maluchy (0-3 lata): ${reservation.toddlers} os.`, { indent: 20 });
    }

    // Birthday/Anniversary details
    if (reservation.birthdayAge) {
      doc.text(`Wiek jubilata: ${reservation.birthdayAge} lat`);
    }
    if (reservation.anniversaryYear) {
      doc.text(`Rocznica: ${reservation.anniversaryYear} lat`);
      if (reservation.anniversaryOccasion) {
        doc.text(`Okazja: ${reservation.anniversaryOccasion}`);
      }
    }

    // Notes
    if (reservation.notes) {
      doc.moveDown(0.5);
      doc.font('Roboto-Bold').text('Uwagi:');
      doc.font('Roboto').text(reservation.notes, { width: pageWidth - 20 });
    }

    // SEPARATOR
    doc.moveDown(1);
    this.addSeparator(doc);

    // PRICING
    doc.moveDown(1);
    doc.fontSize(14).font('Roboto-Bold').text('Kalkulacja koszt\u00f3w');
    doc.moveDown(0.5);
    doc.fontSize(11).font('Roboto');

    // Price breakdown
    if (reservation.adults > 0 && reservation.pricePerAdult > 0) {
      const adultTotal = reservation.adults * Number(reservation.pricePerAdult);
      doc.text(
        `Doro\u015bli: ${reservation.adults} os. \u00d7 ${this.formatCurrency(reservation.pricePerAdult)} = ${this.formatCurrency(adultTotal)}`
      );
    }
    if (reservation.children > 0 && reservation.pricePerChild > 0) {
      const childTotal = reservation.children * Number(reservation.pricePerChild);
      doc.text(
        `Dzieci (4-12 lat): ${reservation.children} os. \u00d7 ${this.formatCurrency(reservation.pricePerChild)} = ${this.formatCurrency(childTotal)}`
      );
    }
    if (reservation.toddlers > 0 && reservation.pricePerToddler > 0) {
      const toddlerTotal = reservation.toddlers * Number(reservation.pricePerToddler);
      doc.text(
        `Maluchy (0-3 lata): ${reservation.toddlers} os. \u00d7 ${this.formatCurrency(reservation.pricePerToddler)} = ${this.formatCurrency(toddlerTotal)}`
      );
    }

    doc.moveDown(0.5);
    doc.fontSize(13).font('Roboto-Bold');
    doc.text(`RAZEM: ${this.formatCurrency(reservation.totalPrice)}`);

    // DEPOSIT INFO
    if (reservation.deposit) {
      doc.moveDown(1);
      this.addSeparator(doc);
      doc.moveDown(1);
      doc.fontSize(14).font('Roboto-Bold').text('Zaliczka');
      doc.moveDown(0.5);
      doc.fontSize(11).font('Roboto');
      doc.text(`Kwota zaliczki: ${this.formatCurrency(reservation.deposit.amount)}`);
      doc.text(`Termin wp\u0142aty: ${reservation.deposit.dueDate}`);
      
      const depositStatus = reservation.deposit.paid ? '\u2713 Op\u0142acona' : '\u2717 Nieop\u0142acona';
      doc.font('Roboto-Bold').text(`Status: ${depositStatus}`);
    }

    // FOOTER
    this.addFooter(doc);
  }

  /**
   * Add header with restaurant info
   */
  private addHeader(doc: PDFKit.PDFDocument): void {
    doc.fontSize(18).font('Roboto-Bold').fillColor('#2c3e50').text(this.restaurantData.name, {
      align: 'center',
    });

    doc.moveDown(0.3);
    doc.fontSize(9).font('Roboto').fillColor('#7f8c8d');
    doc.text(this.restaurantData.address, { align: 'center' });
    doc.text(`Tel: ${this.restaurantData.phone} | Email: ${this.restaurantData.email}`, {
      align: 'center',
    });
    if (this.restaurantData.website) {
      doc.text(this.restaurantData.website, { align: 'center' });
    }
    if (this.restaurantData.nip) {
      doc.text(`NIP: ${this.restaurantData.nip}`, { align: 'center' });
    }
  }

  /**
   * Add separator line
   */
  private addSeparator(doc: PDFKit.PDFDocument): void {
    const y = doc.y;
    doc
      .strokeColor('#cccccc')
      .lineWidth(1)
      .moveTo(50, y)
      .lineTo(doc.page.width - 50, y)
      .stroke();
  }

  /**
   * Add status badge
   */
  private addStatusBadge(doc: PDFKit.PDFDocument, status: string): void {
    const statusMap: Record<string, { label: string; color: string }> = {
      RESERVED: { label: 'Lista rezerwowa', color: '#3498db' },
      PENDING: { label: 'Oczekuj\u0105ca', color: '#f39c12' },
      CONFIRMED: { label: 'Potwierdzona', color: '#27ae60' },
      COMPLETED: { label: 'Zako\u0144czona', color: '#95a5a6' },
      CANCELLED: { label: 'Anulowana', color: '#e74c3c' },
    };

    const statusInfo = statusMap[status] || { label: status, color: '#95a5a6' };
    const x = doc.x;
    const y = doc.y;

    doc
      .rect(x, y, 120, 20)
      .fillAndStroke(statusInfo.color, statusInfo.color);

    doc.fillColor('#ffffff').fontSize(10).font('Roboto-Bold');
    doc.text(statusInfo.label.toUpperCase(), x + 10, y + 5, {
      width: 100,
      align: 'center',
    });

    doc.fillColor('#000000');
    doc.moveDown(1);
  }

  /**
   * Add footer
   */
  private addFooter(doc: PDFKit.PDFDocument): void {
    const bottomY = doc.page.height - 100;

    doc.fontSize(8).fillColor('#7f8c8d').font('Roboto');
    doc.text(
      'Dzi\u0119kujemy za wybranie naszej restauracji. W razie pyta\u0144 prosimy o kontakt.',
      50,
      bottomY,
      {
        align: 'center',
        width: doc.page.width - 100,
      }
    );

    doc.moveDown(0.5);
    doc.fontSize(7).text(
      `Dokument wygenerowany automatycznie przez system ${this.restaurantData.name}`,
      {
        align: 'center',
      }
    );
  }

  /**
   * Format date to Polish format
   */
  private formatDate(date: Date): string {
    return new Intl.DateTimeFormat('pl-PL', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(date);
  }

  /**
   * Format time
   */
  private formatTime(date: Date): string {
    return new Intl.DateTimeFormat('pl-PL', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  }

  /**
   * Format currency to PLN
   */
  private formatCurrency(amount: number | string): string {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN',
    }).format(numAmount);
  }
}

export const pdfService = new PDFService();
