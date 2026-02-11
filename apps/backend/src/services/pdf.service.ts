import PDFDocument from 'pdfkit';
import { Readable } from 'stream';
import * as fs from 'fs';

interface DishSelection {
  dishId: string;
  dishName: string;
  quantity: number;
  allergens?: string[];
  description?: string;
}

interface CategorySelection {
  categoryId: string;
  categoryName: string;
  dishes: DishSelection[];
}

interface MenuData {
  packageId?: string;
  packageName?: string;
  dishSelections?: CategorySelection[];
  selectedOptions?: any[];
}

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
  menuData?: MenuData;
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

const ALLERGEN_LABELS: Record<string, string> = {
  gluten: 'Gluten',
  lactose: 'Laktoza',
  eggs: 'Jajka',
  nuts: 'Orzechy',
  fish: 'Ryby',
  soy: 'Soja',
  shellfish: 'Skorupiaki',
  peanuts: 'Orzeszki ziemne',
};

export class PDFService {
  // Try multiple font paths (DejaVu fonts for Polish character support)
  private readonly FONT_PATHS = {
    regular: [
      '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
      '/usr/share/fonts/dejavu/DejaVuSans.ttf',
      './fonts/DejaVuSans.ttf',
    ],
    bold: [
      '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
      '/usr/share/fonts/dejavu/DejaVuSans-Bold.ttf',
      './fonts/DejaVuSans-Bold.ttf',
    ],
  };

  private useCustomFonts: boolean = false;
  private fontRegular?: string;
  private fontBold?: string;

  private restaurantData: RestaurantData = {
    name: 'Gosciniec Rodzinny',
    address: 'ul. Przykladowa 123, 00-000 Miasto',
    phone: '+48 123 456 789',
    email: 'kontakt@gosciniecdrodizinny.pl',
    website: 'www.gosciniecrodzinny.pl',
    nip: '123-456-78-90',
  };

  constructor() {
    this.checkFontsAvailability();
  }

  /**
   * Check if custom fonts are available on the system
   */
  private checkFontsAvailability(): void {
    // Check regular font
    for (const path of this.FONT_PATHS.regular) {
      if (fs.existsSync(path)) {
        this.fontRegular = path;
        console.log(`[PDF Service] Found regular font at: ${path}`);
        break;
      }
    }

    // Check bold font
    for (const path of this.FONT_PATHS.bold) {
      if (fs.existsSync(path)) {
        this.fontBold = path;
        console.log(`[PDF Service] Found bold font at: ${path}`);
        break;
      }
    }

    if (this.fontRegular && this.fontBold) {
      this.useCustomFonts = true;
      console.log('[PDF Service] Using custom DejaVu fonts for Polish characters');
    } else {
      console.warn('[PDF Service] DejaVu fonts not found, using built-in fonts (limited Polish character support)');
      console.warn('[PDF Service] To install fonts, run: sudo apt-get install fonts-dejavu-core');
    }
  }

  async generateReservationPDF(reservation: ReservationPDFData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        console.log(`[PDF Service] Generating PDF for reservation ${reservation.id}`);

        const doc = new PDFDocument({
          size: 'A4',
          margin: 50,
          info: {
            Title: `Rezerwacja ${reservation.id}`,
            Author: this.restaurantData.name,
            Subject: 'Potwierdzenie rezerwacji sali',
          },
        });

        // Register custom fonts if available
        if (this.useCustomFonts && this.fontRegular && this.fontBold) {
          try {
            doc.registerFont('DejaVu', this.fontRegular);
            doc.registerFont('DejaVu-Bold', this.fontBold);
            doc.font('DejaVu');
            console.log('[PDF Service] Custom fonts registered successfully');
          } catch (error) {
            console.error('[PDF Service] Failed to register custom fonts:', error);
            this.useCustomFonts = false;
            doc.font('Helvetica');
          }
        } else {
          // Use built-in Helvetica font as fallback
          doc.font('Helvetica');
          console.log('[PDF Service] Using built-in Helvetica font');
        }

        const chunks: Buffer[] = [];

        doc.on('data', (chunk: Buffer) => chunks.push(chunk));
        doc.on('end', () => {
          const buffer = Buffer.concat(chunks);
          console.log(`[PDF Service] PDF generated successfully, size: ${buffer.length} bytes`);
          resolve(buffer);
        });
        doc.on('error', (error) => {
          console.error('[PDF Service] PDF generation error:', error);
          reject(error);
        });

        this.buildPDFContent(doc, reservation);

        doc.end();
      } catch (error) {
        console.error('[PDF Service] Failed to generate PDF:', error);
        reject(error);
      }
    });
  }

  private buildPDFContent(doc: PDFKit.PDFDocument, reservation: ReservationPDFData): void {
    const pageWidth = doc.page.width - 100;

    this.addHeader(doc);

    doc.moveDown(2);
    doc.fontSize(20).font(this.getBoldFont()).text('POTWIERDZENIE REZERWACJI SALI', {
      align: 'center',
    });

    doc.moveDown(0.5);
    doc.fontSize(10).font(this.getRegularFont()).fillColor('#666666');
    doc.text(`Numer rezerwacji: ${reservation.id}`, { align: 'center' });
    doc.text(`Data wygenerowania: ${this.formatDate(new Date())}`, { align: 'center' });

    doc.moveDown(1);
    this.addSeparator(doc);

    // Dane klienta
    doc.moveDown(1);
    doc.fillColor('#000000').fontSize(14).font(this.getBoldFont()).text('Dane klienta');
    doc.moveDown(0.5);
    doc.fontSize(11).font(this.getRegularFont());
    doc.text(`Imie i nazwisko: ${reservation.client.firstName} ${reservation.client.lastName}`);
    if (reservation.client.email) {
      doc.text(`Email: ${reservation.client.email}`);
    }
    doc.text(`Telefon: ${reservation.client.phone}`);
    if (reservation.client.address) {
      doc.text(`Adres: ${reservation.client.address}`);
    }

    doc.moveDown(1);
    this.addSeparator(doc);

    // Szczegoly rezerwacji
    doc.moveDown(1);
    doc.fontSize(14).font(this.getBoldFont()).text('Szczegoly rezerwacji');
    doc.moveDown(0.5);
    doc.fontSize(11).font(this.getRegularFont());

    this.addStatusBadge(doc, reservation.status);
    doc.moveDown(0.5);

    if (reservation.hall) {
      doc.text(`Sala: ${reservation.hall.name}`);
    } else {
      doc.text('Sala: Nie przypisano (lista rezerwowa)');
    }

    const eventTypeName = reservation.customEventType || reservation.eventType?.name || 'Nie okreslono';
    doc.text(`Typ wydarzenia: ${eventTypeName}`);

    if (reservation.startDateTime && reservation.endDateTime) {
      doc.text(`Data: ${this.formatDate(reservation.startDateTime)}`);
      doc.text(`Godzina: ${this.formatTime(reservation.startDateTime)} - ${this.formatTime(reservation.endDateTime)}`);
    } else if (reservation.date && reservation.startTime && reservation.endTime) {
      doc.text(`Data: ${reservation.date}`);
      doc.text(`Godzina: ${reservation.startTime} - ${reservation.endTime}`);
    }

    doc.text(`Liczba gosci: ${reservation.guests}`);
    if (reservation.adults > 0) {
      doc.text(`  - Dorosli: ${reservation.adults} os.`, { indent: 20 });
    }
    if (reservation.children > 0) {
      doc.text(`  - Dzieci (4-12 lat): ${reservation.children} os.`, { indent: 20 });
    }
    if (reservation.toddlers > 0) {
      doc.text(`  - Maluchy (0-3 lata): ${reservation.toddlers} os.`, { indent: 20 });
    }

    if (reservation.birthdayAge) {
      doc.text(`Wiek jubilata: ${reservation.birthdayAge} lat`);
    }
    if (reservation.anniversaryYear) {
      doc.text(`Rocznica: ${reservation.anniversaryYear} lat`);
      if (reservation.anniversaryOccasion) {
        doc.text(`Okazja: ${reservation.anniversaryOccasion}`);
      }
    }

    if (reservation.notes) {
      doc.moveDown(0.5);
      doc.font(this.getBoldFont()).text('Uwagi:');
      doc.font(this.getRegularFont()).text(reservation.notes, { width: pageWidth - 20 });
    }

    // Add menu selection section (NEW!)
    if (reservation.menuData?.dishSelections && reservation.menuData.dishSelections.length > 0) {
      this.addMenuSelectionSection(doc, reservation.menuData, pageWidth);
    }

    doc.moveDown(1);
    this.addSeparator(doc);

    // Kalkulacja kosztow
    doc.moveDown(1);
    doc.fontSize(14).font(this.getBoldFont()).text('Kalkulacja kosztow');
    doc.moveDown(0.5);
    doc.fontSize(11).font(this.getRegularFont());

    if (reservation.menuData?.packageName) {
      doc.font(this.getBoldFont()).text(`Pakiet: ${reservation.menuData.packageName}`);
      doc.font(this.getRegularFont()).moveDown(0.3);
    }

    if (reservation.adults > 0 && reservation.pricePerAdult > 0) {
      const adultTotal = reservation.adults * Number(reservation.pricePerAdult);
      doc.text(
        `Dorosli: ${reservation.adults} os. x ${this.formatCurrency(reservation.pricePerAdult)} = ${this.formatCurrency(adultTotal)}`
      );
    }
    if (reservation.children > 0 && reservation.pricePerChild > 0) {
      const childTotal = reservation.children * Number(reservation.pricePerChild);
      doc.text(
        `Dzieci (4-12 lat): ${reservation.children} os. x ${this.formatCurrency(reservation.pricePerChild)} = ${this.formatCurrency(childTotal)}`
      );
    }
    if (reservation.toddlers > 0 && reservation.pricePerToddler > 0) {
      const toddlerTotal = reservation.toddlers * Number(reservation.pricePerToddler);
      doc.text(
        `Maluchy (0-3 lata): ${reservation.toddlers} os. x ${this.formatCurrency(reservation.pricePerToddler)} = ${this.formatCurrency(toddlerTotal)}`
      );
    }

    doc.moveDown(0.5);
    doc.fontSize(13).font(this.getBoldFont());
    doc.text(`RAZEM: ${this.formatCurrency(reservation.totalPrice)}`);

    if (reservation.deposit) {
      doc.moveDown(1);
      this.addSeparator(doc);
      doc.moveDown(1);
      doc.fontSize(14).font(this.getBoldFont()).text('Zaliczka');
      doc.moveDown(0.5);
      doc.fontSize(11).font(this.getRegularFont());
      doc.text(`Kwota zaliczki: ${this.formatCurrency(reservation.deposit.amount)}`);
      doc.text(`Termin wplaty: ${reservation.deposit.dueDate}`);
      
      const depositStatus = reservation.deposit.paid ? 'Oplacona' : 'Nieoplacona';
      doc.font(this.getBoldFont()).text(`Status: ${depositStatus}`);
    }

    this.addFooter(doc);
  }

  /**
   * Add menu selection section with dishes grouped by category (NEW!)
   */
  private addMenuSelectionSection(
    doc: PDFKit.PDFDocument,
    menuData: MenuData,
    pageWidth: number
  ): void {
    doc.moveDown(1);
    this.addSeparator(doc);
    doc.moveDown(1);

    doc.fontSize(14).font(this.getBoldFont()).fillColor('#000000').text('Wybrane Dania');
    doc.moveDown(0.5);

    if (!menuData.dishSelections || menuData.dishSelections.length === 0) {
      doc.fontSize(10).font(this.getRegularFont()).fillColor('#999999');
      doc.text('Brak wybranych dan');
      return;
    }

    menuData.dishSelections.forEach((category, categoryIndex) => {
      // Category header
      doc.fontSize(12).font(this.getBoldFont()).fillColor('#2c3e50');
      doc.text(`${category.categoryName} (${category.dishes.length})`);
      doc.moveDown(0.3);

      // Dishes list
      category.dishes.forEach((dish) => {
        doc.fontSize(10).font(this.getRegularFont()).fillColor('#000000');
        
        const quantityText = dish.quantity === Math.floor(dish.quantity)
          ? dish.quantity.toString()
          : dish.quantity.toFixed(1);
        
        doc.text(`  ${quantityText}x ${dish.dishName}`, { indent: 15 });

        // Allergens
        if (dish.allergens && dish.allergens.length > 0) {
          const allergenLabels = dish.allergens
            .map((a) => ALLERGEN_LABELS[a] || a)
            .join(', ');
          doc.fontSize(8).fillColor('#e67e22');
          doc.text(`     Alergeny: ${allergenLabels}`, { indent: 25 });
          doc.fillColor('#000000');
        }

        doc.moveDown(0.2);
      });

      // Add spacing between categories
      if (categoryIndex < menuData.dishSelections!.length - 1) {
        doc.moveDown(0.5);
      }
    });
  }

  private addHeader(doc: PDFKit.PDFDocument): void {
    doc.fontSize(18).font(this.getBoldFont()).fillColor('#2c3e50').text(this.restaurantData.name, {
      align: 'center',
    });

    doc.moveDown(0.3);
    doc.fontSize(9).font(this.getRegularFont()).fillColor('#7f8c8d');
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

  private addSeparator(doc: PDFKit.PDFDocument): void {
    const y = doc.y;
    doc
      .strokeColor('#cccccc')
      .lineWidth(1)
      .moveTo(50, y)
      .lineTo(doc.page.width - 50, y)
      .stroke();
  }

  private addStatusBadge(doc: PDFKit.PDFDocument, status: string): void {
    const statusMap: Record<string, { label: string; color: string }> = {
      RESERVED: { label: 'Lista rezerwowa', color: '#3498db' },
      PENDING: { label: 'Oczekujaca', color: '#f39c12' },
      CONFIRMED: { label: 'Potwierdzona', color: '#27ae60' },
      COMPLETED: { label: 'Zakonczona', color: '#95a5a6' },
      CANCELLED: { label: 'Anulowana', color: '#e74c3c' },
    };

    const statusInfo = statusMap[status] || { label: status, color: '#95a5a6' };
    const x = doc.x;
    const y = doc.y;

    doc
      .rect(x, y, 120, 20)
      .fillAndStroke(statusInfo.color, statusInfo.color);

    doc.fillColor('#ffffff').fontSize(10).font(this.getBoldFont());
    doc.text(statusInfo.label.toUpperCase(), x + 10, y + 5, {
      width: 100,
      align: 'center',
    });

    doc.fillColor('#000000');
    doc.moveDown(1);
  }

  private addFooter(doc: PDFKit.PDFDocument): void {
    const bottomY = doc.page.height - 100;

    doc.fontSize(8).fillColor('#7f8c8d').font(this.getRegularFont());
    doc.text(
      'Dziekujemy za wybranie naszej restauracji. W razie pytan prosimy o kontakt.',
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

  private getRegularFont(): string {
    return this.useCustomFonts ? 'DejaVu' : 'Helvetica';
  }

  private getBoldFont(): string {
    return this.useCustomFonts ? 'DejaVu-Bold' : 'Helvetica-Bold';
  }

  private formatDate(date: Date): string {
    return new Intl.DateTimeFormat('pl-PL', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(date);
  }

  private formatTime(date: Date): string {
    return new Intl.DateTimeFormat('pl-PL', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  }

  private formatCurrency(amount: number | string): string {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN',
    }).format(numAmount);
  }
}

export const pdfService = new PDFService();
