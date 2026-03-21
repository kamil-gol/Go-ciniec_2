/**
 * 📝 Document Templates Seed
 *
 * Creates 10 default document templates:
 *   - 3× RESERVATION_PDF (terms, payment, footer)
 *   - 3× CATERING_PDF (terms, payment, kitchen header)
 *   - 2× EMAIL (confirmation, catering quote)
 *   - 2× POLICY (cancellation, GDPR)
 *
 * Uses upsert by slug — safe to run multiple times.
 *
 * Usage:
 *   npx ts-node prisma/seeds/document-templates.seed.ts
 *
 * Or imported from seed-production.ts / seed-fresh.ts
 */

import { prisma } from '../lib/prisma.js';

interface TemplateDefinition {
  slug: string;
  name: string;
  description: string;
  category: string;
  format?: string;
  content: string;
  availableVars: string[];
  isRequired: boolean;
  displayOrder: number;
}

const TEMPLATE_DEFINITIONS: TemplateDefinition[] = [
  // ═══ RESERVATION_PDF ═══════════════════════════════════════
  {
    slug: 'reservation-pdf-terms',
    name: 'Warunki rezerwacji (PDF)',
    description: 'Warunki i zasady rezerwacji wydrukowane na dokumencie potwierdzenia',
    category: 'RESERVATION_PDF',
    content: `## Warunki rezerwacji

1. Rezerwacja sali **{{hallName}}** na dzień **{{eventDate}}** dla **{{guestCount}}** gości jest wstępna do momentu wpłaty zaliczki.
2. Zaliczka w wysokości **{{depositAmount}} zł** powinna zostać wpłacona do **{{depositDueDate}}**.
3. Brak wpłaty zaliczki w wyznaczonym terminie skutkuje automatycznym anulowaniem rezerwacji.
4. Ostateczna liczba gości musi zostać potwierdzona nie później niż **7 dni** przed datą wydarzenia.
5. {{companyName}} zastrzega sobie prawo do zmiany sali w przypadku zmiany liczby gości wykraczającej poza pojemność wybranej sali.

*Dokument wygenerowany automatycznie dnia {{generatedDate}}.*`,
    availableVars: [
      'hallName', 'eventDate', 'guestCount', 'depositAmount',
      'depositDueDate', 'companyName', 'generatedDate',
    ],
    isRequired: true,
    displayOrder: 1,
  },
  {
    slug: 'reservation-pdf-payment',
    name: 'Informacje o płatności (PDF)',
    description: 'Sekcja płatności w dokumencie rezerwacji — dane do przelewu, harmonogram wpłat',
    category: 'RESERVATION_PDF',
    content: `## Informacje o płatności

**Kwota całkowita:** {{totalPrice}} zł
**Zaliczka:** {{depositAmount}} zł (termin: {{depositDueDate}})
**Pozostała kwota:** {{remainingAmount}} zł (płatna do dnia wydarzenia)

### Dane do przelewu
- **Odbiorca:** {{companyName}}
- **Nr konta:** {{bankAccount}}
- **Tytuł:** Rezerwacja {{eventDate}} — {{clientName}}

### Akceptowane formy płatności
- Przelew bankowy
- BLIK
- Gotówka (w siedzibie obiektu)

W razie pytań dotyczących płatności prosimy o kontakt: **{{companyPhone}}** lub **{{companyEmail}}**.`,
    availableVars: [
      'totalPrice', 'depositAmount', 'depositDueDate', 'remainingAmount',
      'companyName', 'bankAccount', 'eventDate', 'clientName',
      'companyPhone', 'companyEmail',
    ],
    isRequired: true,
    displayOrder: 2,
  },
  {
    slug: 'reservation-pdf-footer',
    name: 'Stopka dokumentu rezerwacji',
    description: 'Stopka wydruku — dane kontaktowe i prawne',
    category: 'RESERVATION_PDF',
    content: `---
**{{companyName}}** | {{companyAddress}} | NIP: {{companyNIP}}
Tel: {{companyPhone}} | Email: {{companyEmail}} | {{companyWebsite}}
*Dokument potwierdzenia rezerwacji nr {{reservationId}} z dnia {{generatedDate}}*`,
    availableVars: [
      'companyName', 'companyAddress', 'companyNIP',
      'companyPhone', 'companyEmail', 'companyWebsite',
      'reservationId', 'generatedDate',
    ],
    isRequired: true,
    displayOrder: 3,
  },

  // ═══ CATERING_PDF ═══════════════════════════════════════════
  {
    slug: 'catering-pdf-terms',
    name: 'Warunki cateringowe (PDF)',
    description: 'Warunki dotyczące menu i cateringu na wydruku oferty',
    category: 'CATERING_PDF',
    content: `## Warunki cateringowe

1. Wybrane menu: **{{menuPackage}}** — cena od osoby: **{{menuPrice}} zł/os.**
2. Liczba gości: **{{adultsCount}}** dorosłych, **{{childrenCount}}** dzieci, **{{toddlersCount}}** maluchów (0–3 lata).
3. Zmiany w wyborze dań możliwe do **14 dni** przed datą wydarzenia.
4. Zmiany liczby gości możliwe do **7 dni** przed datą — po tym terminie naliczana jest pełna stawka.
5. Menu dla dzieci stanowi {{childMenuPercent}}% ceny menu dorosłego.
6. Maluchy (0–3 lata) — bez opłaty za catering.
7. Dania oznaczone jako alergenowe mogą zostać zamienione po wcześniejszym uzgodnieniu.

### Dodatkowe usługi
{{extras}}

*Łączna wartość cateringu: **{{totalCateringPrice}} zł***`,
    availableVars: [
      'menuPackage', 'menuPrice', 'adultsCount', 'childrenCount',
      'toddlersCount', 'childMenuPercent', 'extras', 'totalCateringPrice',
    ],
    isRequired: true,
    displayOrder: 4,
  },
  {
    slug: 'catering-pdf-payment',
    name: 'Płatności za catering (PDF)',
    description: 'Sekcja płatności w dokumencie oferty cateringowej',
    category: 'CATERING_PDF',
    content: `## Płatności za catering

| Pozycja | Kwota |
|---------|-------|
| Menu ({{adultsCount}} × {{menuPrice}} zł) | {{menuSubtotal}} zł |
| Menu dziecięce ({{childrenCount}} × {{childMenuPrice}} zł) | {{childMenuSubtotal}} zł |
| Usługi dodatkowe | {{extrasTotal}} zł |
| **RAZEM** | **{{totalCateringPrice}} zł** |

Kwota cateringu jest wliczona w całkowitą wartość rezerwacji ({{totalPrice}} zł).`,
    availableVars: [
      'adultsCount', 'menuPrice', 'menuSubtotal',
      'childrenCount', 'childMenuPrice', 'childMenuSubtotal',
      'extrasTotal', 'totalCateringPrice', 'totalPrice',
    ],
    isRequired: true,
    displayOrder: 5,
  },
  {
    slug: 'catering-kitchen-header',
    name: 'Nagłówek karty kuchennej',
    description: 'Nagłówek wewnętrznego dokumentu dla kuchni — dane wydarzenia i menu',
    category: 'CATERING_PDF',
    content: `# 🍽️ KARTA KUCHENNA

**Data wydarzenia:** {{eventDate}} | **Godzina serwisu:** {{eventTime}}
**Sala:** {{hallName}} | **Rodzaj:** {{eventType}}
**Osoby:** {{adultsCount}} dorosłych + {{childrenCount}} dzieci + {{toddlersCount}} maluchów
**Pakiet menu:** {{menuPackage}}
**Klient:** {{clientName}} | Tel: {{clientPhone}}

---
### Uwagi specjalne
{{internalNotes}}`,
    availableVars: [
      'eventDate', 'eventTime', 'hallName', 'eventType',
      'adultsCount', 'childrenCount', 'toddlersCount',
      'menuPackage', 'clientName', 'clientPhone', 'internalNotes',
    ],
    isRequired: false,
    displayOrder: 6,
  },

  // ═══ EMAIL ═════════════════════════════════════════════════
  {
    slug: 'email-reservation-confirmation',
    name: 'Email: Potwierdzenie rezerwacji',
    description: 'Treść emaila wysyłanego do klienta po utworzeniu rezerwacji',
    category: 'EMAIL',
    content: `Dzień dobry, **{{clientName}}**,

Potwierdzamy przyjęcie rezerwacji:

### Szczegóły rezerwacji
- **Wydarzenie:** {{eventType}}
- **Data:** {{eventDate}}
- **Godziny:** {{startTime}} — {{endTime}}
- **Sala:** {{hallName}}
- **Goście:** {{guestCount}} (dorośli: {{adults}}, dzieci: {{children}}, maluchy: {{toddlers}})
{{menuSection}}
{{extrasSection}}
{{surchargeSection}}
- **Kwota całkowita:** {{totalPrice}} zł
{{depositSection}}
{{notesSection}}

W razie pytań lub zmian prosimy o kontakt:
📞 {{companyPhone}} | ✉️ {{companyEmail}}

Z poważaniem,
Zespół {{companyName}}`,
    availableVars: [
      'clientName', 'companyName', 'eventType', 'eventDate', 'startTime', 'endTime',
      'hallName', 'guestCount', 'adults', 'children', 'toddlers', 'totalPrice',
      'menuSection', 'extrasSection', 'surchargeSection', 'depositSection', 'notesSection',
      'companyPhone', 'companyEmail',
    ],
    isRequired: true,
    displayOrder: 7,
  },
  {
    slug: 'email-deposit-reminder',
    name: 'Email: Przypomnienie o zaliczce',
    description: 'Przypomnienie o zbliżającym się terminie płatności zaliczki',
    category: 'EMAIL',
    content: `Dzień dobry, **{{clientName}}**,

Przypominamy o zbliżającym się terminie płatności zaliczki:

- **Kwota:** {{depositAmount}} zł
- **Termin płatności:** {{dueDate}} (za {{daysLeft}} dni)
- **Rezerwacja:** {{eventType}} — {{reservationDate}}
- **Sala:** {{hallName}}
- **Liczba gości:** {{guestCount}}

Prosimy o terminowe uregulowanie płatności. W razie pytań prosimy o kontakt.

Z poważaniem,
Zespół {{companyName}}`,
    availableVars: [
      'clientName', 'depositAmount', 'dueDate', 'daysLeft',
      'reservationDate', 'hallName', 'eventType', 'guestCount', 'companyName',
    ],
    isRequired: true,
    displayOrder: 11,
  },
  {
    slug: 'email-deposit-overdue',
    name: 'Email: Zaległa zaliczka',
    description: 'Powiadomienie o przekroczonym terminie płatności zaliczki',
    category: 'EMAIL',
    content: `Dzień dobry, **{{clientName}}**,

Termin płatności zaliczki już minął. Prosimy o jak najszybsze uregulowanie należności:

- **Kwota:** {{depositAmount}} zł
- **Termin płatności:** {{dueDate}} ({{daysOverdue}} dni temu)
- **Rezerwacja:** {{eventType}} — {{reservationDate}}
- **Sala:** {{hallName}}

W przypadku braku wpłaty zastrzegamy sobie prawo do anulowania rezerwacji.

Jeśli płatność została już dokonana, prosimy o informację — zaktualizujemy status w systemie.

Z poważaniem,
Zespół {{companyName}}`,
    availableVars: [
      'clientName', 'depositAmount', 'dueDate', 'daysOverdue',
      'reservationDate', 'hallName', 'eventType', 'companyName',
    ],
    isRequired: true,
    displayOrder: 12,
  },
  {
    slug: 'email-deposit-paid',
    name: 'Email: Potwierdzenie wpłaty zaliczki',
    description: 'Potwierdzenie otrzymania wpłaty zaliczki',
    category: 'EMAIL',
    content: `Dzień dobry, **{{clientName}}**,

Potwierdzamy otrzymanie wpłaty zaliczki:

- **Kwota:** {{depositAmount}} zł
- **Data wpłaty:** {{paidAt}}
- **Metoda:** {{paymentMethod}}
- **Rezerwacja:** {{eventType}} — {{reservationDate}}
- **Sala:** {{hallName}}

Dziękujemy za wpłatę!

Z poważaniem,
Zespół {{companyName}}`,
    availableVars: [
      'clientName', 'depositAmount', 'paidAt', 'paymentMethod',
      'reservationDate', 'hallName', 'eventType', 'companyName',
    ],
    isRequired: true,
    displayOrder: 13,
  },
  {
    slug: 'email-password-reset',
    name: 'Email: Reset hasła',
    description: 'Email z linkiem do resetowania hasła',
    category: 'EMAIL',
    content: `Dzień dobry, **{{firstName}}**,

Otrzymaliśmy prośbę o zresetowanie hasła do Twojego konta.

Kliknij poniższy link, aby ustawić nowe hasło:

[Ustaw nowe hasło]({{resetUrl}})

Link jest ważny przez **{{expiresInMinutes}} minut**. Po tym czasie konieczne będzie wygenerowanie nowego.

Jeśli nie prosiłeś o zmianę hasła, zignoruj tę wiadomość — Twoje konto pozostanie bezpieczne.

Z poważaniem,
Zespół {{companyName}}`,
    availableVars: [
      'firstName', 'resetUrl', 'expiresInMinutes', 'companyName',
    ],
    isRequired: true,
    displayOrder: 14,
  },
  {
    slug: 'email-catering-quote',
    name: 'Email: Wycena cateringu',
    description: 'Treść emaila z ofertą cateringową dla klienta',
    category: 'EMAIL',
    content: `Szanowny/a **{{clientName}}**,

W załączeniu przesyłamy ofertę cateringową dla Państwa wydarzenia.

### Podsumowanie oferty
- **Data:** {{eventDate}}
- **Pakiet menu:** {{menuPackage}}
- **Liczba osób:** {{adultsCount}} dorosłych, {{childrenCount}} dzieci
- **Cena za osobę dorosłą:** {{menuPrice}} zł
- **Usługi dodatkowe:** {{extrasTotal}} zł
- **Łączna wartość:** {{totalCateringPrice}} zł

Oferta jest ważna przez **7 dni** od daty wysłania.

Jeśli chcieliby Państwo omówić zmiany w menu lub mają pytania, prosimy o kontakt:
📞 {{companyPhone}} | ✉️ {{companyEmail}}

Z poważaniem,
Zespół {{companyName}}`,
    availableVars: [
      'clientName', 'eventDate', 'menuPackage', 'adultsCount',
      'childrenCount', 'menuPrice', 'extrasTotal', 'totalCateringPrice',
      'companyPhone', 'companyEmail', 'companyName',
    ],
    isRequired: false,
    displayOrder: 8,
  },

  // ═══ EMAIL_LAYOUT ═════════════════════════════════════════
  {
    slug: 'email-layout-default',
    name: 'Szablon HTML email (layout)',
    description: 'Wrapper HTML dla wszystkich wiadomości email — nagłówek, treść, stopka',
    category: 'EMAIL_LAYOUT',
    format: 'HTML',
    content: `<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{title}}</title>
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
  <style>
    body { margin:0; padding:0; background:#f3f4f6; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; }
    .wrapper { max-width:600px; margin:0 auto; background:#ffffff; border-radius:12px; overflow:hidden; margin-top:32px; margin-bottom:32px; box-shadow:0 4px 6px rgba(0,0,0,0.07); }
    .header { background:linear-gradient(135deg,#e11d48,#f43f5e); padding:32px 40px; }
    .header h1 { color:#fff; margin:0; font-size:22px; font-weight:700; }
    .content { padding:32px 40px; color:#374151; font-size:15px; line-height:1.7; }
    .footer { padding:24px 40px; background:#f9fafb; border-top:1px solid #e5e7eb; text-align:center; color:#9ca3af; font-size:12px; }
  </style>
</head>
<body>
  <span style="display:none;max-height:0;overflow:hidden;">{{preheader}}</span>
  <div class="wrapper">
    <div class="header">
      <h1>🏛️ {{companyName}}</h1>
    </div>
    <div class="content">
      {{content}}
    </div>
    <div class="footer">
      <p>{{footer}}</p>
    </div>
  </div>
</body>
</html>`,
    availableVars: ['title', 'preheader', 'companyName', 'content', 'footer'],
    isRequired: true,
    displayOrder: 1,
  },

  // ═══ PDF_LAYOUT_CONFIG ══════════════════════════════════════
  {
    slug: 'pdf-layout-reservation',
    name: 'Konfiguracja PDF rezerwacji',
    description: 'Układ sekcji, kolejność i kolory w PDF rezerwacji',
    category: 'PDF_LAYOUT_CONFIG',
    format: 'JSON',
    content: JSON.stringify({
      colors: {
        primary: '#1a2332',
        primaryLight: '#2c3e50',
        accent: '#c8a45a',
        success: '#27ae60',
        warning: '#f39c12',
        danger: '#e74c3c',
        info: '#3498db',
        textDark: '#1a2332',
        textMuted: '#7f8c8d',
        textLight: '#bdc3c7',
        border: '#dce1e8',
        bgLight: '#f4f6f9',
      },
      sections: [
        { id: 'header', enabled: true, order: 1 },
        { id: 'title_meta', enabled: true, order: 2 },
        { id: 'client_event', enabled: true, order: 3 },
        { id: 'menu', enabled: true, order: 4 },
        { id: 'extras', enabled: true, order: 5 },
        { id: 'category_extras', enabled: true, order: 6 },
        { id: 'financial_summary', enabled: true, order: 7 },
        { id: 'notes', enabled: true, order: 8 },
        { id: 'important_info', enabled: true, order: 9 },
        { id: 'footer', enabled: true, order: 10 },
      ],
    }, null, 2),
    availableVars: [],
    isRequired: true,
    displayOrder: 1,
  },
  {
    slug: 'pdf-layout-catering',
    name: 'Konfiguracja PDF cateringu',
    description: 'Układ sekcji, kolejność i kolory w PDF cateringu',
    category: 'PDF_LAYOUT_CONFIG',
    format: 'JSON',
    content: JSON.stringify({
      colors: {
        primary: '#1a2332',
        primaryLight: '#2c3e50',
        accent: '#c8a45a',
        success: '#27ae60',
        warning: '#f39c12',
        danger: '#e74c3c',
        info: '#3498db',
        textDark: '#1a2332',
        textMuted: '#7f8c8d',
        textLight: '#bdc3c7',
        border: '#dce1e8',
        bgLight: '#f4f6f9',
      },
      sections: [
        { id: 'header', enabled: true, order: 1 },
        { id: 'title_meta', enabled: true, order: 2 },
        { id: 'client_info', enabled: true, order: 3 },
        { id: 'event_info', enabled: true, order: 4 },
        { id: 'items_table', enabled: true, order: 5 },
        { id: 'totals', enabled: true, order: 6 },
        { id: 'notes', enabled: true, order: 7 },
        { id: 'footer', enabled: true, order: 8 },
      ],
    }, null, 2),
    availableVars: [],
    isRequired: true,
    displayOrder: 2,
  },

  // ═══ POLICY ════════════════════════════════════════════════
  {
    slug: 'policy-cancellation',
    name: 'Regulamin anulacji',
    description: 'Zasady anulowania rezerwacji i zwrotu zaliczki',
    category: 'POLICY',
    content: `## Regulamin anulowania rezerwacji — {{companyName}}

### §1. Anulowanie przez Klienta
1. Anulowanie rezerwacji **powyżej 60 dni** przed datą wydarzenia — zwrot 100% zaliczki.
2. Anulowanie **30–60 dni** przed wydarzeniem — zwrot 50% zaliczki.
3. Anulowanie **poniżej 30 dni** przed wydarzeniem — zaliczka nie podlega zwrotowi.

### §2. Zmiana terminu
1. Jednorazowa zmiana terminu jest możliwa bezpłatnie, jeśli zostanie zgłoszona **min. 30 dni** przed pierwotną datą.
2. Kolejne zmiany terminu podlegają opłacie administracyjnej w wysokości **200 zł**.

### §3. Siła wyższa
W przypadku zdarzeń losowych (klęska żywiołowa, epidemia, żałoba narodowa) strony ustalą nowy termin bez dodatkowych kosztów.

### §4. Anulowanie przez Organizatora
{{companyName}} zastrzega sobie prawo do anulowania rezerwacji w przypadku naruszenia regulaminu obiektu. W takim przypadku zaliczka podlega pełnemu zwrotowi.

*Regulamin obowiązuje od dnia {{effectiveDate}}.*`,
    availableVars: ['companyName', 'effectiveDate'],
    isRequired: true,
    displayOrder: 9,
  },
  {
    slug: 'policy-gdpr',
    name: 'Klauzula RODO',
    description: 'Informacja o przetwarzaniu danych osobowych zgodnie z RODO',
    category: 'POLICY',
    content: `## Klauzula informacyjna RODO

Zgodnie z art. 13 Rozporządzenia Parlamentu Europejskiego i Rady (UE) 2016/679 (RODO) informujemy:

1. **Administrator danych:** {{companyName}}, {{companyAddress}}, NIP: {{companyNIP}}.
2. **Cel przetwarzania:** realizacja usługi rezerwacji i cateringu, wystawianie dokumentów księgowych, kontakt w sprawie rezerwacji.
3. **Podstawa prawna:** art. 6 ust. 1 lit. b) RODO (wykonanie umowy) oraz art. 6 ust. 1 lit. f) (prawnie uzasadniony interes administratora).
4. **Okres przechowywania:** dane przechowywane są przez okres trwania umowy oraz **5 lat** od zakończenia roku kalendarzowego, w którym odbyło się wydarzenie (wymogi podatkowe).
5. **Prawa osoby:** prawo dostępu, sprostowania, usunięcia, ograniczenia przetwarzania, przenoszenia danych oraz wniesienia sprzeciwu.
6. **Kontakt:** W sprawach dotyczących danych osobowych prosimy o kontakt: **{{companyEmail}}**.
7. **Skarga:** Przysługuje prawo wniesienia skargi do Prezesa Urzędu Ochrony Danych Osobowych.

Podanie danych jest dobrowolne, lecz niezbędne do realizacji rezerwacji.`,
    availableVars: [
      'companyName', 'companyAddress', 'companyNIP', 'companyEmail',
    ],
    isRequired: true,
    displayOrder: 10,
  },
];

export async function seedDocumentTemplates(): Promise<number> {
  console.log('📝 Seeding document templates...');
  console.log('═'.repeat(60));

  let count = 0;

  for (const template of TEMPLATE_DEFINITIONS) {
    await prisma.documentTemplate.upsert({
      where: { slug: template.slug },
      update: {
        name: template.name,
        description: template.description,
        category: template.category,
        format: template.format || 'MARKDOWN',
        content: template.content,
        availableVars: template.availableVars,
        isRequired: template.isRequired,
        displayOrder: template.displayOrder,
      },
      create: {
        slug: template.slug,
        name: template.name,
        description: template.description,
        category: template.category,
        format: template.format || 'MARKDOWN',
        content: template.content,
        availableVars: template.availableVars,
        isRequired: template.isRequired,
        displayOrder: template.displayOrder,
      },
    });

    console.log(`  ✅ ${template.category.padEnd(18)} ${template.slug}`);
    count++;
  }

  console.log(`\n📊 Razem: ${count} szablonów`);
  console.log('═'.repeat(60));

  return count;
}

// Allow standalone execution
if (require.main === module) {
  seedDocumentTemplates()
    .then((count) => {
      console.log(`\n🎉 Document templates seed completed! (${count} templates)`);
    })
    .catch((e) => {
      console.error('❌ Document templates seed failed:', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
