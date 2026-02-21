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

interface MenuSnapshot {
  id: string;
  menuData: any;
  packagePrice: number;
  optionsPrice: number;
  totalMenuPrice: number;
  adultsCount: number;
  childrenCount: number;
  toddlersCount: number;
  selectedAt: Date;
}

interface ReservationExtraForPDF {
  serviceItem: {
    name: string;
    priceType: string;
    category?: { name: string } | null;
  };
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  priceType: string;
  note?: string | null;
  status: string;
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
  extrasTotalPrice?: number;
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
  deposits?: Array<{
    amount: number;
    dueDate: Date | string;
    status: string;
    paid: boolean;
  }>;
  menuData?: MenuData;
  menuSnapshot?: MenuSnapshot;
  reservationExtras?: ReservationExtraForPDF[];
  createdAt: Date;
}

interface PaymentConfirmationData {
  depositId: string;
  amount: number;
  paidAt: Date;
  paymentMethod: string;
  paymentReference?: string;
  client: {
    firstName: string;
    lastName: string;
    email?: string;
    phone: string;
    address?: string;
  };
  reservation: {
    id: string;
    date: string;
    startTime: string;
    endTime: string;
    hall?: string;
    eventType?: string;
    guests: number;
    totalPrice: number;
  };
}

interface RestaurantData {
  name: string;
  address: string;
  phone: string;
  email: string;
  website?: string;
  nip?: string;
}

// ═══════════════ MENU CARD PDF TYPES ═══════════════

interface MenuCardDish {
  name: string;
  description?: string | null;
  allergens?: string[];
  isDefault?: boolean;
  isRecommended?: boolean;
}

interface MenuCardCourse {
  name: string;
  description?: string | null;
  icon?: string | null;
  minSelect: number;
  maxSelect: number;
  dishes: MenuCardDish[];
}

interface MenuCardOption {
  name: string;
  description?: string | null;
  category: string;
  priceType: string;
  priceAmount: number;
  isRequired?: boolean;
}

interface MenuCardPackage {
  name: string;
  description?: string | null;
  shortDescription?: string | null;
  pricePerAdult: number;
  pricePerChild: number;
  pricePerToddler: number;
  isPopular?: boolean;
  isRecommended?: boolean;
  badgeText?: string | null;
  includedItems?: string[];
  courses: MenuCardCourse[];
  options: MenuCardOption[];
}

export interface MenuCardPDFData {
  templateName: string;
  templateDescription?: string | null;
  variant?: string | null;
  eventTypeName: string;
  eventTypeColor?: string | null;
  packages: MenuCardPackage[];
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
  private restaurantData: RestaurantData;

  constructor() {
    this.restaurantData = {
      name: process.env.RESTAURANT_NAME || 'Gosciniec Rodzinny',
      address: process.env.RESTAURANT_ADDRESS || 'ul. Przykladowa 123, 00-000 Miasto',
      phone: process.env.RESTAURANT_PHONE || '+48 123 456 789',
      email: process.env.RESTAURANT_EMAIL || 'kontakt@gosciniecrodzinny.pl',
      website: process.env.RESTAURANT_WEBSITE || 'www.gosciniecrodzinny.pl',
      nip: process.env.RESTAURANT_NIP || '123-456-78-90',
    };
    this.checkFontsAvailability();
  }

  private checkFontsAvailability(): void {
    for (const path of this.FONT_PATHS.regular) {
      if (fs.existsSync(path)) {
        this.fontRegular = path;
        console.log(`[PDF Service] Found regular font at: ${path}`);
        break;
      }
    }

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

  private setupFonts(doc: PDFKit.PDFDocument): void {
    if (this.useCustomFonts && this.fontRegular && this.fontBold) {
      doc.registerFont('DejaVu', this.fontRegular);
      doc.registerFont('DejaVu-Bold', this.fontBold);
      doc.font('DejaVu');
    } else {
      doc.font('Helvetica');
    }
  }

  async generateReservationPDF(reservation: ReservationPDFData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
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

      this.setupFonts(doc);

      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => {
        const buffer = Buffer.concat(chunks);
        console.log(`[PDF Service] PDF generated successfully, size: ${buffer.length} bytes`);
        resolve(buffer);
      });
      /* istanbul ignore next */
      doc.on('error', (error) => reject(error));

      this.buildPDFContent(doc, reservation);
      doc.end();
    });
  }

  async generatePaymentConfirmationPDF(data: PaymentConfirmationData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      console.log(`[PDF Service] Generating payment confirmation PDF for deposit ${data.depositId}`);

      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
        info: {
          Title: `Potwierdzenie wplaty ${data.depositId}`,
          Author: this.restaurantData.name,
          Subject: 'Potwierdzenie wplaty zaliczki',
        },
      });

      this.setupFonts(doc);

      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => {
        const buffer = Buffer.concat(chunks);
        console.log(`[PDF Service] Payment confirmation PDF generated, size: ${buffer.length} bytes`);
        resolve(buffer);
      });
      /* istanbul ignore next */
      doc.on('error', (error) => reject(error));

      this.buildPaymentConfirmationContent(doc, data);
      doc.end();
    });
  }

  // ═══════════════ MENU CARD PDF ═══════════════

  async generateMenuCardPDF(data: MenuCardPDFData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      console.log(`[PDF Service] Generating menu card PDF: ${data.templateName}`);

      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
        bufferPages: true,
        info: {
          Title: `Karta Menu - ${data.templateName}`,
          Author: this.restaurantData.name,
          Subject: 'Karta menu',
        },
      });

      this.setupFonts(doc);

      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => {
        const buffer = Buffer.concat(chunks);
        console.log(`[PDF Service] Menu card PDF generated, size: ${buffer.length} bytes`);
        resolve(buffer);
      });
      /* istanbul ignore next */
      doc.on('error', (error) => reject(error));

      this.buildMenuCardContent(doc, data);
      doc.end();
    });
  }

  // ═══════════════ EXISTING PDF BUILDERS ═══════════════

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

    doc.moveDown(1);
    doc.fontSize(14).font(this.getBoldFont()).text('Szczegoly rezerwacji');
    doc.moveDown(0.5);
    doc.fontSize(11).font(this.getRegularFont());

    this.addStatusBadge(doc, reservation.status);
    doc.moveDown(0.5);

    // US-6.2: Hall name removed from PDF
    /* istanbul ignore next -- customEventType fallback */
    const eventTypeName = reservation.customEventType || reservation.eventType?.name || 'Nie okreslono';
    doc.text(`Typ wydarzenia: ${eventTypeName}`);

    if (reservation.startDateTime && reservation.endDateTime) {
      doc.text(`Data: ${this.formatDate(reservation.startDateTime)}`);
      doc.text(`Godzina: ${this.formatTime(reservation.startDateTime)} - ${this.formatTime(reservation.endDateTime)}`);
    /* istanbul ignore next -- fallback to string date format */
    } else if (reservation.date && reservation.startTime && reservation.endTime) {
      doc.text(`Data: ${reservation.date}`);
      doc.text(`Godzina: ${reservation.startTime} - ${reservation.endTime}`);
    }

    doc.text(`Liczba gosci: ${reservation.guests}`);
    if (reservation.adults > 0) {
      doc.text(`  - Dorosli: ${reservation.adults} os.`, { indent: 20 });
    }
    /* istanbul ignore next -- children display */
    if (reservation.children > 0) {
      doc.text(`  - Dzieci (4-12 lat): ${reservation.children} os.`, { indent: 20 });
    }
    /* istanbul ignore next -- toddlers display */
    if (reservation.toddlers > 0) {
      doc.text(`  - Maluchy (0-3 lata): ${reservation.toddlers} os.`, { indent: 20 });
    }

    /* istanbul ignore next -- birthdayAge rarely present */
    if (reservation.birthdayAge) {
      doc.text(`Wiek jubilata: ${reservation.birthdayAge} lat`);
    }
    /* istanbul ignore next -- anniversaryYear rarely present */
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

    const menuSnapshot = reservation.menuSnapshot;
    if (menuSnapshot && menuSnapshot.menuData) {
      this.addMenuSelectionSection(doc, menuSnapshot, pageWidth);
    /* istanbul ignore next -- legacy menu path */
    } else if (reservation.menuData?.dishSelections && reservation.menuData.dishSelections.length > 0) {
      this.addMenuSelectionSectionLegacy(doc, reservation.menuData, pageWidth);
    }

    // Extras section — service extras attached to reservation
    if (reservation.reservationExtras && reservation.reservationExtras.length > 0) {
      this.addExtrasSection(doc, reservation.reservationExtras, pageWidth);
    }

    doc.moveDown(1);
    this.addSeparator(doc);

    doc.moveDown(1);
    doc.fontSize(14).font(this.getBoldFont()).text('Kalkulacja kosztow');
    doc.moveDown(0.5);
    doc.fontSize(11).font(this.getRegularFont());

    /* istanbul ignore next -- packageName display */
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
    /* istanbul ignore next -- children pricing */
    if (reservation.children > 0 && reservation.pricePerChild > 0) {
      const childTotal = reservation.children * Number(reservation.pricePerChild);
      doc.text(
        `Dzieci (4-12 lat): ${reservation.children} os. x ${this.formatCurrency(reservation.pricePerChild)} = ${this.formatCurrency(childTotal)}`
      );
    }
    /* istanbul ignore next -- toddler pricing */
    if (reservation.toddlers > 0 && reservation.pricePerToddler > 0) {
      const toddlerTotal = reservation.toddlers * Number(reservation.pricePerToddler);
      doc.text(
        `Maluchy (0-3 lata): ${reservation.toddlers} os. x ${this.formatCurrency(reservation.pricePerToddler)} = ${this.formatCurrency(toddlerTotal)}`
      );
    }

    // FIX: Calculate extras total using quantity * unitPrice for accuracy
    const extrasTotalCalc = (reservation.reservationExtras || [])
      .reduce((sum, e) => sum + (Number(e.quantity) * Number(e.unitPrice)), 0);
    if (extrasTotalCalc > 0) {
      doc.text(`Uslugi dodatkowe: ${this.formatCurrency(extrasTotalCalc)}`);
    }

    doc.moveDown(0.5);
    doc.fontSize(13).font(this.getBoldFont());
    doc.text(`RAZEM: ${this.formatCurrency(reservation.totalPrice)}`);

    /* istanbul ignore next -- deposit fallback */
    const deposit = reservation.deposits && reservation.deposits.length > 0
      ? reservation.deposits[0]
      : reservation.deposit;

    if (deposit) {
      doc.moveDown(1);
      this.addSeparator(doc);
      doc.moveDown(1);
      doc.fontSize(14).font(this.getBoldFont()).text('Zaliczka');
      doc.moveDown(0.5);
      doc.fontSize(11).font(this.getRegularFont());
      doc.text(`Kwota zaliczki: ${this.formatCurrency(deposit.amount)}`);

      /* istanbul ignore next -- dueDate type check */
      const dueDate = deposit.dueDate instanceof Date
        ? this.formatDate(deposit.dueDate)
        : deposit.dueDate;
      doc.text(`Termin wplaty: ${dueDate}`);

      const depositStatus = deposit.paid ? 'Oplacona' : 'Nieoplacona';
      doc.font(this.getBoldFont()).text(`Status: ${depositStatus}`);
    }

    this.addFooter(doc);
  }

  private buildPaymentConfirmationContent(
    doc: PDFKit.PDFDocument,
    data: PaymentConfirmationData
  ): void {
    this.addHeader(doc);

    doc.moveDown(2);
    doc.fontSize(20).font(this.getBoldFont()).fillColor('#16a34a').text('POTWIERDZENIE WPLATY ZALICZKI', {
      align: 'center',
    });

    doc.moveDown(0.5);
    doc.fontSize(10).font(this.getRegularFont()).fillColor('#666666');
    doc.text(`Numer depozytu: ${data.depositId}`, { align: 'center' });
    doc.text(`Data wygenerowania: ${this.formatDate(new Date())}`, { align: 'center' });

    doc.moveDown(1);
    this.addSeparator(doc);

    doc.moveDown(1);
    doc.fillColor('#000000').fontSize(14).font(this.getBoldFont()).text('Szczegoly wplaty');
    doc.moveDown(0.5);
    doc.fontSize(11).font(this.getRegularFont());

    const methodLabels: Record<string, string> = {
      TRANSFER: 'Przelew bankowy',
      CASH: 'Gotowka',
      BLIK: 'BLIK',
      CARD: 'Karta platnicza',
    };

    doc.font(this.getBoldFont()).text(`Kwota: ${this.formatCurrency(data.amount)}`);
    doc.font(this.getRegularFont());
    doc.text(`Data wplaty: ${this.formatDate(data.paidAt)}`);
    /* istanbul ignore next -- payment method fallback */
    doc.text(`Metoda platnosci: ${methodLabels[data.paymentMethod] || data.paymentMethod}`);
    if (data.paymentReference) {
      doc.text(`Numer referencyjny: ${data.paymentReference}`);
    }

    doc.moveDown(1);
    this.addSeparator(doc);

    doc.moveDown(1);
    doc.fontSize(14).font(this.getBoldFont()).text('Dane klienta');
    doc.moveDown(0.5);
    doc.fontSize(11).font(this.getRegularFont());
    doc.text(`Imie i nazwisko: ${data.client.firstName} ${data.client.lastName}`);
    if (data.client.email) {
      doc.text(`Email: ${data.client.email}`);
    }
    doc.text(`Telefon: ${data.client.phone}`);
    if (data.client.address) {
      doc.text(`Adres: ${data.client.address}`);
    }

    doc.moveDown(1);
    this.addSeparator(doc);

    doc.moveDown(1);
    doc.fontSize(14).font(this.getBoldFont()).text('Szczegoly rezerwacji');
    doc.moveDown(0.5);
    doc.fontSize(11).font(this.getRegularFont());
    doc.text(`Numer rezerwacji: ${data.reservation.id}`);
    doc.text(`Data: ${data.reservation.date}`);
    doc.text(`Godzina: ${data.reservation.startTime} - ${data.reservation.endTime}`);
    // US-6.2: Hall name removed from payment confirmation PDF
    if (data.reservation.eventType) {
      doc.text(`Typ wydarzenia: ${data.reservation.eventType}`);
    }
    doc.text(`Liczba gosci: ${data.reservation.guests}`);
    doc.text(`Calkowita cena rezerwacji: ${this.formatCurrency(data.reservation.totalPrice)}`);

    doc.moveDown(1.5);
    doc.fontSize(11).fillColor('#16a34a');
    doc.font(this.getBoldFont()).text('Wplata zaksiegowana pomyslnie', {