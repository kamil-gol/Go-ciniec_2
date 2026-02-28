import PDFDocument from 'pdfkit';
import { MenuReport, ReservationWithMenu } from '../types/menu-report.types';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';

interface PdfContext {
  regularFont: string;
  boldFont: string;
  italicFont: string;
}

const PAGE_MARGIN = 40;
const COLUMN_WIDTH = 250;
const COLUMN_GAP = 15;
const LEFT_COLUMN_X = PAGE_MARGIN;
const RIGHT_COLUMN_X = LEFT_COLUMN_X + COLUMN_WIDTH + COLUMN_GAP;

export class PdfMenuPreparationsBuilder {
  private doc: typeof PDFDocument;
  private ctx: PdfContext;

  constructor() {
    this.doc = new PDFDocument({ 
      size: 'A4', 
      margin: PAGE_MARGIN,
      bufferPages: true 
    });
    
    this.ctx = {
      regularFont: 'Helvetica',
      boldFont: 'Helvetica-Bold',
      italicFont: 'Helvetica-Oblique',
    };
  }

  private renderHeader(report: MenuReport): void {
    const doc = this.doc;
    const ctx = this.ctx;

    // Title
    doc.font(ctx.boldFont).fontSize(18);
    doc.text('RAPORT MENU — PRZYGOTOWANIA', PAGE_MARGIN, PAGE_MARGIN, {
      align: 'center',
      width: doc.page.width - 2 * PAGE_MARGIN,
    });

    doc.moveDown(0.5);

    // Period and details
    doc.font(ctx.regularFont).fontSize(10);
    const periodStr = `Okres: ${format(new Date(report.startDate), 'yyyy-MM-dd', { locale: pl })} - ${format(new Date(report.endDate), 'yyyy-MM-dd', { locale: pl })}`;
    const detailsStr = `Widok szczegółowy | Wygenerowano: ${format(new Date(), 'dd.MM.yyyy', { locale: pl })}`;
    
    doc.text(periodStr + '  |  ' + detailsStr, {
      align: 'center',
    });

    doc.moveDown(1);

    // Summary table
    const tableY = doc.y;
    const colWidths = [130, 130, 130, 130];
    const headers = ['Rezerwacje z menu', 'Łącznie gości', 'Top pakiet', 'Goście (D / Dz / M)'];
    
    doc.font(ctx.boldFont).fontSize(9);
    let xPos = PAGE_MARGIN;
    headers.forEach((header, i) => {
      doc.text(header, xPos, tableY, { width: colWidths[i], align: 'center' });
      xPos += colWidths[i];
    });

    doc.moveDown(0.5);
    const valuesY = doc.y;
    
    doc.font(ctx.regularFont).fontSize(11);
    xPos = PAGE_MARGIN;
    const values = [
      report.totalReservations.toString(),
      report.totalGuests.toString(),
      `${report.topPackage} (${report.topPackageCount})`,
      `${report.adultsCount} / ${report.childrenCount} / ${report.infantsCount}`,
    ];
    
    values.forEach((value, i) => {
      doc.text(value, xPos, valuesY, { width: colWidths[i], align: 'center' });
      xPos += colWidths[i];
    });

    doc.moveDown(1.5);
  }

  private renderReservationCard(
    reservation: ReservationWithMenu,
    x: number,
    y: number,
    columnWidth: number
  ): number {
    const doc = this.doc;
    const ctx = this.ctx;
    const startY = y;

    // Reservation header
    doc.font(ctx.boldFont).fontSize(11);
    const headerText = `${reservation.clientName} | ${reservation.hallName} | ${reservation.timeRange} | ${reservation.totalGuests} os. (${reservation.adultCount}D + ${reservation.childCount}Dz + ${reservation.infantCount}M)`;
    
    doc.text(headerText, x, y, {
      width: columnWidth,
      lineGap: 1,
    });

    y = doc.y + 7;

    // Package info
    doc.font(ctx.italicFont).fontSize(8);
    doc.text(`Pakiet: ${reservation.packageName}`, x, y, { width: columnWidth });
    y = doc.y + 7;

    // Render courses
    for (const course of reservation.courses) {
      // Course header (no bar, just bold text)
      doc.font(ctx.boldFont).fontSize(8);
      doc.text(course.courseName, x, y, { width: columnWidth });
      y = doc.y + 1;

      // Dishes
      doc.font(ctx.regularFont).fontSize(7);
      for (const dish of course.dishes) {
        const dishText = `• ${dish.dishName}`;
        const textHeight = doc.heightOfString(dishText, { width: columnWidth });
        doc.text(dishText, x, y, { width: columnWidth });
        y += textHeight + 1;
      }

      y += 1; // Space between courses
    }

    y += 3; // Space after reservation

    return y - startY; // Return height used
  }

  public renderDetailedView(report: MenuReport): void {
    const doc = this.doc;
    
    this.renderHeader(report);

    // Group reservations by date
    const byDate: Map<string, ReservationWithMenu[]> = new Map();
    for (const res of report.reservations) {
      const dateKey = format(new Date(res.eventDate), 'yyyy-MM-dd', { locale: pl });
      if (!byDate.has(dateKey)) {
        byDate.set(dateKey, []);
      }
      byDate.get(dateKey)!.push(res);
    }

    // Render each day
    for (const [dateKey, reservations] of byDate.entries()) {
      // Day header
      doc.font(this.ctx.boldFont).fontSize(16);
      const dayStr = format(new Date(dateKey), 'EEEE, d MMMM yyyy', { locale: pl });
      doc.text(dayStr.charAt(0).toUpperCase() + dayStr.slice(1), PAGE_MARGIN, doc.y, {
        width: doc.page.width - 2 * PAGE_MARGIN,
        align: 'left',
      });
      doc.moveDown(1);

      // Split reservations into pairs for 2-column layout
      for (let i = 0; i < reservations.length; i += 2) {
        const leftRes = reservations[i];
        const rightRes = reservations[i + 1];

        const startY = doc.y;

        // Check if we need new page
        if (startY + 200 > doc.page.height - PAGE_MARGIN) {
          doc.addPage();
        }

        // Render left column
        const leftHeight = this.renderReservationCard(
          leftRes,
          LEFT_COLUMN_X,
          startY,
          COLUMN_WIDTH
        );

        // Render right column (if exists)
        let rightHeight = 0;
        if (rightRes) {
          rightHeight = this.renderReservationCard(
            rightRes,
            RIGHT_COLUMN_X,
            startY,
            COLUMN_WIDTH
          );
        }

        // Move cursor down by the taller column
        const maxHeight = Math.max(leftHeight, rightHeight);
        doc.y = startY + maxHeight;

        // Add separator between pairs
        if (i + 2 < reservations.length) {
          doc.y += 3;
        }
      }

      // Space after day
      doc.moveDown(2);
    }
  }

  public renderSummaryView(report: MenuReport): void {
    const doc = this.doc;
    const ctx = this.ctx;

    this.renderHeader(report);

    // Build aggregated data
    interface DishAgg {
      dishName: string;
      totalPortions: number;
      adults: number;
      children: number;
      infants: number;
      clients: string[];
    }

    const courseMap: Map<string, Map<string, DishAgg>> = new Map();

    for (const res of report.reservations) {
      for (const course of res.courses) {
        if (!courseMap.has(course.courseName)) {
          courseMap.set(course.courseName, new Map());
        }
        const dishMap = courseMap.get(course.courseName)!;

        for (const dish of course.dishes) {
          if (!dishMap.has(dish.dishName)) {
            dishMap.set(dish.dishName, {
              dishName: dish.dishName,
              totalPortions: 0,
              adults: 0,
              children: 0,
              infants: 0,
              clients: [],
            });
          }

          const agg = dishMap.get(dish.dishName)!;
          agg.totalPortions += dish.portions;
          agg.adults += dish.adultsCount;
          agg.children += dish.childrenCount;
          agg.infants += dish.infantsCount;
          
          const clientStr = `${res.clientName} (${dish.portions})`;
          if (!agg.clients.includes(clientStr)) {
            agg.clients.push(clientStr);
          }
        }
      }
    }

    // Render summary
    for (const [courseName, dishMap] of courseMap.entries()) {
      // Category header
      doc.font(ctx.boldFont).fontSize(11).fillColor('#8B4513');
      doc.text(courseName.toUpperCase(), PAGE_MARGIN, doc.y, {
        width: doc.page.width - 2 * PAGE_MARGIN,
      });
      doc.fillColor('#000000');
      doc.moveDown(0.2);

      // Table header
      const colW = [200, 60, 60, 60, 60, 180];
      const tableX = PAGE_MARGIN;
      let currentY = doc.y;

      doc.font(ctx.boldFont).fontSize(8).fillColor('#FFFFFF');
      doc.rect(tableX, currentY, doc.page.width - 2 * PAGE_MARGIN, 14).fill('#2F4F4F');
      
      doc.fillColor('#FFFFFF');
      doc.text('Danie', tableX + 3, currentY + 3, { width: colW[0] - 6, lineBreak: false });
      doc.text('Porcje', tableX + colW[0] + 3, currentY + 3, { width: colW[1] - 6, align: 'center', lineBreak: false });
      doc.text('Dorośli', tableX + colW[0] + colW[1] + 3, currentY + 3, { width: colW[2] - 6, align: 'center', lineBreak: false });
      doc.text('Dziecięce', tableX + colW[0] + colW[1] + colW[2] + 3, currentY + 3, { width: colW[3] - 6, align: 'center', lineBreak: false });
      doc.text('Maluchy', tableX + colW[0] + colW[1] + colW[2] + colW[3] + 3, currentY + 3, { width: colW[4] - 6, align: 'center', lineBreak: false });
      doc.text('Klienci', tableX + colW[0] + colW[1] + colW[2] + colW[3] + colW[4] + 3, currentY + 3, { width: colW[5] - 6, lineBreak: false });

      currentY += 14;
      doc.fillColor('#000000');

      // Table rows - with dynamic height
      const dishes = Array.from(dishMap.values());
      for (let i = 0; i < dishes.length; i++) {
        const dish = dishes[i];

        // Measure dish name height
        doc.font(ctx.regularFont).fontSize(7);
        const dishNameHeight = doc.heightOfString(dish.dishName, { width: colW[0] - 6 });
        const rowHeight = Math.max(11, dishNameHeight + 4);

        // Background
        if (i % 2 === 0) {
          doc.rect(tableX, currentY, doc.page.width - 2 * PAGE_MARGIN, rowHeight).fill('#F5F5F5');
        }
        doc.fillColor('#000000');

        // Dish name
        doc.font(ctx.regularFont).fontSize(7);
        doc.text(dish.dishName, tableX + 3, currentY + 2, { width: colW[0] - 6 });

        // Numbers
        doc.text(dish.totalPortions.toString(), tableX + colW[0] + 3, currentY + 2, { width: colW[1] - 6, align: 'center' });
        doc.text(dish.adults.toString(), tableX + colW[0] + colW[1] + 3, currentY + 2, { width: colW[2] - 6, align: 'center' });
        doc.text(dish.children.toString(), tableX + colW[0] + colW[1] + colW[2] + 3, currentY + 2, { width: colW[3] - 6, align: 'center' });
        doc.text(dish.infants.toString(), tableX + colW[0] + colW[1] + colW[2] + colW[3] + 3, currentY + 2, { width: colW[4] - 6, align: 'center' });

        // Clients
        doc.font(ctx.regularFont).fontSize(6);
        doc.text(dish.clients.join(', '), tableX + colW[0] + colW[1] + colW[2] + colW[3] + colW[4] + 3, currentY + 2, { width: colW[5] - 6 });

        currentY += rowHeight;
      }

      doc.y = currentY + 8;
    }
  }

  public getDocument(): typeof PDFDocument {
    return this.doc;
  }
}
