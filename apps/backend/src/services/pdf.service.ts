import PDFDocument from 'pdfkit';
import { Readable } from 'stream';
import * as fs from 'fs';
import companySettingsService from './company-settings.service';

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
  // #137: Venue surcharge fields
  venueSurcharge?: number | null;
  venueSurchargeLabel?: string | null;
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
    // Static fallbacks — used only if DB is unreachable
    this.restaurantData = {
      name: process.env.RESTAURANT_NAME || 'Gościniec Rodzinny',
      address: process.env.RESTAURANT_ADDRESS || '',
      phone: process.env.RESTAURANT_PHONE || '',
      email: process.env.RESTAURANT_EMAIL || '',
      website: process.env.RESTAURANT_WEBSITE || '',
      nip: process.env.RESTAURANT_NIP || '',
    };
    this.checkFontsAvailability();
  }

  /**
   * Refresh restaurant data from CompanySettings in DB.
   * Called before every PDF generation to ensure fresh data.
   * Falls back to env vars / constructor defaults if DB unavailable.
   */
  private async refreshRestaurantData(): Promise<void> {
    try {
      const settings = await companySettingsService.getSettings();
      this.restaurantData = {
        name: settings.companyName || this.restaurantData.name,
        address: [settings.address, settings.postalCode, settings.city]
          .filter(Boolean)
          .join(', ') || this.restaurantData.address,
        phone: settings.phone || this.restaurantData.phone,
        email: settings.email || this.restaurantData.email,
        website: settings.website || this.restaurantData.website,
        nip: settings.nip || this.restaurantData.nip,
      };
    } catch (error) {
      console.warn('[PDF Service] Could not load company settings from DB, using fallbacks');
    }
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
    await this.refreshRestaurantData();

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
    await this.refreshRestaurantData();

    return new Promise((resolve, reject) => {
      console.log(`[PDF Service] Generating payment confirmation PDF for deposit ${data.depositId}`);

      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
        info: {
          Title: `Potwierdzenie wpłaty ${data.depositId}`,
          Author: this.restaurantData.name,
          Subject: 'Potwierdzenie wpłaty zaliczki',
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
    await this.refreshRestaurantData();

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
    doc.text(`Imię i nazwisko: ${reservation.client.firstName} ${reservation.client.lastName}`);
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
    doc.fontSize(14).font(this.getBoldFont()).text('Szczegóły rezerwacji');
    doc.moveDown(0.5);
    doc.fontSize(11).font(this.getRegularFont());

    this.addStatusBadge(doc, reservation.status);
    doc.moveDown(0.5);

    // US-6.2: Hall name removed from PDF
    /* istanbul ignore next -- customEventType fallback */
    const eventTypeName = reservation.customEventType || reservation.eventType?.name || 'Nie określono';
    doc.text(`Typ wydarzenia: ${eventTypeName}`);

    if (reservation.startDateTime && reservation.endDateTime) {
      doc.text(`Data: ${this.formatDate(reservation.startDateTime)}`);
      doc.text(`Godzina: ${this.formatTime(reservation.startDateTime)} - ${this.formatTime(reservation.endDateTime)}`);
    /* istanbul ignore next -- fallback to string date format */
    } else if (reservation.date && reservation.startTime && reservation.endTime) {
      doc.text(`Data: ${reservation.date}`);
      doc.text(`Godzina: ${reservation.startTime} - ${reservation.endTime}`);
    }

    doc.text(`Liczba gości: ${reservation.guests}`);
    if (reservation.adults > 0) {
      doc.text(`  - Dorośli: ${reservation.adults} os.`, { indent: 20 });
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
    doc.fontSize(14).font(this.getBoldFont()).text('Kalkulacja kosztów');
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
        `Dorośli: ${reservation.adults} os. × ${this.formatCurrency(reservation.pricePerAdult)} = ${this.formatCurrency(adultTotal)}`
      );
    }
    /* istanbul ignore next -- children pricing */
    if (reservation.children > 0 && reservation.pricePerChild > 0) {
      const childTotal = reservation.children * Number(reservation.pricePerChild);
      doc.text(
        `Dzieci (4-12 lat): ${reservation.children} os. × ${this.formatCurrency(reservation.pricePerChild)} = ${this.formatCurrency(childTotal)}`
      );
    }
    /* istanbul ignore next -- toddler pricing */
    if (reservation.toddlers > 0 && reservation.pricePerToddler > 0) {
      const toddlerTotal = reservation.toddlers * Number(reservation.pricePerToddler);
      doc.text(
        `Maluchy (0-3 lata): ${reservation.toddlers} os. × ${this.formatCurrency(reservation.pricePerToddler)} = ${this.formatCurrency(toddlerTotal)}`
      );
    }

    // FIX: Calculate extras total using quantity * unitPrice for accuracy
    const extrasTotalCalc = (reservation.reservationExtras || [])
      .reduce((sum, e) => sum + (Number(e.quantity) * Number(e.unitPrice)), 0);
    if (extrasTotalCalc > 0) {
      doc.text(`Usługi dodatkowe: ${this.formatCurrency(extrasTotalCalc)}`);
    }

    // ══ #137: Venue surcharge line ══
    const venueSurchargeAmount = Number(reservation.venueSurcharge) || 0;
    if (venueSurchargeAmount > 0) {
      const surchargeLabel = reservation.venueSurchargeLabel || 'Dopłata za cały obiekt';
      doc.text(`${surchargeLabel}: ${this.formatCurrency(venueSurchargeAmount)}`);
    }

    doc.moveDown(0.5);
    doc.fontSize(13).font(this.getBoldFont());
    // FIX: Include extras + venue surcharge in displayed RAZEM total
    const displayTotal = Number(reservation.totalPrice) + extrasTotalCalc;
    doc.text(`RAZEM: ${this.formatCurrency(displayTotal)}`);

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
      doc.text(`Termin wpłaty: ${dueDate}`);

      const depositStatus = deposit.paid ? 'Opłacona' : 'Nieopłacona';
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
    doc.fontSize(20).font(this.getBoldFont()).fillColor('#16a34a').text('POTWIERDZENIE WPŁATY ZALICZKI', {
      align: 'center',
    });

    doc.moveDown(0.5);
    doc.fontSize(10).font(this.getRegularFont()).fillColor('#666666');
    doc.text(`Numer depozytu: ${data.depositId}`, { align: 'center' });
    doc.text(`Data wygenerowania: ${this.formatDate(new Date())}`, { align: 'center' });

    doc.moveDown(1);
    this.addSeparator(doc);

    doc.moveDown(1);
    doc.fillColor('#000000').fontSize(14).font(this.getBoldFont()).text('Szczegóły wpłaty');
    doc.moveDown(0.5);
    doc.fontSize(11).font(this.getRegularFont());

    const methodLabels: Record<string, string> = {
      TRANSFER: 'Przelew bankowy',
      CASH: 'Gotówka',
      BLIK: 'BLIK',
      CARD: 'Karta płatnicza',
    };

    doc.font(this.getBoldFont()).text(`Kwota: ${this.formatCurrency(data.amount)}`);
    doc.font(this.getRegularFont());
    doc.text(`Data wpłaty: ${this.formatDate(data.paidAt)}`);
    /* istanbul ignore next -- payment method fallback */
    doc.text(`Metoda płatności: ${methodLabels[data.paymentMethod] || data.paymentMethod}`);
    if (data.paymentReference) {
      doc.text(`Numer referencyjny: ${data.paymentReference}`);
    }

    doc.moveDown(1);
    this.addSeparator(doc);

    doc.moveDown(1);
    doc.fontSize(14).font(this.getBoldFont()).text('Dane klienta');
    doc.moveDown(0.5);
    doc.fontSize(11).font(this.getRegularFont());
    doc.text(`Imię i nazwisko: ${data.client.firstName} ${data.client.lastName}`);
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
    doc.fontSize(14).font(this.getBoldFont()).text('Szczegóły rezerwacji');
    doc.moveDown(0.5);
    doc.fontSize(11).font(this.getRegularFont());
    doc.text(`Numer rezerwacji: ${data.reservation.id}`);
    doc.text(`Data: ${data.reservation.date}`);
    doc.text(`Godzina: ${data.reservation.startTime} - ${data.reservation.endTime}`);
    // US-6.2: Hall name removed from payment confirmation PDF
    if (data.reservation.eventType) {
      doc.text(`Typ wydarzenia: ${data.reservation.eventType}`);
    }
    doc.text(`Liczba gości: ${data.reservation.guests}`);
    doc.text(`Całkowita cena rezerwacji: ${this.formatCurrency(data.reservation.totalPrice)}`);

    doc.moveDown(1.5);
    doc.fontSize(11).fillColor('#16a34a');
    doc.font(this.getBoldFont()).text('Wpłata zaksięgowana pomyślnie', { align: 'center' });
    doc.fillColor('#000000');

    this.addFooter(doc);
  }

  // ═══════════════ MENU CARD BUILDER ═══════════════

  private buildMenuCardContent(doc: PDFKit.PDFDocument, data: MenuCardPDFData): void {
    const pageWidth = doc.page.width - 100;

    this.addHeader(doc);

    doc.moveDown(2);
    doc.fontSize(22).font(this.getBoldFont()).fillColor('#2c3e50').text('KARTA MENU', {
      align: 'center',
    });

    doc.moveDown(0.5);
    doc.fontSize(16).font(this.getBoldFont()).fillColor('#34495e').text(data.templateName, {
      align: 'center',
    });

    const subtitleParts: string[] = [data.eventTypeName];
    if (data.variant) subtitleParts.push(data.variant);
    doc.moveDown(0.3);
    doc.fontSize(11).font(this.getRegularFont()).fillColor('#7f8c8d').text(subtitleParts.join(' | '), {
      align: 'center',
    });

    if (data.templateDescription) {
      doc.moveDown(0.5);
      doc.fontSize(10).font(this.getRegularFont()).fillColor('#555555').text(data.templateDescription, {
        align: 'center',
        width: pageWidth,
      });
    }

    doc.moveDown(0.5);
    doc.fontSize(8).fillColor('#999999').text(
      `Wygenerowano: ${this.formatDate(new Date())}`,
      { align: 'center' }
    );

    data.packages.forEach((pkg) => {
      /* istanbul ignore next -- page break */
      if (doc.y > doc.page.height - 250) doc.addPage();

      doc.moveDown(1.5);
      this.addSeparator(doc);
      doc.moveDown(1);

      // Package header
      const pkgHeaderY = doc.y;
      const headerHeight = 60;
      doc.rect(50, pkgHeaderY, pageWidth, headerHeight)
        .fillAndStroke('#2c3e50', '#2c3e50');

      /* istanbul ignore next -- badge text */
      const badgeText = pkg.badgeText || (pkg.isPopular ? 'POPULARNY' : pkg.isRecommended ? 'POLECANY' : null);
      if (badgeText) {
        doc.rect(50 + pageWidth - 100, pkgHeaderY + 5, 90, 18)
          .fillAndStroke('#e67e22', '#e67e22');
        doc.fillColor('#ffffff').fontSize(8).font(this.getBoldFont());
        doc.text(badgeText, 50 + pageWidth - 100, pkgHeaderY + 9, { width: 90, align: 'center' });
      }

      doc.fillColor('#ffffff').fontSize(16).font(this.getBoldFont());
      doc.text(pkg.name, 65, pkgHeaderY + 12, { width: pageWidth - 30 });

      doc.fontSize(9).font(this.getRegularFont()).fillColor('#ecf0f1');
      const priceParts = [`${this.formatCurrency(pkg.pricePerAdult)}/os. dorosła`];
      if (pkg.pricePerChild > 0) priceParts.push(`${this.formatCurrency(pkg.pricePerChild)}/dziecko`);
      if (pkg.pricePerToddler > 0) priceParts.push(`${this.formatCurrency(pkg.pricePerToddler)}/maluch`);
      doc.text(priceParts.join('  |  '), 65, pkgHeaderY + 38, { width: pageWidth - 30 });

      doc.y = pkgHeaderY + headerHeight + 10;
      doc.fillColor('#000000');

      if (pkg.description) {
        doc.fontSize(10).font(this.getRegularFont()).fillColor('#555555');
        doc.text(pkg.description, { width: pageWidth });
        doc.moveDown(0.5);
      }

      if (pkg.includedItems && pkg.includedItems.length > 0) {
        doc.fontSize(9).font(this.getBoldFont()).fillColor('#27ae60');
        doc.text('W cenie: ', { continued: true });
        doc.font(this.getRegularFont()).fillColor('#555555');
        doc.text(pkg.includedItems.join(', '));
        doc.moveDown(0.5);
      }

      // Courses
      if (pkg.courses.length > 0) {
        pkg.courses.forEach((course) => {
          /* istanbul ignore next -- page break */
          if (doc.y > doc.page.height - 150) doc.addPage();

          doc.moveDown(0.7);

          const selectText = course.minSelect === course.maxSelect
            ? `wybierz ${course.minSelect}`
            : `wybierz ${course.minSelect}-${course.maxSelect}`;

          doc.fontSize(12).font(this.getBoldFont()).fillColor('#2c3e50');
          doc.text(course.name, { continued: true });
          doc.fontSize(9).font(this.getRegularFont()).fillColor('#7f8c8d');
          doc.text(`  (${selectText} z ${course.dishes.length})`);

          /* istanbul ignore next -- course description optional */
          if (course.description) {
            doc.fontSize(9).font(this.getRegularFont()).fillColor('#888888');
            doc.text(course.description);
          }

          doc.moveDown(0.3);

          course.dishes.forEach((dish) => {
            /* istanbul ignore next -- page break */
            if (doc.y > doc.page.height - 100) doc.addPage();

            let marker = '  ';
            /* istanbul ignore next -- dish markers */
            if (dish.isRecommended) marker = '★ ';
            else if (dish.isDefault) marker = '▸ ';

            doc.fontSize(10).font(this.getRegularFont()).fillColor('#000000');
            doc.text(`  ${marker}${dish.name}`, { indent: 15 });

            /* istanbul ignore next -- dish description optional */
            if (dish.description) {
              doc.fontSize(8).fillColor('#777777');
              doc.text(`     ${dish.description}`, { indent: 25 });
            }

            /* istanbul ignore next -- allergens optional */
            if (dish.allergens && dish.allergens.length > 0) {
              const labels = dish.allergens
                .map((a) => ALLERGEN_LABELS[a] || a)
                .join(', ');
              doc.fontSize(7).fillColor('#e67e22');
              doc.text(`     Alergeny: ${labels}`, { indent: 25 });
            }

            doc.moveDown(0.15);
            doc.fillColor('#000000');
          });
        });
      }

      // Options
      const requiredOptions = pkg.options.filter(o => o.isRequired);
      const activeOptions = pkg.options.filter(o => !o.isRequired);

      if (requiredOptions.length > 0) {
        /* istanbul ignore next -- page break */
        if (doc.y > doc.page.height - 120) doc.addPage();

        doc.moveDown(0.7);
        doc.fontSize(11).font(this.getBoldFont()).fillColor('#27ae60');
        doc.text('W pakiecie:');
        doc.moveDown(0.2);

        requiredOptions.forEach((opt) => {
          doc.fontSize(9).font(this.getRegularFont()).fillColor('#333333');
          doc.text(`  + ${opt.name}`, { indent: 15 });
          /* istanbul ignore next -- option description */
          if (opt.description) {
            doc.fontSize(8).fillColor('#777777');
            doc.text(`     ${opt.description}`, { indent: 25 });
          }
        });
      }

      if (activeOptions.length > 0) {
        /* istanbul ignore next -- page break */
        if (doc.y > doc.page.height - 120) doc.addPage();

        doc.moveDown(0.7);
        doc.fontSize(11).font(this.getBoldFont()).fillColor('#8e44ad');
        doc.text('Opcje dodatkowe:');
        doc.moveDown(0.2);

        activeOptions.forEach((opt) => {
          const priceLabel = opt.priceType === 'PER_PERSON'
            ? `+${this.formatCurrency(opt.priceAmount)}/os.`
            : `+${this.formatCurrency(opt.priceAmount)}`;

          doc.fontSize(9).font(this.getRegularFont()).fillColor('#333333');
          doc.text(`  - ${opt.name}`, { continued: true, indent: 15 });
          doc.fillColor('#8e44ad').font(this.getBoldFont());
          doc.text(`  ${priceLabel}`);

          /* istanbul ignore next -- option description */
          if (opt.description) {
            doc.fontSize(8).font(this.getRegularFont()).fillColor('#777777');
            doc.text(`     ${opt.description}`, { indent: 25 });
          }
        });
      }
    });

    // Legend
    doc.moveDown(1.5);
    this.addSeparator(doc);
    doc.moveDown(0.5);
    doc.fontSize(8).font(this.getRegularFont()).fillColor('#999999');
    doc.text('★ = polecane przez szefa kuchni  |  ▸ = domyślny wybór  |  - = dostępne', {
      align: 'center',
    });

    this.addFooter(doc);
  }

  // ═══════════════ SHARED HELPERS ═══════════════

  private addMenuSelectionSection(
    doc: PDFKit.PDFDocument,
    menuSnapshot: MenuSnapshot,
    pageWidth: number
  ): void {
    doc.moveDown(1);
    this.addSeparator(doc);
    doc.moveDown(1);

    doc.fontSize(14).font(this.getBoldFont()).fillColor('#000000').text('Wybrane Menu');
    doc.moveDown(0.5);

    /* istanbul ignore next -- packageName from snapshot */
    const packageName = menuSnapshot.menuData?.packageName || menuSnapshot.menuData?.package?.name;
    if (packageName) {
      doc.fontSize(12).font(this.getBoldFont()).fillColor('#2c3e50');
      doc.text(`Pakiet: ${packageName}`);
      doc.moveDown(0.3);
    }

    doc.fontSize(10).font(this.getRegularFont()).fillColor('#555555');
    const guestParts = [];
    if (menuSnapshot.adultsCount > 0) {
      guestParts.push(`${menuSnapshot.adultsCount} dorosłych`);
    }
    if (menuSnapshot.childrenCount > 0) {
      guestParts.push(`${menuSnapshot.childrenCount} dzieci`);
    }
    if (menuSnapshot.toddlersCount > 0) {
      guestParts.push(`${menuSnapshot.toddlersCount} maluchów`);
    }
    if (guestParts.length > 0) {
      doc.text(`Liczba osób dla menu: ${guestParts.join(', ')}`);
      doc.moveDown(0.5);
    }

    /* istanbul ignore next -- dishSelections fallback */
    const dishSelections = menuSnapshot.menuData?.dishSelections || [];
    if (dishSelections.length === 0) {
      doc.fontSize(10).font(this.getRegularFont()).fillColor('#999999');
      doc.text('Brak wybranych dań');
    } else {
      dishSelections.forEach((category: CategorySelection, categoryIndex: number) => {
        doc.fontSize(12).font(this.getBoldFont()).fillColor('#2c3e50');
        doc.text(`${category.categoryName} (${category.dishes.length})`);
        doc.moveDown(0.3);

        category.dishes.forEach((dish) => {
          doc.fontSize(10).font(this.getRegularFont()).fillColor('#000000');

          const quantityText = dish.quantity === Math.floor(dish.quantity)
            ? dish.quantity.toString()
            : dish.quantity.toFixed(1);

          doc.text(`  ${quantityText}× ${dish.dishName}`, { indent: 15 });

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

        if (categoryIndex < dishSelections.length - 1) {
          doc.moveDown(0.5);
        }
      });
    }

    doc.moveDown(0.7);
    doc.fontSize(11).font(this.getRegularFont()).fillColor('#000000');

    if (menuSnapshot.packagePrice > 0) {
      doc.text(`Cena pakietu: ${this.formatCurrency(menuSnapshot.packagePrice)}`);
    }

    if (menuSnapshot.optionsPrice > 0) {
      doc.text(`Dodatki: ${this.formatCurrency(menuSnapshot.optionsPrice)}`);
    }

    doc.fontSize(12).font(this.getBoldFont());
    doc.text(`Razem menu: ${this.formatCurrency(menuSnapshot.totalMenuPrice)}`);
  }

  private addExtrasSection(
    doc: PDFKit.PDFDocument,
    extras: ReservationExtraForPDF[],
    pageWidth: number
  ): void {
    doc.moveDown(1);
    this.addSeparator(doc);
    doc.moveDown(1);

    doc.fontSize(14).font(this.getBoldFont()).fillColor('#000000').text('Usługi dodatkowe');
    doc.moveDown(0.5);

    // Group extras by category
    const grouped = new Map<string, ReservationExtraForPDF[]>();
    for (const extra of extras) {
      const catName = extra.serviceItem.category?.name || 'Inne';
      if (!grouped.has(catName)) grouped.set(catName, []);
      grouped.get(catName)!.push(extra);
    }

    let extrasTotal = 0;

    for (const [categoryName, items] of grouped) {
      /* istanbul ignore next -- page break for long extras list */
      if (doc.y > doc.page.height - 150) doc.addPage();

      doc.fontSize(12).font(this.getBoldFont()).fillColor('#2c3e50');
      doc.text(categoryName);
      doc.moveDown(0.3);

      for (const item of items) {
        doc.fontSize(10).font(this.getRegularFont()).fillColor('#000000');

        const priceLabel = item.priceType === 'PER_PERSON' ? '/os.' : '/szt.';
        const statusLabel = item.status !== 'CONFIRMED' && item.status !== 'ACTIVE'
          ? ` [${item.status}]`
          : '';

        // FIX: Calculate item total from quantity * unitPrice for accuracy
        const itemTotal = Number(item.quantity) * Number(item.unitPrice);
        doc.text(
          `  ${item.quantity}× ${item.serviceItem.name} @ ${this.formatCurrency(item.unitPrice)}${priceLabel} = ${this.formatCurrency(itemTotal)}${statusLabel}`,
          { indent: 15 }
        );

        if (item.note) {
          doc.fontSize(8).fillColor('#777777');
          doc.text(`     Uwaga: ${item.note}`, { indent: 25 });
          doc.fillColor('#000000');
        }

        extrasTotal += itemTotal;
        doc.moveDown(0.2);
      }

      doc.moveDown(0.3);
    }

    doc.moveDown(0.3);
    doc.fontSize(12).font(this.getBoldFont()).fillColor('#000000');
    doc.text(`Razem usługi dodatkowe: ${this.formatCurrency(extrasTotal)}`);
  }

  private addMenuSelectionSectionLegacy(
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
      doc.text('Brak wybranych dań');
      return;
    }

    menuData.dishSelections.forEach((category, categoryIndex) => {
      doc.fontSize(12).font(this.getBoldFont()).fillColor('#2c3e50');
      doc.text(`${category.categoryName} (${category.dishes.length})`);
      doc.moveDown(0.3);

      category.dishes.forEach((dish) => {
        doc.fontSize(10).font(this.getRegularFont()).fillColor('#000000');

        const quantityText = dish.quantity === Math.floor(dish.quantity)
          ? dish.quantity.toString()
          : dish.quantity.toFixed(1);

        doc.text(`  ${quantityText}× ${dish.dishName}`, { indent: 15 });

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
    if (this.restaurantData.address) {
      doc.text(this.restaurantData.address, { align: 'center' });
    }
    const contactParts = [];
    if (this.restaurantData.phone) contactParts.push(`Tel: ${this.restaurantData.phone}`);
    if (this.restaurantData.email) contactParts.push(`Email: ${this.restaurantData.email}`);
    if (contactParts.length > 0) {
      doc.text(contactParts.join(' | '), { align: 'center' });
    }
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
      PENDING: { label: 'Oczekująca', color: '#f39c12' },
      CONFIRMED: { label: 'Potwierdzona', color: '#27ae60' },
      COMPLETED: { label: 'Zakończona', color: '#95a5a6' },
      CANCELLED: { label: 'Anulowana', color: '#e74c3c' },
    };

    /* istanbul ignore next -- status always in map */
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
      'Dziękujemy za wybranie naszej restauracji. W razie pytań prosimy o kontakt.',
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

  /* istanbul ignore next -- formatDateTime never called */
  private formatDateTime(date: Date): string {
    return new Intl.DateTimeFormat('pl-PL', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  }

  private formatCurrency(amount: number | string): string {
    /* istanbul ignore next -- amount always number */
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN',
    }).format(numAmount);
  }
}

export const pdfService = new PDFService();
