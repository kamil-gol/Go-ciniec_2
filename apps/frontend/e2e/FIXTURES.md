# 🧩 E2E Fixtures - Dokumentacja

**Autor:** Kamil Gol  
**Data:** 08.02.2026  
**Framework:** Playwright ^1.41.1  

Fixtures w Playwright to reusable setup/teardown logic dla testów. Projekt używa custom fixtures dla autentykacji i test data.

---

## 👥 Auth Fixture (`auth.fixture.ts`)

### Przegłąd

Auth fixture dostarcza pre-authenticated contexts dla różnych ról użytkowników:
- `adminPage` - Zalogowany jako admin
- `employeePage` - Zalogowany jako pracownik
- `page` - Zwykły context (nie zalogowany)

### Import

```typescript
import { test, expect } from '../fixtures/auth.fixture';
import { logout } from '../fixtures/auth.fixture';
```

### Fixtures

#### `adminPage`

Page object już zalogowany jako administrator.

**Credentials:**
- Email: `admin@gosciniecrodzinny.pl`
- Password: `Admin123!@#`
- Role: `ADMIN`

**Przykład użycia:**

```typescript
test('admin can access all pages', async ({ adminPage }) => {
  // adminPage jest już zalogowany i na /dashboard
  await expect(adminPage).toHaveURL('/dashboard');
  
  // Nawiguj do innych stron
  await adminPage.goto('/queue');
  await expect(adminPage.locator('h1').first()).toContainText('Kolejka');
  
  await adminPage.goto('/reservations');
  await expect(adminPage.locator('h1').first()).toContainText('Rezerwacje');
});
```

**Setup:**
1. Nawiguje do `/login`
2. Wypełnia email i password
3. Klika submit
4. Czeka na przekierowanie do `/dashboard`
5. Zwraca authenticated page

**Teardown:**
- Automatyczne czyszczenie przez Playwright
- Storage state (localStorage) jest izolowany per test

---

#### `employeePage`

Page object już zalogowany jako pracownik.

**Credentials:**
- Email: `employee@gosciniecrodzinny.pl`
- Password: `Employee123!@#`
- Role: `EMPLOYEE`

**Przykład użycia:**

```typescript
test('employee can view reservations', async ({ employeePage }) => {
  await employeePage.goto('/reservations');
  
  // Employee może oglądać rezerwacje
  await expect(employeePage.locator('h1').first()).toContainText('Rezerwacje');
  
  // Ale nie może edytować (przykład)
  const editButton = employeePage.locator('button:has-text("Edytuj")');
  await expect(editButton).not.toBeVisible(); // zależnie od implementacji
});
```

**Setup:**
Analogiczny do `adminPage`, ale z employee credentials.

---

#### `page`

Zwykły Page object bez autentykacji.

**Użycie:**
Do testów login page, protected routes redirects, itp.

**Przykład użycia:**

```typescript
test('redirect to login when not authenticated', async ({ page }) => {
  // Próba dostępu do protected route
  await page.goto('/dashboard');
  
  // Powinno przekierować do /login
  await expect(page).toHaveURL(/\/login/);
});

test('login with valid credentials', async ({ page }) => {
  await page.goto('/login');
  
  await page.fill('input[name="email"]', 'admin@gosciniecrodzinny.pl');
  await page.fill('input[name="password"]', 'Admin123!@#');
  await page.click('button[type="submit"]');
  
  await expect(page).toHaveURL('/dashboard');
});
```

---

### Funkcje Pomocnicze

#### `logout(page: Page): Promise<void>`

Wylogowuje użytkownika i czeka na przekierowanie do `/login`.

**Implementacja:**
1. Klika user menu button (`button[aria-label="User menu"]`)
2. Czeka na dropdown menu
3. Klika przycisk logout zawierający tekst "Wyloguj"
4. Czeka na przekierowanie do `/login`

**Przykład użycia:**

```typescript
import { logout } from '../fixtures/auth.fixture';

test('logout successfully', async ({ adminPage }) => {
  // adminPage jest zalogowany
  await expect(adminPage).toHaveURL('/dashboard');
  
  // Wyloguj
  await logout(adminPage);
  
  // Sprawdź redirect
  await expect(adminPage).toHaveURL('/login');
  
  // Sprawdź że login form jest widoczny
  await expect(adminPage.locator('input[name="email"]')).toBeVisible();
});
```

---

## 📅 Test Data (`test-data.ts`)

### Przegłąd

Test data fixture dostarcza:
- User credentials
- Reservation default data
- Date helpers
- Format helpers

### Import

```typescript
import { 
  testData,
  getFutureDate,
  getPastDate,
  getTodayDate,
  formatDatePL 
} from '../fixtures/test-data';
```

### Test Data

#### `testData.admin`

```typescript
{
  email: 'admin@gosciniecrodzinny.pl',
  password: 'Admin123!@#',
  firstName: 'Admin',
  lastName: 'System',
  role: 'ADMIN'
}
```

#### `testData.employee`

```typescript
{
  email: 'employee@gosciniecrodzinny.pl',
  password: 'Employee123!@#',
  firstName: 'Pracownik',
  lastName: 'Testowy',
  role: 'EMPLOYEE'
}
```

#### `testData.reservation`

```typescript
{
  guestsAdults: 100,
  guestsChildren: 0,
  deposit: 2000,
  totalPrice: 15000,
  client: {
    firstName: 'Jan',
    lastName: 'Kowalski',
    email: 'jan.kowalski@example.com',
    phone: '+48123456789'
  }
}
```

**Przykład użycia:**

```typescript
test('create reservation with test data', async ({ adminPage }) => {
  await adminPage.goto('/reservations/new');
  
  // Użyj test data
  await adminPage.fill('input[name="firstName"]', testData.reservation.client.firstName);
  await adminPage.fill('input[name="lastName"]', testData.reservation.client.lastName);
  await adminPage.fill('input[name="email"]', testData.reservation.client.email);
  await adminPage.fill('input[name="phone"]', testData.reservation.client.phone);
  
  await adminPage.fill('input[name="guestsAdults"]', String(testData.reservation.guestsAdults));
  await adminPage.fill('input[name="deposit"]', String(testData.reservation.deposit));
  
  await adminPage.click('button[type="submit"]');
  
  await expect(adminPage.locator('.success-message')).toBeVisible();
});
```

---

### Date Helpers

#### `getTodayDate(): string`

Zwraca dzisiejszą datę w formacie ISO (YYYY-MM-DD).

```typescript
const today = getTodayDate();
// '2026-02-08'
```

#### `getFutureDate(days: number): string`

Zwraca datę `days` dni w przyszłość w formacie ISO.

```typescript
const in30Days = getFutureDate(30);
// '2026-03-10'

const tomorrow = getFutureDate(1);
// '2026-02-09'
```

**Przykład użycia:**

```typescript
test('create queue entry for future date', async ({ adminPage }) => {
  const futureDate = getFutureDate(60); // 2 miesiące
  
  await adminPage.goto('/queue/new');
  await adminPage.fill('input[name="reservationQueueDate"]', futureDate);
  await adminPage.click('button[type="submit"]');
  
  await expect(adminPage.locator('.success-message')).toBeVisible();
});
```

#### `getPastDate(days: number): string`

Zwraca datę `days` dni w przeszłość w formacie ISO.

```typescript
const yesterday = getPastDate(1);
// '2026-02-07'

const lastWeek = getPastDate(7);
// '2026-02-01'
```

**Przykład użycia:**

```typescript
test('auto-cancel should handle past dates', async ({ adminPage }) => {
  const pastDate = getPastDate(3);
  
  await adminPage.goto('/queue');
  
  // Szukaj wpisów z przeszłych dat
  const pastSection = adminPage.locator(`[data-date="${pastDate}"]`);
  
  if (await pastSection.count() > 0) {
    // Sprawdź czy są anulowane
    const cancelledBadge = pastSection.locator('.status-cancelled');
    await expect(cancelledBadge).toBeVisible();
  }
});
```

#### `formatDatePL(dateString: string): string`

Formatuje datę ISO na format polski (DD.MM.YYYY).

```typescript
const isoDate = '2026-02-08';
const plDate = formatDatePL(isoDate);
// '08.02.2026'
```

**Przykład użycia:**

```typescript
test('display date in Polish format', async ({ adminPage }) => {
  const testDate = getFutureDate(30);
  const expectedDisplay = formatDatePL(testDate);
  
  await adminPage.goto('/queue');
  
  // Sprawdź czy data jest wyświetlana w polskim formacie
  await expect(adminPage.locator(`text=${expectedDisplay}`)).toBeVisible();
});
```

---

## 📝 Best Practices

### 1. Używaj właściwego fixture dla test case

```typescript
// ✅ GOOD - test wymaga auth
test('admin can delete reservation', async ({ adminPage }) => {
  await adminPage.goto('/reservations/123');
  await adminPage.click('button:has-text("Usuń")');
  // ...
});

// ❌ BAD - manual login niepotrzebny
test('admin can delete reservation', async ({ page }) => {
  await page.goto('/login');
  await page.fill('input[name="email"]', 'admin@...');
  // ...
});
```

### 2. Izolacja testów

Każdy test otrzymuje czysty context:

```typescript
test('test 1', async ({ adminPage }) => {
  // Fresh adminPage
  await adminPage.goto('/queue');
});

test('test 2', async ({ adminPage }) => {
  // Nowy fresh adminPage, nie ma wpływu test 1
  await adminPage.goto('/reservations');
});
```

### 3. Reuse test data

```typescript
// ✅ GOOD - reuse testData
import { testData } from '../fixtures/test-data';

await page.fill('input[name="email"]', testData.admin.email);

// ❌ BAD - hardcoded
await page.fill('input[name="email"]', 'admin@gosciniecrodzinny.pl');
```

### 4. Kombinacja fixtures

```typescript
test('concurrent operations', async ({ browser }) => {
  // Twórz multiple contexts
  const context1 = await browser.newContext();
  const page1 = await context1.newPage();
  
  // Manual login dla custom scenario
  await page1.goto('/login');
  await page1.fill('input[name="email"]', testData.admin.email);
  await page1.fill('input[name="password"]', testData.admin.password);
  await page1.click('button[type="submit"]');
  await page1.waitForURL('/dashboard');
  
  // ...
  
  await context1.close();
});
```

### 5. Date calculations

```typescript
// ✅ GOOD - dynamic dates
const testDate = getFutureDate(30);
const displayDate = formatDatePL(testDate);

// ❌ BAD - hardcoded dates (będą fail już jutro)
const testDate = '2026-02-08';
```

---

## 🧠 Implementacja Custom Fixtures

Jeśli potrzebujesz nowych fixtures:

### Przykład: Database cleanup fixture

```typescript
// fixtures/cleanup.fixture.ts
import { test as base } from '@playwright/test';

type CleanupFixtures = {
  cleanDatabase: () => Promise<void>;
};

export const test = base.extend<CleanupFixtures>({
  cleanDatabase: async ({}, use) => {
    // Setup
    await use(async () => {
      // Cleanup logic
      await fetch('http://localhost:4000/api/test/cleanup', {
        method: 'POST',
      });
    });
    
    // Teardown (po tescie)
    // ...
  },
});
```

**Użycie:**

```typescript
import { test, expect } from '../fixtures/cleanup.fixture';

test('test with cleanup', async ({ adminPage, cleanDatabase }) => {
  // Test logic
  // ...
  
  // Clean
  await cleanDatabase();
});
```

### Przykład: Mock data fixture

```typescript
// fixtures/mock-data.fixture.ts
import { test as base } from '../fixtures/auth.fixture';

type MockDataFixtures = {
  createTestReservation: (data: Partial<Reservation>) => Promise<Reservation>;
};

export const test = base.extend<MockDataFixtures>({
  createTestReservation: async ({ request }, use) => {
    await use(async (data) => {
      const response = await request.post('http://localhost:4000/api/reservations', {
        data: {
          ...testData.reservation,
          ...data,
        },
        headers: {
          'Authorization': 'Bearer ' + localStorage.getItem('auth_token'),
        },
      });
      
      return response.json();
    });
  },
});
```

---

## 🔍 Advanced: Storage State

Fixtures używają storage state do persist authentication:

```typescript
// W auth.fixture.ts (uproszczone)
const adminPage = await context.newPage();
await adminPage.goto('/login');
await adminPage.fill('input[name="email"]', testData.admin.email);
await adminPage.fill('input[name="password"]', testData.admin.password);
await adminPage.click('button[type="submit"]');
await adminPage.waitForURL('/dashboard');

// Token jest w localStorage, automatycznie dostępny dla page
```

### Zapisywanie storage state (opcjonalne)

```typescript
// Możesz zapisać auth state do pliku
await context.storageState({ path: '.auth/admin.json' });

// Później załadować
const context = await browser.newContext({
  storageState: '.auth/admin.json'
});
```

---

## 📚 Resources

- [Playwright Fixtures](https://playwright.dev/docs/test-fixtures)
- [Auth Best Practices](https://playwright.dev/docs/auth)
- [Test Data Patterns](https://playwright.dev/docs/test-parameterize)

---

**Autor:** Kamil Gol  
**Email:** kamilgolebiowski@10g.pl  
**Data:** 08.02.2026, 02:48 CET  
