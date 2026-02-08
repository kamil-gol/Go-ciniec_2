# PDF Generation Service

## Overview

Professional PDF generation service for reservation confirmations. Creates beautifully formatted PDF documents with complete reservation details, pricing breakdowns, and deposit information.

## Features

- ✅ Professional A4 format
- ✅ Restaurant branding (name, logo, contact info)
- ✅ Complete reservation details
- ✅ Guest breakdown (adults, children, toddlers)
- ✅ Detailed price calculation
- ✅ Status badges with colors
- ✅ Deposit information
- ✅ Polish language formatting
- ✅ Event-specific details (birthday, anniversary)

## API Endpoint

```
GET /api/reservations/:id/pdf
```

### Request

**Headers:**
```
Authorization: Bearer <token>
```

**Parameters:**
- `id` (string, required) - Reservation UUID

### Response

**Success (200 OK):**
```
Content-Type: application/pdf
Content-Disposition: attachment; filename="rezerwacja_<short_id>.pdf"
Content-Length: <size>

<PDF Binary Data>
```

**Error (404 Not Found):**
```json
{
  "success": false,
  "error": "Reservation not found"
}
```

**Error (500 Internal Server Error):**
```json
{
  "success": false,
  "error": "Failed to generate PDF"
}
```

## PDF Content Structure

### 1. Header
- Restaurant name (large, bold)
- Address
- Phone & Email
- Website
- NIP (tax ID)

### 2. Title Section
- "POTWIERDZENIE REZERWACJI SALI" (centered, bold)
- Reservation ID
- Generation date

### 3. Client Data
- Full name
- Email (if available)
- Phone number
- Address (if available)

### 4. Reservation Details
- Status badge (colored)
- Hall name (or "Lista rezerwowa" if not assigned)
- Event type (with custom type support)
- Date & Time
- Guest count breakdown:
  - Adults
  - Children (4-12 years)
  - Toddlers (0-3 years)
- Special event details:
  - Birthday age (if birthday event)
  - Anniversary year & occasion (if anniversary)
- Notes (if any)

### 5. Pricing Section
- Price per adult × adults count
- Price per child × children count
- Price per toddler × toddlers count
- **TOTAL** (bold)

### 6. Deposit Info (if applicable)
- Deposit amount
- Payment deadline
- Payment status (✓ Opłacona / ✗ Nieopłacona)

### 7. Footer
- Thank you message
- Automated generation notice

## Status Badge Colors

| Status | Label | Color |
|--------|-------|-------|
| RESERVED | Lista rezerwowa | Blue (#3498db) |
| PENDING | Oczekująca | Orange (#f39c12) |
| CONFIRMED | Potwierdzona | Green (#27ae60) |
| COMPLETED | Zakończona | Gray (#95a5a6) |
| CANCELLED | Anulowana | Red (#e74c3c) |

## Usage Examples

### Frontend (Axios)

```typescript
// Download PDF
const downloadPDF = async (reservationId: string) => {
  try {
    const response = await axios.get(
      `/api/reservations/${reservationId}/pdf`,
      {
        responseType: 'blob',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `rezerwacja_${reservationId.substring(0, 8)}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  } catch (error) {
    console.error('Failed to download PDF:', error);
  }
};
```

### Backend (Direct Service Usage)

```typescript
import { pdfService } from './services/pdf.service';

// Generate PDF
const reservation = await reservationService.getReservationById(id);
const pdfBuffer = await pdfService.generateReservationPDF(reservation);

// Save to file system
fs.writeFileSync(`rezerwacja_${id}.pdf`, pdfBuffer);

// Or send via email
await emailService.sendEmail({
  to: reservation.client.email,
  subject: 'Potwierdzenie rezerwacji',
  text: 'W załączniku znajdziesz potwierdzenie rezerwacji.',
  attachments: [
    {
      filename: `rezerwacja_${id}.pdf`,
      content: pdfBuffer,
    },
  ],
});
```

## Configuration

Restaurant data is hardcoded in `pdf.service.ts`. To customize:

```typescript
private restaurantData: RestaurantData = {
  name: 'Your Restaurant Name',
  address: 'Your Address',
  phone: '+48 XXX XXX XXX',
  email: 'contact@restaurant.com',
  website: 'www.restaurant.com',
  nip: 'XXX-XXX-XX-XX',
};
```

**TODO:** Move to environment variables or database configuration.

## Dependencies

```json
{
  "dependencies": {
    "pdfkit": "^0.15.0"
  },
  "devDependencies": {
    "@types/pdfkit": "^0.13.4"
  }
}
```

## File Structure

```
apps/backend/src/
├── services/
│   ├── pdf.service.ts          # PDF generation service
│   └── README_PDF.md           # This documentation
├── controllers/
│   └── reservation.controller.ts  # downloadPDF() method
└── routes/
    └── reservation.routes.ts   # GET /:id/pdf route
```

## Testing

### Manual Testing

```bash
# 1. Start backend
cd apps/backend
npm run dev

# 2. Login and get token
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@test.com", "password": "AdminTest123!"}'

# 3. Download PDF
curl -X GET http://localhost:5000/api/reservations/<ID>/pdf \
  -H "Authorization: Bearer <TOKEN>" \
  --output reservation.pdf

# 4. Open PDF
open reservation.pdf
```

### E2E Testing (Playwright)

```typescript
test('should download reservation PDF', async ({ page }) => {
  // Navigate to reservation details
  await page.goto(`/dashboard/reservations/${reservationId}`);

  // Click download button
  const downloadPromise = page.waitForEvent('download');
  await page.click('button:has-text("Pobierz PDF")');
  const download = await downloadPromise;

  // Verify filename
  expect(download.suggestedFilename()).toMatch(/^rezerwacja_.*\.pdf$/);

  // Save file
  await download.saveAs(`./downloads/${download.suggestedFilename()}`);
});
```

## Performance

- **Generation time:** ~50-150ms (depends on content)
- **File size:** ~15-30 KB (typical)
- **Memory usage:** ~2-5 MB (peak during generation)

## Limitations

1. **No logo image:** Currently displays text-only header
2. **Hardcoded branding:** Restaurant data not configurable
3. **Single language:** Polish only
4. **No digital signature:** PDF is not digitally signed

## Future Enhancements

- [ ] Add restaurant logo image
- [ ] Move restaurant data to database/env
- [ ] Multi-language support
- [ ] Digital signature
- [ ] Custom templates per event type
- [ ] QR code with reservation link
- [ ] Email delivery integration
- [ ] Batch PDF generation

## Related Features

- **Email System**: Use PDF as email attachment (see `email.service.ts`)
- **Reservation History**: PDF generation logged in activity log
- **Archive System**: Include PDF in archived reservations

## Support

For issues or questions:
- Check logs: `apps/backend/logs/`
- Review Prisma schema: `apps/backend/prisma/schema.prisma`
- Frontend integration: `apps/frontend/app/reservations/`

---

**Last Updated:** 2026-02-08
**Version:** 1.0.0
**Author:** System
