# 🧪 Plan Testów E2E - System Rezerwacji

**Branch:** `feature/reservation-queue`  
**Status:** ⏳ Planowany - Przed Mergem do Main  
**Data utworzenia:** 08.02.2026  
**Cel:** Kompleksowa weryfikacja wszystkich funkcjonalności przed produkcją  

---

## 📊 Przegląd Wykonawczy

### Cel Testów
Garantować, że wszystkie krytyczne funkcjonalności systemu działają poprawnie przed mergem `feature/reservation-queue` do `main` i wdrożeniem na produkcję.

### Zakres
- ✅ Autentykacja i autoryzacja
- ✅ CRUD rezerwacji (pełny lifecycle)
- ✅ System kolejki rezerwacji (🆕 NOWA FUNKCJONALNOŚĆ)
- ✅ Drag & Drop z race condition protection
- ✅ Awansowanie z kolejki do pełnej rezerwacji
- ✅ Zarządzanie klientami
- ✅ Generowanie PDF i wysyłka email
- ✅ Historia zmian
- ✅ Regresja bugów #5-9

### Metryki
- **Całkowity czas:** ~14 godzin (~2 dni pracy)
- **Testy krytyczne:** 100% pokrycie
- **Testy rozszerzone:** 80%+ pokrycie
- **Tool:** Playwright
- **Browsers:** Chromium, Firefox, WebKit

---

## 🎯 Kryteria Akceptacji Przed Mergem

### ✅ Must-Have (Blokujące merge)
- [ ] **100% testów autentykacji przechodzi**
- [ ] **100% testów CRUD rezerwacji przechodzi**
- [ ] **100% testów kolejki rezerwacji przechodzi**
- [ ] **Drag & Drop działa bez race conditions**
- [ ] **Bug #5-9 są pokryte testami regresji**
- [ ] **Wszystkie testy krytyczne (Faza 2) zielone**
- [ ] **Brak crashów lub nieprzechwyconych błędów**

### ⭐ Nice-to-Have (Nie blokujące)
- [ ] 80%+ testów rozszerzonych przechodzi
- [ ] Testy na 3 przeglądarkach (Chromium, Firefox, WebKit)
- [ ] Testy accessibility basics
- [ ] Testy mobile responsive

---

## 📂 Struktura Projektów Testowych

```
rezerwacje/
├── apps/frontend/
│   ├── e2e/                          # Katalog główny testów E2E
│   │   ├── specs/                    # Pliki testowe
│   │   │   ├── 01-auth.spec.ts          # Autentykacja
│   │   │   ├── 02-reservations-crud.spec.ts  # CRUD rezerwacji
│   │   │   ├── 03-queue-basic.spec.ts    # Podstawy kolejki
│   │   │   ├── 04-queue-drag-drop.spec.ts  # Drag & drop 🔥
│   │   │   ├── 05-queue-promotion.spec.ts  # Awansowanie
│   │   │   ├── 06-clients.spec.ts       # Klienci
│   │   │   ├── 07-pdf-email.spec.ts     # PDF & Email
│   │   │   ├── 08-history.spec.ts       # Historia zmian
│   │   │   ├── 09-validations.spec.ts   # Walidacje
│   │   │   └── 10-bugfix-regression.spec.ts  # Regresja bugów
│   │   │
│   │   ├── fixtures/                 # Helpery testowe
│   │   │   ├── auth.fixture.ts      # Auth helpers
│   │   │   ├── reservation.fixture.ts  # Reservation helpers
│   │   │   ├── queue.fixture.ts     # Queue helpers
│   │   │   ├── client.fixture.ts    # Client helpers
│   │   │   └── test-data.ts         # Dane testowe
│   │   │
│   │   ├── pages/                    # Page Object Models
│   │   │   ├── LoginPage.ts
│   │   │   ├── DashboardPage.ts
│   │   │   ├── ReservationsPage.ts
│   │   │   ├── QueuePage.ts
│   │   │   └── ClientsPage.ts
│   │   │
│   │   └── utils/                    # Utility functions
│   │       ├── db-helpers.ts        # Bezpośrednie operacje DB
│   │       ├── api-helpers.ts       # API calls
│   │       └── test-setup.ts        # Setup/teardown
│   │
│   ├── playwright.config.ts       # Konfiguracja Playwright
│   ├── .env.test                  # Zmienne dla testów
│   └── package.json
│
├── docs/testing/
│   ├── E2E_TEST_PLAN.md           # Ten dokument
│   ├── E2E_RESULTS.md             # Wyniki testów
│   └── E2E_TROUBLESHOOTING.md     # Rozwiązywanie problemów
│
└── docker-compose.test.yml    # Docker dla testów
```

---

## 🛠️ Faza 1: Setup Środowiska Testowego (2h)

### 🎯 Cel
Przygotowanie pełnego środowiska testowego z konfiguracją Playwright, fixtures i test data.

### 📝 Zadania

#### 1.1 Konfiguracja Playwright
```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e/specs',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : 4,
  reporter: [
    ['html'],
    ['junit', { outputFile: 'test-results/junit.xml' }],
    ['json', { outputFile: 'test-results/results.json' }]
  ],
  
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  
  timeout: 30000,
  expect: { timeout: 5000 },
  
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
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

#### 1.2 Fixtures Autentykacji
```typescript
// e2e/fixtures/auth.fixture.ts
import { test as base, Page } from '@playwright/test';

type AuthFixtures = {
  authenticatedPage: Page;
  adminPage: Page;
  employeePage: Page;
};

export const test = base.extend<AuthFixtures>({
  authenticatedPage: async ({ page }, use) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'admin@gosciniecrodzinny.pl');
    await page.fill('input[name="password"]', 'Admin123!@#');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
    await use(page);
  },
  
  adminPage: async ({ page }, use) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'admin@gosciniecrodzinny.pl');
    await page.fill('input[name="password"]', 'Admin123!@#');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
    await use(page);
  },
  
  employeePage: async ({ page }, use) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'pracownik@gosciniecrodzinny.pl');
    await page.fill('input[name="password"]', 'Employee123!@#');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
    await use(page);
  },
});
```

#### 1.3 Test Data
```typescript
// e2e/fixtures/test-data.ts
export const testData = {
  admin: {
    email: 'admin@gosciniecrodzinny.pl',
    password: 'Admin123!@#',
  },
  
  employee: {
    email: 'pracownik@gosciniecrodzinny.pl',
    password: 'Employee123!@#',
  },
  
  client: {
    firstName: 'Jan',
    lastName: 'Kowalski',
    email: 'jan.kowalski@example.com',
    phone: '+48123456789',
  },
  
  reservation: {
    date: '2026-03-15',
    startTime: '18:00',
    endTime: '23:00',
    guestsAdults: 50,
    guestsChildren4to12: 10,
    guestsChildren0to3: 5,
    eventType: 'Wesele',
    hall: 'Sala Bankietowa',
  },
  
  queueEntry: {
    date: '2026-03-20',
    guestsAdults: 40,
    notes: 'Test queue entry',
  },
};
```

#### 1.4 Docker Test Environment
```yaml
# docker-compose.test.yml
version: '3.8'

services:
  postgres-test:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: rezerwacje_test
      POSTGRES_PASSWORD: test123
      POSTGRES_DB: rezerwacje_test
    ports:
      - "5433:5432"
    tmpfs:
      - /var/lib/postgresql/data  # In-memory for speed
  
  backend-test:
    build:
      context: ./apps/backend
    environment:
      NODE_ENV: test
      DATABASE_URL: postgresql://rezerwacje_test:test123@postgres-test:5432/rezerwacje_test
      JWT_SECRET: test-secret-key-12345
      PORT: 3002
    ports:
      - "3002:3002"
    depends_on:
      - postgres-test
  
  frontend-test:
    build:
      context: ./apps/frontend
    environment:
      NEXT_PUBLIC_API_URL: http://localhost:3002
      NODE_ENV: test
    ports:
      - "3001:3000"
    depends_on:
      - backend-test
```

### ✅ Checklist Fazy 1
- [ ] Playwright zainstalowany (`npm install -D @playwright/test`)
- [ ] Browsers zainstalowane (`npx playwright install`)
- [ ] `playwright.config.ts` utworzony i skonfigurowany
- [ ] Auth fixtures utworzone
- [ ] Test data fixtures utworzone
- [ ] Page Object Models szkielety utworzone
- [ ] `docker-compose.test.yml` utworzony
- [ ] `.env.test` skonfigurowany
- [ ] Smoke test uruchomiony (`npx playwright test --grep @smoke`)

---

## 🔥 Faza 2: Testy Krytyczne (6h)

### 🎯 Cel
Pokrycie wszystkich krytycznych funkcjonalności, które MUSZĄ działać przed mergem.

---

### 2.1 Autentykacja (30min) 🔑

**Plik:** `e2e/specs/01-auth.spec.ts`

**Test Cases:**

```typescript
import { test, expect } from '@playwright/test';
import { testData } from '../fixtures/test-data';

test.describe('Autentykacja', () => {
  test('should login with valid credentials', async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('input[name="email"]', testData.admin.email);
    await page.fill('input[name="password"]', testData.admin.password);
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('h1')).toContainText('Dashboard');
  });
  
  test('should fail login with invalid credentials', async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('input[name="email"]', 'wrong@email.com');
    await page.fill('input[name="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    await expect(page.locator('.error-message')).toContainText('Invalid credentials');
    await expect(page).toHaveURL('/login');
  });
  
  test('should logout successfully', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('input[name="email"]', testData.admin.email);
    await page.fill('input[name="password"]', testData.admin.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
    
    // Logout
    await page.click('button[aria-label="User menu"]');
    await page.click('button:has-text("Wyloguj")');
    
    await expect(page).toHaveURL('/login');
  });
  
  test('should redirect to login if not authenticated', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL('/login');
  });
});
```

**Checklist:**
- [ ] Login z poprawnymi danymi → redirect do dashboard
- [ ] Login z błędnymi danymi → error message
- [ ] Logout → redirect do login
- [ ] Protected route bez auth → redirect do login
- [ ] Token wygasa po timeout → redirect do login

---

### 2.2 Rezerwacje CRUD (2h) 📋

**Plik:** `e2e/specs/02-reservations-crud.spec.ts`

**Test Cases:**

#### CREATE - Nowa Rezerwacja
```typescript
test('should create new reservation with all fields', async ({ adminPage }) => {
  await adminPage.goto('/reservations/new');
  
  // Select client
  await adminPage.selectOption('select[name="clientId"]', { label: 'Jan Kowalski' });
  
  // Select hall
  await adminPage.selectOption('select[name="hallId"]', { label: 'Sala Bankietowa' });
  
  // Select event type
  await adminPage.selectOption('select[name="eventTypeId"]', { label: 'Wesele' });
  
  // Date & time
  await adminPage.fill('input[name="date"]', '15.03.2026');
  await adminPage.fill('input[name="startTime"]', '18:00');
  await adminPage.fill('input[name="endTime"]', '23:00');
  
  // Guests
  await adminPage.fill('input[name="guestsAdults"]', '50');
  await adminPage.fill('input[name="guestsChildren4to12"]', '10');
  await adminPage.fill('input[name="guestsChildren0to3"]', '5');
  
  // Verify price calculation
  await expect(adminPage.locator('[data-testid="total-price"]')).toContainText('22750'); // 65 * 350
  
  // Notes
  await adminPage.fill('textarea[name="notes"]', 'Test reservation notes');
  
  // Submit
  await adminPage.click('button[type="submit"]');
  
  // Verify success
  await expect(adminPage.locator('.toast-success')).toContainText('Rezerwacja utworzona');
  await expect(adminPage).toHaveURL(/\/reservations\/\d+/);
});
```

#### UPDATE - Edycja Rezerwacji
```typescript
test('should edit existing reservation', async ({ adminPage }) => {
  // Create reservation first
  const reservationId = await createTestReservation();
  
  // Navigate to edit
  await adminPage.goto(`/reservations/${reservationId}/edit`);
  
  // Verify fields are pre-populated
  await expect(adminPage.locator('select[name="hallId"]')).toHaveValue('sala-bankietowa');
  await expect(adminPage.locator('input[name="guestsAdults"]')).toHaveValue('50');
  
  // Change guests
  await adminPage.fill('input[name="guestsAdults"]', '60');
  
  // Verify price updates
  await expect(adminPage.locator('[data-testid="total-price"]')).toContainText('26250'); // 75 * 350
  
  // Required: reason for change
  await adminPage.fill('textarea[name="changeReason"]', 'Klient zwiększył liczbę gości');
  
  // Submit
  await adminPage.click('button[type="submit"]');
  
  // Verify success
  await expect(adminPage.locator('.toast-success')).toContainText('Rezerwacja zaktualizowana');
  
  // Verify history entry created
  await adminPage.click('button:has-text("Historia")');
  await expect(adminPage.locator('.history-entry')).toContainText('Klient zwiększył liczbę gości');
});
```

#### DELETE - Anulowanie
```typescript
test('should cancel reservation with reason', async ({ adminPage }) => {
  const reservationId = await createTestReservation();
  
  await adminPage.goto(`/reservations/${reservationId}`);
  
  // Click cancel
  await adminPage.click('button:has-text("Anuluj rezerwację")');
  
  // Modal opens - reason required
  await adminPage.fill('textarea[name="cancelReason"]', 'Klient zrezygnował');
  await adminPage.click('button:has-text("Potwierdź anulowanie")');
  
  // Verify status changed
  await expect(adminPage.locator('[data-testid="status-badge"]')).toContainText('CANCELLED');
  
  // Verify history
  await adminPage.click('button:has-text("Historia")');
  await expect(adminPage.locator('.history-entry')).toContainText('Status: CANCELLED');
  await expect(adminPage.locator('.history-entry')).toContainText('Klient zrezygnował');
});
```

#### Conditional Fields - Urodziny
```typescript
test('should show birthday field when event type is Urodziny', async ({ adminPage }) => {
  await adminPage.goto('/reservations/new');
  
  // Initially hidden
  await expect(adminPage.locator('input[name="birthdayAge"]')).toBeHidden();
  
  // Select Urodziny
  await adminPage.selectOption('select[name="eventTypeId"]', { label: 'Urodziny' });
  
  // Field appears
  await expect(adminPage.locator('input[name="birthdayAge"]')).toBeVisible();
  await adminPage.fill('input[name="birthdayAge"]', '30');
  
  // Complete and submit
  // ... (fill other fields)
  
  await adminPage.click('button[type="submit"]');
  
  // Verify saved
  await expect(adminPage.locator('[data-testid="birthday-age"]')).toContainText('30');
});
```

**Checklist:**
- [ ] CREATE: Wszystkie pola wypełnione poprawnie
- [ ] CREATE: Kalkulator ceny działa realtime
- [ ] CREATE: Walidacja pól wymaganych
- [ ] CREATE: Pola warunkowe (Urodziny, Rocznica) działają
- [ ] UPDATE: Pre-population danych
- [ ] UPDATE: Edycja wartości
- [ ] UPDATE: Powód zmian wymagany
- [ ] UPDATE: Historia zmian zapisana
- [ ] DELETE: Anulowanie z powodem
- [ ] DELETE: Status zmienia się na CANCELLED
- [ ] Lista rezerwacji: Paginacja działa
- [ ] Lista rezerwacji: Filtry działają

---

### 2.3 Kolejka Rezerwacji - Podstawy (1h) 🆕

**Plik:** `e2e/specs/03-queue-basic.spec.ts`

**Test Cases:**

```typescript
test('should add entry to queue', async ({ adminPage }) => {
  await adminPage.goto('/queue/new');
  
  // Select client
  await adminPage.selectOption('select[name="clientId"]', { label: 'Jan Kowalski' });
  
  // Target date
  await adminPage.fill('input[name="reservationQueueDate"]', '20.03.2026');
  
  // Guests
  await adminPage.fill('input[name="guestsAdults"]', '40');
  
  // Notes
  await adminPage.fill('textarea[name="notes"]', 'Test queue entry');
  
  // Submit
  await adminPage.click('button[type="submit"]');
  
  // Verify added to queue
  await expect(adminPage).toHaveURL('/queue');
  await expect(adminPage.locator('.toast-success')).toContainText('Dodano do kolejki');
  
  // Verify in list
  await expect(adminPage.locator('[data-date="2026-03-20"]')).toBeVisible();
  await expect(adminPage.locator('[data-position="1"]')).toContainText('Jan Kowalski');
});

test('should display queue grouped by dates', async ({ adminPage }) => {
  // Create entries for different dates
  await createQueueEntry({ date: '2026-03-15', position: 1 });
  await createQueueEntry({ date: '2026-03-15', position: 2 });
  await createQueueEntry({ date: '2026-03-20', position: 1 });
  
  await adminPage.goto('/queue');
  
  // Verify grouping
  await expect(adminPage.locator('[data-date="2026-03-15"]')).toBeVisible();
  await expect(adminPage.locator('[data-date="2026-03-20"]')).toBeVisible();
  
  // Verify positions
  const date15Entries = adminPage.locator('[data-date="2026-03-15"] .queue-item');
  await expect(date15Entries).toHaveCount(2);
});

test('should edit queue entry', async ({ adminPage }) => {
  const entryId = await createQueueEntry({ date: '2026-03-15' });
  
  await adminPage.goto('/queue');
  
  // Click edit
  await adminPage.click(`[data-id="${entryId}"] button:has-text("Edytuj")`);
  
  // Change guests
  await adminPage.fill('input[name="guestsAdults"]', '50');
  await adminPage.fill('textarea[name="notes"]', 'Updated notes');
  
  // Submit
  await adminPage.click('button[type="submit"]');
  
  // Verify updated
  await expect(adminPage.locator(`[data-id="${entryId}"]`)).toContainText('50 osób');
});
```

**Checklist:**
- [ ] Dodawanie do kolejki: formularz działa
- [ ] Automatyczne przypisanie pozycji
- [ ] Lista kolejki: grupowanie po datach
- [ ] Lista kolejki: wyświetlanie pozycji
- [ ] Statystyki dla każdej daty (liczba gości, wpisy)
- [ ] Edycja wpisu w kolejce
- [ ] Zmiana daty wpisu

---

### 2.4 Drag & Drop + Race Conditions (2h) 🔥🔥🔥

**Plik:** `e2e/specs/04-queue-drag-drop.spec.ts`

**Test Cases:**

#### Basic Drag & Drop
```typescript
test('should reorder queue entries via drag and drop', async ({ adminPage }) => {
  // Create 3 entries
  await createQueueEntry({ date: '2026-03-15', position: 1, client: 'Client A' });
  await createQueueEntry({ date: '2026-03-15', position: 2, client: 'Client B' });
  await createQueueEntry({ date: '2026-03-15', position: 3, client: 'Client C' });
  
  await adminPage.goto('/queue');
  
  // Verify initial order
  const items = adminPage.locator('[data-date="2026-03-15"] .queue-item');
  await expect(items.nth(0)).toContainText('Client A');
  await expect(items.nth(1)).toContainText('Client B');
  await expect(items.nth(2)).toContainText('Client C');
  
  // Drag A to position 3 (after C)
  await adminPage.dragAndDrop(
    '[data-client="Client A"]',
    '[data-client="Client C"]'
  );
  
  // Verify new order: B, C, A
  await expect(items.nth(0)).toContainText('Client B');
  await expect(items.nth(1)).toContainText('Client C');
  await expect(items.nth(2)).toContainText('Client A');
});
```

#### Loading State During Drag
```typescript
test('should show loading state during drag and drop', async ({ adminPage }) => {
  await createQueueEntry({ date: '2026-03-15', position: 1 });
  await createQueueEntry({ date: '2026-03-15', position: 2 });
  
  await adminPage.goto('/queue');
  
  // Start drag
  const dragPromise = adminPage.dragAndDrop(
    '[data-position="1"]',
    '[data-position="2"]'
  );
  
  // Verify loading overlay appears
  await expect(adminPage.locator('.loading-overlay')).toBeVisible();
  
  // Verify items are disabled
  await expect(adminPage.locator('[data-position="1"]')).toHaveAttribute('aria-disabled', 'true');
  
  // Wait for completion
  await dragPromise;
  
  // Verify loading disappears
  await expect(adminPage.locator('.loading-overlay')).toBeHidden();
});
```

#### Concurrent Operations (Bug #5 Regression)
```typescript
test('should handle concurrent drag operations gracefully', async ({ browser }) => {
  // Create 3 entries
  const entryA = await createQueueEntry({ date: '2026-03-15', position: 1 });
  const entryB = await createQueueEntry({ date: '2026-03-15', position: 2 });
  const entryC = await createQueueEntry({ date: '2026-03-15', position: 3 });
  
  // Open two admin sessions
  const context1 = await browser.newContext();
  const page1 = await context1.newPage();
  await authenticateAsAdmin(page1);
  await page1.goto('/queue');
  
  const context2 = await browser.newContext();
  const page2 = await context2.newPage();
  await authenticateAsAdmin(page2);
  await page2.goto('/queue');
  
  // Concurrent swaps
  const swap1 = page1.dragAndDrop(
    `[data-id="${entryA}"]`,
    `[data-id="${entryB}"]`
  );
  
  const swap2 = page2.dragAndDrop(
    `[data-id="${entryA}"]`,
    `[data-id="${entryC}"]`
  );
  
  // Wait for both to complete
  await Promise.all([swap1, swap2]);
  
  // Verify: No crashes
  await expect(page1.locator('.error-fatal')).toBeHidden();
  await expect(page2.locator('.error-fatal')).toBeHidden();
  
  // Verify: Positions are consistent (no gaps/duplicates)
  await page1.reload();
  const positions1 = await getQueuePositions(page1, '2026-03-15');
  expect(positions1.sort()).toEqual([1, 2, 3]);
  
  await page2.reload();
  const positions2 = await getQueuePositions(page2, '2026-03-15');
  expect(positions2.sort()).toEqual([1, 2, 3]);
  
  // Both pages should show same final state
  expect(positions1).toEqual(positions2);
  
  await context1.close();
  await context2.close();
});
```

#### Race Condition - Retry Logic
```typescript
test('should retry on lock conflict and eventually succeed', async ({ browser }) => {
  const entryA = await createQueueEntry({ date: '2026-03-15', position: 1 });
  const entryB = await createQueueEntry({ date: '2026-03-15', position: 2 });
  
  // Simulate slow backend (holds lock longer)
  await setBackendDelay(1000); // 1 second delay
  
  const context1 = await browser.newContext();
  const page1 = await context1.newPage();
  await authenticateAsAdmin(page1);
  await page1.goto('/queue');
  
  const context2 = await browser.newContext();
  const page2 = await context2.newPage();
  await authenticateAsAdmin(page2);
  await page2.goto('/queue');
  
  // Start first swap (will hold lock)
  const swap1 = page1.dragAndDrop(
    `[data-id="${entryA}"]`,
    `[data-id="${entryB}"]`
  );
  
  // Wait 100ms, then start second swap (will retry)
  await page2.waitForTimeout(100);
  const swap2 = page2.dragAndDrop(
    `[data-id="${entryA}"]`,
    `[data-id="${entryB}"]`
  );
  
  // Both should eventually succeed
  await expect(swap1).resolves.toBeUndefined();
  await expect(swap2).resolves.toBeUndefined();
  
  // Verify success messages (not error)
  await expect(page1.locator('.toast-success')).toBeVisible();
  await expect(page2.locator('.toast-success')).toBeVisible();
  
  await setBackendDelay(0); // Reset
  await context1.close();
  await context2.close();
});
```

**Checklist:**
- [ ] Basic drag & drop: zmiana pozycji
- [ ] Loading state podczas operacji
- [ ] Disabled drag podczas loading
- [ ] Visual feedback (opacity, cursor)
- [ ] Concurrent operations: brak crashów
- [ ] Retry logic działa (3x exponential backoff)
- [ ] Spójne pozycje po concurrent ops
- [ ] User-friendly error messages
- [ ] Optimistic updates (opcjonalnie)

---

### 2.5 Awansowanie z Kolejki (1h) ⬆️

**Plik:** `e2e/specs/05-queue-promotion.spec.ts`

**Test Cases:**

```typescript
test('should promote queue entry to full reservation', async ({ adminPage }) => {
  // Create queue entry
  const queueEntry = await createQueueEntry({
    date: '2026-03-15',
    guestsAdults: 50,
    client: 'Jan Kowalski',
  });
  
  await adminPage.goto('/queue');
  
  // Click promote
  await adminPage.click(`[data-id="${queueEntry}"] button:has-text("Awansuj")`);
  
  // Opens reservation form with pre-filled data
  await expect(adminPage).toHaveURL(/\/reservations\/new\?queueId=${queueEntry}/);
  await expect(adminPage.locator('select[name="clientId"]')).toHaveValue('jan-kowalski');
  await expect(adminPage.locator('input[name="guestsAdults"]')).toHaveValue('50');
  await expect(adminPage.locator('input[name="date"]')).toHaveValue('15.03.2026');
  
  // Add missing details
  await adminPage.selectOption('select[name="hallId"]', { label: 'Sala Bankietowa' });
  await adminPage.fill('input[name="startTime"]', '18:00');
  await adminPage.fill('input[name="endTime"]', '23:00');
  
  // Submit
  await adminPage.click('button[type="submit"]');
  
  // Verify promotion successful
  await expect(adminPage.locator('.toast-success')).toContainText('Rezerwacja utworzona');
  
  // Verify queue entry status changed
  await adminPage.goto('/queue');
  await expect(adminPage.locator(`[data-id="${queueEntry}"]`)).toBeHidden(); // Removed from queue
  
  // Verify reservation created with PENDING status
  await adminPage.goto('/reservations');
  await expect(adminPage.locator('.reservation-list')).toContainText('Jan Kowalski');
  await expect(adminPage.locator('[data-status="PENDING"]')).toBeVisible();
});

test('should recalculate positions after promotion', async ({ adminPage }) => {
  // Create 3 entries
  await createQueueEntry({ date: '2026-03-15', position: 1, client: 'Client A' });
  const entryB = await createQueueEntry({ date: '2026-03-15', position: 2, client: 'Client B' });
  await createQueueEntry({ date: '2026-03-15', position: 3, client: 'Client C' });
  
  await adminPage.goto('/queue');
  
  // Verify initial positions
  await expect(adminPage.locator('[data-position="1"]')).toContainText('Client A');
  await expect(adminPage.locator('[data-position="2"]')).toContainText('Client B');
  await expect(adminPage.locator('[data-position="3"]')).toContainText('Client C');
  
  // Promote Client B (position 2)
  await promoteQueueEntry(entryB);
  
  // Reload queue
  await adminPage.goto('/queue');
  
  // Verify positions recalculated: A=1, C=2
  await expect(adminPage.locator('[data-position="1"]')).toContainText('Client A');
  await expect(adminPage.locator('[data-position="2"]')).toContainText('Client C');
  await expect(adminPage.locator('[data-client="Client B"]')).toBeHidden();
});
```

**Checklist:**
- [ ] Awansowanie: formularz otwiera się z pre-fill
- [ ] Wszystkie dane z kolejki przeniesione
- [ ] Dodanie brakujących szczegółów (sala, godziny)
- [ ] Status zmienia się z RESERVED → PENDING/CONFIRMED
- [ ] Wpis znika z kolejki
- [ ] Pozycje pozostałych wpisów przeliczone
- [ ] Email wysłany do klienta (opcjonalnie)

---

### 2.6 Walidacje (30min) ✅

**Plik:** `e2e/specs/09-validations.spec.ts`

**Test Cases:**

```typescript
test('should validate required fields in reservation form', async ({ adminPage }) => {
  await adminPage.goto('/reservations/new');
  
  // Try submit without filling
  await adminPage.click('button[type="submit"]');
  
  // Verify error messages
  await expect(adminPage.locator('input[name="clientId"] + .error')).toContainText('Klient jest wymagany');
  await expect(adminPage.locator('input[name="hallId"] + .error')).toContainText('Sala jest wymagana');
  await expect(adminPage.locator('input[name="date"] + .error')).toContainText('Data jest wymagana');
});

test('should validate queue position range', async ({ adminPage }) => {
  await createQueueEntry({ date: '2026-03-15', position: 1 });
  await createQueueEntry({ date: '2026-03-15', position: 2 });
  
  await adminPage.goto('/queue');
  
  // Try to move to invalid position
  await adminPage.click('[data-position="1"] button:has-text("Przenieś")');
  await adminPage.fill('input[name="newPosition"]', '999');
  await adminPage.click('button:has-text("Zapisz")');
  
  // Verify error
  await expect(adminPage.locator('.error-message')).toContainText('Position must be between 1 and 2');
});

test('should validate past dates in queue', async ({ adminPage }) => {
  await adminPage.goto('/queue/new');
  
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  
  await adminPage.fill('input[name="reservationQueueDate"]', formatDate(yesterday));
  await adminPage.click('button[type="submit"]');
  
  // Verify error
  await expect(adminPage.locator('.error')).toContainText('Data nie może być w przeszłości');
});
```

**Checklist:**
- [ ] Required fields validation
- [ ] Date in past validation
- [ ] Position range validation [1, maxPosition]
- [ ] Guest count validation (<= hall capacity)
- [ ] Time validation (end > start)
- [ ] Email format validation
- [ ] Phone format validation

---

## ⭐ Faza 3: Testy Rozszerzone (4h)

### 3.1 Klienci CRUD (1h)
**Plik:** `e2e/specs/06-clients.spec.ts`

- [ ] Lista klientów
- [ ] Dodawanie klienta
- [ ] Edycja klienta
- [ ] Historia rezerwacji klienta
- [ ] Notatki o kliencie
- [ ] Wyszukiwanie klientów

### 3.2 PDF & Email (1h)
**Plik:** `e2e/specs/07-pdf-email.spec.ts`

- [ ] Generowanie PDF rezerwacji
- [ ] Download PDF
- [ ] Zawartość PDF poprawna
- [ ] Wysyłka emaila (mock/test)

### 3.3 Historia Zmian (1h)
**Plik:** `e2e/specs/08-history.spec.ts`

- [ ] Timeline zmian
- [ ] Wyświetlanie stara/nowa wartość
- [ ] Kto zmienił i kiedy
- [ ] Powód zmiany

### 3.4 Dashboard & Statystyki (1h)

- [ ] Wyświetlanie statystyk
- [ ] Nadchodzące rezerwacje
- [ ] Alerty/powiadomienia

---

## ✅ Faza 4: Regresja Bugów (2h)

**Plik:** `e2e/specs/10-bugfix-regression.spec.ts`

### Bug #5 - Race Conditions
- [x] Concurrent drag & drop
- [x] Retry logic
- [x] Spójne pozycje

### Bug #6 - Loading States
- [ ] Loading overlay podczas drag & drop
- [ ] Disabled state
- [ ] Visual feedback

### Bug #7 - Auto-Cancel
- [ ] Anuluje tylko przeszłe daty
- [ ] Dzisiejsze daty pozostają
- [ ] Cron wykonuje się o 00:01

### Bug #8 - Position Validation
- [ ] Walidacja zakresu [1, max]
- [ ] User-friendly error messages

### Bug #9 - Nullable Constraints
- [ ] RESERVED wymaga queue fields
- [ ] PENDING nie może mieć queue fields
- [ ] Unique constraint dla (date, position)

---

## 🚀 Uruchamianie Testów

### Setup Środowiska
```bash
# 1. Clone i checkout branch
git clone https://github.com/kamil-gol/rezerwacje.git
cd rezerwacje
git checkout feature/reservation-queue

# 2. Install dependencies
cd apps/frontend
npm install

# 3. Install Playwright browsers
npx playwright install

# 4. Setup test database
docker-compose -f docker-compose.test.yml up -d

# 5. Run migrations
docker-compose exec backend-test npm run prisma:migrate:deploy

# 6. Seed test data
docker-compose exec backend-test npm run seed:test
```

### Uruchomienie Testów
```bash
# Wszystkie testy (headless)
npm run test:e2e

# UI mode (debugging)
npm run test:e2e:ui

# Headed mode (widoczna przeglądarka)
npm run test:e2e -- --headed

# Tylko testy krytyczne
npm run test:e2e -- --grep @critical

# Tylko testy kolejki
npm run test:e2e -- e2e/specs/0[345]-queue*.spec.ts

# Konkretna przeglądarka
npm run test:e2e -- --project=chromium

# Debug mode
npm run test:e2e -- --debug

# Parallel execution (4 workers)
npm run test:e2e -- --workers=4

# Generate HTML report
npm run test:e2e -- --reporter=html
```

### Continuous Integration
```yaml
# .github/workflows/e2e-tests.yml
name: E2E Tests

on:
  pull_request:
    branches: [main]
  push:
    branches: [feature/reservation-queue]

jobs:
  e2e:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: |
          cd apps/frontend
          npm install
      
      - name: Install Playwright
        run: |
          cd apps/frontend
          npx playwright install --with-deps
      
      - name: Start test environment
        run: docker-compose -f docker-compose.test.yml up -d
      
      - name: Run migrations
        run: docker-compose exec -T backend-test npm run prisma:migrate:deploy
      
      - name: Seed test data
        run: docker-compose exec -T backend-test npm run seed:test
      
      - name: Run E2E tests
        run: |
          cd apps/frontend
          npm run test:e2e
      
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: apps/frontend/playwright-report/
      
      - name: Cleanup
        if: always()
        run: docker-compose -f docker-compose.test.yml down -v
```

---

## 📊 Metryki & Raportowanie

### Coverage Metrics

| Moduł | Testy | Krytyczne | Rozszerzone | Coverage |
|--------|-------|-----------|-------------|----------|
| Autentykacja | 5 | 5 | 0 | 100% |
| Rezerwacje CRUD | 12 | 10 | 2 | 100% |
| Kolejka - Basic | 8 | 6 | 2 | 100% |
| Kolejka - Drag&Drop | 10 | 8 | 2 | 100% |
| Awansowanie | 4 | 4 | 0 | 100% |
| Walidacje | 8 | 6 | 2 | 100% |
| Klienci | 6 | 0 | 6 | 80% |
| PDF/Email | 4 | 0 | 4 | 80% |
| Historia | 3 | 0 | 3 | 80% |
| Bugfix Regresja | 10 | 10 | 0 | 100% |
| **RAZEM** | **70** | **49** | **21** | **94%** |

### Test Execution Time

| Faza | Testy | Czas (sekwencyjny) | Czas (parallel 4x) |
|------|-------|-------------------|-------------------|
| Faza 1: Setup | N/A | 2h | N/A |
| Faza 2: Krytyczne | 49 | ~25 min | ~7 min |
| Faza 3: Rozszerzone | 21 | ~10 min | ~3 min |
| Faza 4: Regresja | 10 | ~5 min | ~2 min |
| **RAZEM** | **70** | **~40 min** | **~12 min** |

### Success Criteria

✅ **PASS** - merge do main możliwy:
- 100% testów krytycznych (Faza 2) przechodzi
- 80%+ testów rozszerzonych (Faza 3) przechodzi
- Wszystkie testy regresji bugów (Faza 4) przechodzi
- Brak flaky tests (testy niestabilne)
- Coverage ≥ 90%

⚠️ **CONDITIONAL PASS** - merge z adnotacją:
- 95%+ testów krytycznych przechodzi
- 70%+ testów rozszerzonych przechodzi
- Known issues udokumentowane

❌ **FAIL** - merge zablokowany:
- <95% testów krytycznych przechodzi
- Jakieś testy regresji bugów failują
- Race conditions nadal występują
- Crashes lub uncaught errors

---

## 🛠️ Troubleshooting

### Problem: Testy timeout
```bash
# Zwiększ timeout w playwright.config.ts
timeout: 60000, // 60 seconds

# Lub per-test
test('slow test', async ({ page }) => {
  test.setTimeout(60000);
  // ...
});
```

### Problem: Flaky tests (niestabilne)
```typescript
// Użyj auto-waiting
await expect(page.locator('.element')).toBeVisible();

// Zamiast manualnych sleep
await page.waitForTimeout(1000); // ❌ AVOID

// Użyj explicit waits
await page.waitForSelector('.element', { state: 'visible' });
await page.waitForLoadState('networkidle');
```

### Problem: Test database nie resetuje się
```bash
# Reset database przed testami
docker-compose exec backend-test npm run prisma:migrate:reset --force
docker-compose exec backend-test npm run seed:test
```

### Problem: Concurrent tests konfliktują
```typescript
// Użyj test.describe.serial dla testów seryjnych
test.describe.serial('Queue drag and drop', () => {
  // Testy wykonują się po kolei
});

// Lub wyłącz parallelizację
test.describe.configure({ mode: 'serial' });
```

---

## 📝 Checklist Finalna - Przed Mergem

### Setup
- [ ] Playwright zainstalowany i skonfigurowany
- [ ] Wszystkie fixtures utworzone
- [ ] Page Object Models zaimplementowane
- [ ] Test data seed utworzony
- [ ] Docker test environment działa

### Testy Krytyczne (Must-Have)
- [ ] Auth: 100% testów przechodzi
- [ ] Rezerwacje CRUD: 100% testów przechodzi
- [ ] Kolejka - Basic: 100% testów przechodzi
- [ ] Kolejka - Drag&Drop: 100% testów przechodzi
- [ ] Awansowanie: 100% testów przechodzi
- [ ] Walidacje: 100% testów przechodzi

### Testy Rozszerzone (Nice-to-Have)
- [ ] Klienci: 80%+ testów przechodzi
- [ ] PDF/Email: 80%+ testów przechodzi
- [ ] Historia: 80%+ testów przechodzi
- [ ] Dashboard: 80%+ testów przechodzi

### Regresja Bugów
- [ ] Bug #5 (Race Conditions): test przechodzi
- [ ] Bug #6 (Loading States): test przechodzi
- [ ] Bug #7 (Auto-Cancel): test przechodzi
- [ ] Bug #8 (Position Validation): test przechodzi
- [ ] Bug #9 (Nullable Constraints): test przechodzi

### Jakość
- [ ] Brak flaky tests
- [ ] Brak timeoutów
- [ ] Wszystkie testy są deterministyczne
- [ ] Code coverage ≥ 90%
- [ ] Test execution time < 15 min (parallel)

### Dokumentacja
- [ ] Test plan udokumentowany (ten dokument)
- [ ] Wyniki testów zapisane (E2E_RESULTS.md)
- [ ] Known issues udokumentowane
- [ ] Troubleshooting guide utworzony

### CI/CD
- [ ] GitHub Actions workflow utworzony
- [ ] Testy uruchamiają się na PR
- [ ] Test artifacts uploadowane
- [ ] Notifications skonfigurowane

### Final Sign-Off
- [ ] **QA Lead approval:** _______________
- [ ] **Tech Lead approval:** _______________
- [ ] **Product Owner approval:** _______________
- [ ] **Ready to merge:** ☐ YES / ☐ NO

---

## 🎉 Co Dalej Po Testach?

### Jeśli wszystkie testy PASS ✅
1. **Code review** brancha `feature/reservation-queue`
2. **Merge** do `main`
3. **Deploy** na staging
4. **Smoke tests** na staging
5. **User Acceptance Testing** (UAT)
6. **Production deployment**

### Jeśli są failed tests ❌
1. **Analiza** failures
2. **Bug fixing** w `feature/reservation-queue`
3. **Re-run** testów
4. **Powtórz** process

### Jeśli są flaky tests ⚠️
1. **Identyfikacja** root cause
2. **Stabilizacja** testów (explicit waits, retry logic)
3. **Re-run** 3x dla weryfikacji
4. **Mark** jako known issue jeśli persist

---

## 📞 Kontakt

**Pytania dotyczące testów:**
- QA Lead: [email]
- Tech Lead: [email]

**Raportowanie problemów:**
- GitHub Issues: [link]
- Slack: #qa-testing

---

**Dokument utworzony:** 08.02.2026, 01:15 CET  
**Ostatnia aktualizacja:** 08.02.2026, 01:15 CET  
**Wersja:** 1.0  
**Status:** 🟡 Draft - Do Review  
**Autor:** AI Assistant + Kamil Gol  

**Branch docelowy:** `feature/reservation-queue` → `main`  
**Target merge date:** Po wykonaniu wszystkich testów krytycznych  
