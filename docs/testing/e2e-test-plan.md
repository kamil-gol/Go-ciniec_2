# Plan Testów End-to-End - Moduł Rezerwacje

## 📝 Spis treści

1. [Cel testów](#cel-testów)
2. [Narzędzia](#narzędzia)
3. [Struktura projektów](#struktura-projektów)
4. [Scenariusze testowe](#scenariusze-testowe)
5. [Setup testów](#setup-testów)
6. [Harmonogram](#harmonogram)
7. [Metryki](#metryki)

---

## 1. Cel testów

### 1.1 Zakres
Weryfikacja poprawności wszystkich przepływów użytkownika w module rezerwacji:
- ✅ Tworzenie rezerwacji (z nową/istniejącą klientą)
- ✅ Edycja rezerwacji
- ✅ Zmiana statusów
- ✅ Anulowanie rezerwacji
- ✅ Widok i filtrowanie listy
- ✅ Historia zmian
- ✅ Walidacje

### 1.2 Środowisko
- **Frontend:** http://localhost:3000
- **Backend:** http://localhost:4000
- **Baza danych:** PostgreSQL (testowa instancja)
- **Użytkownik testowy:** admin@test.com / password

---

## 2. Narzędzia

### 2.1 Rekomendowane: Playwright

**Zalety:**
- ✅ Najlepszy dla TypeScript + Next.js
- ✅ Szybki i stabilny
- ✅ Wbudowane czekanie na elementy
- ✅ Wsparcie dla wielu przeglądarek
- ✅ Doskonała dokumentacja
- ✅ Paralelizacja testów
- ✅ Screenshots i video recording

**Instalacja:**
```bash
npm install -D @playwright/test
npx playwright install
```

### 2.2 Alternatywa: Cypress

**Zalety:**
- ✅ Łatwy setup
- ✅ Świetne debugowanie
- ✅ Visual testing
- ✅ Time travel debugging

**Instalacja:**
```bash
npm install -D cypress
npx cypress open
```

---

## 3. Struktura projektów

```
tests/
├── e2e/
│   ├── reservations/
│   │   ├── 01-create-reservation.spec.ts
│   │   ├── 02-create-with-new-client.spec.ts
│   │   ├── 03-edit-reservation.spec.ts
│   │   ├── 04-status-transitions.spec.ts
│   │   ├── 05-cancel-reservation.spec.ts
│   │   ├── 06-list-and-filters.spec.ts
│   │   ├── 07-reservation-history.spec.ts
│   │   ├── 08-validations.spec.ts
│   │   ├── 09-pricing-calculations.spec.ts
│   │   └── 10-deposits.spec.ts
│   ├── clients/
│   │   ├── create-client.spec.ts
│   │   └── client-uniqueness.spec.ts
│   └── auth/
│       └── login.spec.ts
├── fixtures/
│   ├── users.json
│   ├── halls.json
│   ├── clients.json
│   └── event-types.json
├── utils/
│   ├── test-helpers.ts
│   ├── data-factory.ts
│   ├── api-helpers.ts
│   └── page-objects/
│       ├── ReservationListPage.ts
│       ├── CreateReservationPage.ts
│       ├── EditReservationPage.ts
│       └── ReservationDetailsPage.ts
└── playwright.config.ts
```

---

## 4. Scenariusze testowe

### 4.1 Tworzenie Rezerwacji

#### ✅ TC-RES-001: Happy Path - Pełna rezerwacja
**Priorytet:** Krytyczny  
**Czas:** ~3 min  
**Opis:** Utworzenie kompletnej rezerwacji ze wszystkimi danymi

**Pre-conditions:**
- Użytkownik zalogowany jako ADMIN
- W bazie istnieje co najmniej 1 sala
- W bazie istnieje co najmniej 1 klient
- W bazie istnieją typy wydarzeń

**Kroki:**
1. Przejdź do `/reservations`
2. Kliknij "Nowa Rezerwacja"
3. Wybierz salę: "Sala Kameralna"
4. Wybierz klienta z listy
5. Wybierz typ wydarzenia: "Urodziny"
6. Wypełnij: "Które urodziny" = 18
7. Wybierz datę rozpoczęcia: jutro 18:00
8. Sprawdź auto-uzupełnienie końca: jutro 00:00 (+6h)
9. Wypełnij liczbę dorosłych: 40
10. Sprawdź auto-uzupełnienie ceny za dorosłego
11. Wypełnij liczbę dzieci: 10
12. **Sprawdź**: Cena za dziecko = połowa ceny za dorosłego
13. Sprawdź kalkulację: Total = (40 × 100) + (10 × 50) = 4500 PLN
14. Dodaj notatkach: "Rezerwacja testowa"
15. Zaznacz "Dodaj zaliczkę"
16. Kwota zaliczki: 1000 PLN
17. Termin płatności: za tydzień
18. Kliknij "Utwórz Rezerwację"

**Expected Result:**
- ✅ Toast: "Rezerwacja utworzona pomyślnie"
- ✅ Przekierowanie do `/reservations`
- ✅ Nowa rezerwacja widoczna na liście
- ✅ Status: "Oczekująca" (pomarańczowy badge)
- ✅ W bazie: wpis w historii z typem `CREATED`

**Test Code:**
```typescript
test('TC-RES-001: Create full reservation', async ({ page }) => {
  const createPage = new CreateReservationPage(page);
  
  await page.goto('/reservations');
  await page.click('text=Nowa Rezerwacja');
  
  // Fill form
  await createPage.selectHall('Sala Kameralna');
  await createPage.selectClient(1);
  await createPage.selectEventType('Urodziny');
  await createPage.fillBirthdayAge('18');
  
  // DateTime
  const tomorrow = addDays(new Date(), 1);
  await createPage.fillStartDateTime(tomorrow, '18:00');
  
  // Verify auto-filled end time (+6h)
  const endTime = await createPage.getEndDateTime();
  expect(endTime).toBe('00:00');
  
  // Guests
  await createPage.fillAdults('40');
  await createPage.fillChildren('10');
  
  // Verify child price = half of adult price
  const adultPrice = await createPage.getAdultPrice();
  const childPrice = await createPage.getChildPrice();
  expect(Number(childPrice)).toBe(Number(adultPrice) / 2);
  
  // Verify total
  const total = await createPage.getTotalPrice();
  expect(total).toBe('4,500.00 PLN');
  
  // Deposit
  await createPage.toggleDeposit(true);
  await createPage.fillDepositAmount('1000');
  await createPage.fillDepositDueDate(addDays(new Date(), 7));
  
  // Submit
  await createPage.submit();
  
  // Verify success
  await expect(page.locator('text=Rezerwacja utworzona pomyślnie')).toBeVisible();
  await expect(page).toHaveURL('/reservations');
  
  // Verify in list
  const listPage = new ReservationListPage(page);
  const reservation = await listPage.findReservationByGuests(50);
  expect(reservation).toBeDefined();
  expect(await reservation.getStatus()).toBe('Oczekująca');
});
```

---

#### ✅ TC-RES-002: Tworzenie z nowym klientem
**Priorytet:** Wysoki  
**Czas:** ~2 min

**Kroki:**
1. W formularzu rezerwacji kliknij "+" obok pola Klient
2. W modalu wypełnij:
   - Imię: Jan
   - Nazwisko: Testowy
   - Telefon: 987654321
   - Email: *(pozostaw puste)*
3. Kliknij "Dodaj klienta"
4. **Sprawdź**: Modal zamknął się
5. **Sprawdź**: Nowy klient automatycznie wybrany w dropdown
6. Dokończ tworzenie rezerwacji

**Expected Result:**
- ✅ Klient dodany bez emaila
- ✅ Klient auto-przypisany do rezerwacji
- ✅ W dropdown format: "Jan Testowy (987654321)"
- ✅ Rezerwacja utworzona pomyślnie

---

#### ⚠️ TC-RES-003: Walidacja - duplikat klienta
**Priorytet:** Średni  
**Czas:** ~1 min

**Kroki:**
1. Dodaj klienta: Jan Kowalski, tel: 123456789
2. Spróbuj dodać ponownie: Jan Kowalski, tel: 123456789

**Expected Result:**
- ❌ Błąd: "Klient Jan Kowalski z numerem 123456789 już istnieje"
- ✅ Możliwość dodania o tym samym imieniu ale innym telefonie

---

#### ⚠️ TC-RES-004: Walidacja - przekroczenie pojemności
**Priorytet:** Wysoki  
**Czas:** ~1 min

**Kroki:**
1. Wybierz salę z pojemnością 50 osób
2. Dorośli: 40, Dzieci: 15 (total: 55)
3. Sprawdź komunikat
4. Spróbuj zapisać

**Expected Result:**
- ⚠️ Ostrzeżenie: "Liczba gości (55) przekracza pojemność sali (50)!"
- ❌ Przycisk "Utwórz Rezerwację" zablokowany

---

#### ⚠️ TC-RES-005: Walidacja - cena za dziecko zablokowana ✨
**Priorytet:** Krytyczny  
**Czas:** ~2 min

**Kroki:**
1. W nowej rezerwacji spróbuj wypełnić "Cena za dziecko"
2. Sprawdź, czy pole jest disabled
3. Wypełnij liczbę dorosłych: 10
4. Sprawdź, czy pole nadal disabled
5. Wypełnij cenę za dorosłego: 100 PLN
6. Sprawdź odblokowanie i auto-wartość

**Expected Result:**
- ❌ Pole disabled dopóki nie ma dorosłych I ceny
- ✅ Po wypełnieniu: auto-wartość = 50 PLN (połowa)
- ✅ Tooltip widoczny

**Test Code:**
```typescript
test('TC-RES-005: Child price disabled until adult price set', async ({ page }) => {
  const createPage = new CreateReservationPage(page);
  
  await page.goto('/reservations/new');
  
  // Initially disabled
  await expect(page.locator('[name="pricePerChild"]')).toBeDisabled();
  
  // Fill adults count
  await createPage.fillAdults('10');
  
  // Still disabled
  await expect(page.locator('[name="pricePerChild"]')).toBeDisabled();
  
  // Fill adult price
  await createPage.fillAdultPrice('100');
  
  // Now enabled with auto-value
  await expect(page.locator('[name="pricePerChild"]')).toBeEnabled();
  await expect(page.locator('[name="pricePerChild"]')).toHaveValue('50');
  
  // Verify tooltip
  await page.hover('[name="pricePerChild"]');
  await expect(page.locator('text=/Najpierw uzupełnij/')).toBeVisible();
});
```

---

#### ⚠️ TC-RES-006: Walidacja - czas w przeszłości
**Priorytet:** Wysoki  
**Czas:** ~1 min

**Kroki:**
1. Data rozpoczęcia: wczoraj 18:00
2. Spróbuj zapisać

**Expected Result:**
- ❌ Błąd: "Reservation date must be in the future"

---

#### ⏰ TC-RES-007: Dodatkowe godziny
**Priorytet:** Średni  
**Czas:** ~2 min

**Kroki:**
1. Rozpoczęcie: jutro 18:00
2. Zakończenie: pojutrze 02:00 (+8h)
3. Sprawdź automatyczne notatki

**Expected Result:**
- ⏰ Ostrzeżenie: "Czas trwania: 8h (2h ponad standard - 1000 PLN dopłaty)"
- ✅ Auto-notatka: "⏰ Dodatkowe godziny: 2h × 500 PLN = 1000 PLN"

---

### 4.2 Edycja Rezerwacji

#### ✅ TC-RES-101: Edycja podstawowych danych
**Priorytet:** Krytyczny  
**Czas:** ~2 min

**Kroki:**
1. Otwórz istniejącą rezerwację
2. Kliknij "Edytuj"
3. Zmień liczbę dorosłych: 40 → 50
4. Sprawdź przeliczenie ceny
5. **Sprawdź pole "Klient" - musi być disabled** 🔒
6. Wypełnij powód: "Klient zwiększył liczbę gości"
7. Zapisz

**Expected Result:**
- ✅ Rezerwacja zaktualizowana
- 🔒 Pole "Klient" zablokowane z ikoną kłódki
- ✅ Tooltip: "Klient nie może być zmieniony po utworzeniu rezerwacji"
- ✅ Historia: wpis z powodem
- ✅ Toast: "Rezerwacja zaktualizowana pomyślnie"

**Test Code:**
```typescript
test('TC-RES-101: Edit reservation with client field locked', async ({ page }) => {
  // Create reservation first
  const reservationId = await createTestReservation(page);
  
  // Open edit form
  await page.goto(`/reservations/${reservationId}`);
  await page.click('text=Edytuj');
  
  // Verify client field is disabled
  await expect(page.locator('[name="clientId"]')).toBeDisabled();
  
  // Verify lock icon
  await expect(page.locator('svg.lucide-lock')).toBeVisible();
  
  // Verify tooltip
  await page.hover('[name="clientId"]');
  await expect(page.locator('text=/nie może być zmieniony/')).toBeVisible();
  
  // Edit adults
  await page.fill('[name="adults"]', '50');
  
  // Verify price recalculation
  const newTotal = await page.locator('text=/Cena całkowita/').textContent();
  expect(newTotal).toContain('5,500');
  
  // Fill reason
  await page.fill('[name="reason"]', 'Klient zwiększył liczbę gości');
  
  // Submit
  await page.click('button:text("Zapisz Zmiany")');
  
  // Verify success
  await expect(page.locator('text=zaktualizowana pomyślnie')).toBeVisible();
});
```

---

#### ⚠️ TC-RES-102: Walidacja powodu zmiany
**Priorytet:** Wysoki  
**Czas:** ~1 min

**Kroki:**
1. Edytuj rezerwację
2. Zmień cenę
3. Powód: "test" (< 10 znaków)
4. Spróbuj zapisać

**Expected Result:**
- ❌ Błąd: "Powód musi mieć co najmniej 10 znaków"

---

#### ✅ TC-RES-103: Zmiana statusu w edycji
**Priorytet:** Wysoki  
**Czas:** ~2 min

**Kroki:**
1. Rezerwacja ze statusem "PENDING"
2. Edytuj → Status: "CONFIRMED"
3. Powód: "Klient potwierdził rezerwację telefonicznie"
4. Zapisz

**Expected Result:**
- ✅ Status zmieniony
- ✅ Historia: 2 wpisy (UPDATE + STATUS_CHANGED)
- ⚠️ Ostrzeżenie w formularzu przed zapisem

---

#### ❌ TC-RES-104: Blokada edycji zakończonych
**Priorytet:** Wysoki  
**Czas:** ~1 min

**Kroki:**
1. Rezerwacja ze statusem "COMPLETED"
2. Spróbuj edytować

**Expected Result:**
- ❌ Błąd: "Cannot update completed reservation"
- ✅ Przycisk "Edytuj" ukryty

---

### 4.3 Anulowanie Rezerwacji

#### ✅ TC-RES-201: Anulowanie z powodem
**Priorytet:** Wysoki  
**Czas:** ~2 min

**Kroki:**
1. Otwórz szczegóły rezerwacji
2. Kliknij "Anuluj Rezerwację"
3. Modal - wpisz powód: "Klient zrezygnował"
4. Potwierdź

**Expected Result:**
- ✅ Status: CANCELLED
- ✅ ArchivedAt: obecna data
- ✅ Historia: wpis CANCELLED
- ✅ Rezerwacja zniknęła z głównej listy

---

#### ❌ TC-RES-202: Blokada anulowania zakończonych
**Priorytet:** Średni  
**Czas:** ~1 min

**Kroki:**
1. Rezerwacja ze statusem "COMPLETED"
2. Spróbuj anulować

**Expected Result:**
- ❌ Błąd: "Cannot cancel completed reservation"

---

### 4.4 Lista i Filtrowanie

#### ✅ TC-RES-301: Lista rezerwacji
**Priorytet:** Wysoki  
**Czas:** ~2 min

**Kroki:**
1. Przejdź do `/reservations`
2. Sprawdź widoczne kolumny

**Expected Result:**
- ✅ Kolumny: ID, Data, Klient (z telefonem), Sala, Typ, Goście, Status, Akcje
- ✅ Format klienta: "Jan Kowalski (123456789)"
- ✅ Sortowanie po dacie (najbliższe pierwsze)
- ✅ Badge statusów z kolorami

---

#### ✅ TC-RES-302: Filtrowanie po statusie
**Priorytet:** Średni  
**Czas:** ~1 min

**Kroki:**
1. Zastosuj filtr: Status = "CONFIRMED"
2. Sprawdź wyniki

**Expected Result:**
- ✅ Tylko potwierdzone rezerwacje
- ✅ Licznik wyników

---

#### ✅ TC-RES-303: Wyszukiwanie
**Priorytet:** Średni  
**Czas:** ~1 min

**Kroki:**
1. Wpisz w search: "Kowalski"
2. Sprawdź wyniki

**Expected Result:**
- ✅ Rezerwacje klienta Kowalski
- ✅ Highlight wyszukiwanej frazy

---

### 4.5 Historia Rezerwacji

#### ✅ TC-RES-401: Wpisy w historii
**Priorytet:** Średni  
**Czas:** ~3 min

**Kroki:**
1. Utwórz rezerwację
2. Edytuj ją 2 razy
3. Zmień status
4. Otwórz szczegóły → Historia

**Expected Result:**
- ✅ 4 wpisy: CREATED, UPDATED, UPDATED, STATUS_CHANGED
- ✅ Każdy wpis z datą i użytkownikiem
- ✅ Powód widoczny przy UPDATE
- ✅ Lista zmian w czytelnym formacie

---

### 4.6 Zaliczki

#### ✅ TC-RES-501: Dodanie zaliczki
**Priorytet:** Średni  
**Czas:** ~2 min

**Kroki:**
1. Przy tworzeniu zaznacz "Dodaj zaliczkę"
2. Kwota: 500 PLN
3. Termin: za 7 dni
4. Zapisz

**Expected Result:**
- ✅ Zaliczka zapisana ze statusem "PENDING"
- ✅ Widoczna w szczegółach rezerwacji

---

## 5. Setup testów

### 5.1 Instalacja Playwright

```bash
cd /home/kamil/rezerwacje/apps/frontend

# Instalacja
npm install -D @playwright/test
npx playwright install

# Inicjalizacja
npx playwright init
```

### 5.2 Konfiguracja

**Plik: `playwright.config.ts`**

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results.json' }],
  ],
  
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
```

### 5.3 Helper Functions

**Plik: `tests/utils/test-helpers.ts`**

```typescript
import { Page } from '@playwright/test';

export async function login(page: Page, email: string = 'admin@test.com', password: string = 'password') {
  await page.goto('/login');
  await page.fill('[name="email"]', email);
  await page.fill('[name="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL('/dashboard');
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function formatDateTime(date: Date, time: string): string {
  const dateStr = date.toISOString().split('T')[0];
  return `${dateStr}T${time}`;
}

export async function createTestReservation(page: Page, data?: Partial<ReservationData>): Promise<string> {
  // Helper to create test reservation via API
  const response = await page.request.post('/api/reservations', {
    data: {
      hallId: data?.hallId || 'default-hall-id',
      clientId: data?.clientId || 'default-client-id',
      eventTypeId: data?.eventTypeId || 'default-event-type-id',
      startDateTime: data?.startDateTime || addDays(new Date(), 1).toISOString(),
      endDateTime: data?.endDateTime || addDays(new Date(), 1).toISOString(),
      adults: data?.adults || 40,
      children: data?.children || 10,
      pricePerAdult: data?.pricePerAdult || 100,
      pricePerChild: data?.pricePerChild || 50,
      status: data?.status || 'PENDING',
    },
  });
  
  const json = await response.json();
  return json.id;
}
```

### 5.4 Page Objects

**Plik: `tests/utils/page-objects/CreateReservationPage.ts`**

```typescript
import { Page, Locator } from '@playwright/test';

export class CreateReservationPage {
  readonly page: Page;
  readonly hallSelect: Locator;
  readonly clientSelect: Locator;
  readonly eventTypeSelect: Locator;
  readonly adultsInput: Locator;
  readonly childrenInput: Locator;
  readonly adultPriceInput: Locator;
  readonly childPriceInput: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.hallSelect = page.locator('[name="hallId"]');
    this.clientSelect = page.locator('[name="clientId"]');
    this.eventTypeSelect = page.locator('[name="eventTypeId"]');
    this.adultsInput = page.locator('[name="adults"]');
    this.childrenInput = page.locator('[name="children"]');
    this.adultPriceInput = page.locator('[name="pricePerAdult"]');
    this.childPriceInput = page.locator('[name="pricePerChild"]');
    this.submitButton = page.locator('button:text("Utwórz Rezerwację")');
  }

  async selectHall(hallName: string) {
    await this.hallSelect.selectOption({ label: new RegExp(hallName) });
  }

  async selectClient(index: number) {
    await this.clientSelect.selectOption({ index });
  }

  async selectEventType(typeName: string) {
    await this.eventTypeSelect.selectOption({ label: typeName });
  }

  async fillAdults(count: string) {
    await this.adultsInput.fill(count);
  }

  async fillChildren(count: string) {
    await this.childrenInput.fill(count);
  }

  async fillAdultPrice(price: string) {
    await this.adultPriceInput.fill(price);
  }

  async getChildPrice(): Promise<string> {
    return await this.childPriceInput.inputValue();
  }

  async getTotalPrice(): Promise<string> {
    const element = this.page.locator('text=/Cena całkowita:.*PLN/');
    const text = await element.textContent();
    return text?.match(/([\d,]+\.\d{2} PLN)/)?.[0] || '';
  }

  async submit() {
    await this.submitButton.click();
  }
}
```

### 5.5 Fixtures

**Plik: `tests/fixtures/users.json`**

```json
{
  "admin": {
    "email": "admin@test.com",
    "password": "password",
    "role": "ADMIN"
  },
  "employee": {
    "email": "employee@test.com",
    "password": "password",
    "role": "EMPLOYEE"
  }
}
```

### 5.6 Uruchomienie testów

```bash
# Wszystkie testy
npx playwright test

# Konkretny plik
npx playwright test tests/e2e/reservations/01-create-reservation.spec.ts

# Z interfejsem UI
npx playwright test --ui

# Z debuggerem
npx playwright test --debug

# Konkretna przeglądarka
npx playwright test --project=chromium

# Z raportem
npx playwright test --reporter=html
npx playwright show-report
```

---

## 6. Harmonogram

### Faza 1: Setup (1 dzień)
- ✅ Instalacja Playwright
- ✅ Konfiguracja środowiska
- ✅ Przygotowanie fixtures
- ✅ Stworzenie helper functions
- ✅ Stworzenie page objects

### Faza 2: Happy Paths (2 dni)
- ✅ TC-RES-001 do TC-RES-007
- ✅ TC-RES-101 do TC-RES-103
- ✅ TC-RES-201
- ✅ TC-RES-301 do TC-RES-303

### Faza 3: Walidacje (2 dni)
- ✅ Wszystkie scenariusze z ⚠️
- ✅ Edge cases
- ✅ Błędy

### Faza 4: Zaawansowane (1 dzień)
- ✅ TC-RES-401 (Historia)
- ✅ TC-RES-501 (Zaliczki)
- ✅ Testy regression

### Faza 5: CI/CD (1 dzień)
- ✅ Integracja z GitHub Actions
- ✅ Automatyczne uruchamianie przy PR
- ✅ Raporty w Artifacts

**Całkowity czas:** ~7 dni

---

## 7. Metryki

### 7.1 Kryteria akceptacji
- ✅ 100% scenariuszy happy path działa
- ✅ 90%+ walidacji działa poprawnie
- ✅ Wszystkie testy krytyczne (Priorytet: Krytyczny) przechodzą
- ✅ Czas wykonania całego suite < 10 min
- ✅ Flakiness rate < 5%

### 7.2 Pokrycie funkcjonalne

| Moduł | Testy | Pokrycie |
|--------|-------|----------|
| Tworzenie rezerwacji | 7 | 100% |
| Edycja rezerwacji | 4 | 100% |
| Anulowanie | 2 | 100% |
| Lista i filtrowanie | 3 | 80% |
| Historia | 1 | 70% |
| Zaliczki | 1 | 60% |
| **TOTAL** | **18** | **~85%** |

### 7.3 Nowe funkcje pokryte testami

- ✅ Email opcjonalny dla klienta
- ✅ Auto-assign nowo utworzonego klienta
- ✅ Cena za dziecko = połowa (z blokowaniem pola)
- 🔒 Blokada zmiany klienta w edycji
- ✅ Identyfikacja po telefonie
- ✅ Statusy zaliczek

---

## 8. CI/CD Integration

### 8.1 GitHub Actions

**Plik: `.github/workflows/e2e-tests.yml`**

```yaml
name: E2E Tests

on:
  pull_request:
    branches: [main, develop]
  push:
    branches: [main]

jobs:
  test:
    timeout-minutes: 60
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: rezerwacje_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Install Playwright Browsers
      run: npx playwright install --with-deps
    
    - name: Setup Database
      run: |
        npm run prisma:generate
        npm run prisma:migrate:deploy
        npm run prisma:seed
      env:
        DATABASE_URL: postgresql://postgres:postgres@localhost:5432/rezerwacje_test
    
    - name: Run E2E tests
      run: npx playwright test
      env:
        DATABASE_URL: postgresql://postgres:postgres@localhost:5432/rezerwacje_test
    
    - uses: actions/upload-artifact@v3
      if: always()
      with:
        name: playwright-report
        path: playwright-report/
        retention-days: 30
```

---

## 📚 Dokumenty powiązane

- [Wymagania funkcjonalne - Moduł Rezerwacje](../requirements/reservations-module-requirements.md)
- [API Documentation](../api/reservations-api.md)
- [Schemat bazy danych](../database/schema.md)

---

**Ostatnia aktualizacja:** 07.02.2026  
**Autor:** System AI  
**Status:** 🚧 Do implementacji
