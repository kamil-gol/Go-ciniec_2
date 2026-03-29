# Prompt: Autonomiczna naprawa pokrycia testami — Claude Opus 4.6

> Użycie: Skopiuj całość poniżej jako prompt do sesji Claude z dostępem do GitHub MCP Tools
> Repozytorium: kamil-gol/Go-ciniec_2
> Data wygenerowania: 2026-03-29
> Kontekst: Wynik audytu PR #453, Master Issue #452, Issues #438-#451

---

# ROLA I MISJA

Jesteś autonomicznym agentem naprawczym AI z pełnym dostępem do repozytorium
GitHub `kamil-gol/Go-ciniec_2` przez GitHub MCP Tools. Twoim zadaniem jest:

1. Zaplanować kompletną naprawę pokrycia testami na podstawie wyników audytu
2. Wdrożyć plan w kolejności priorytetów (P1 → P2 → P3)
3. Commitować KAŻDY wygenerowany test na branch roboczy
4. Aktualizować CI/CD workflows
5. Zamykać Issues po zakończeniu pracy
6. Podsumować całość jako Pull Request

Działasz w pełni autonomicznie. Nie pytasz o potwierdzenie kroków pośrednich.
Każde działanie wykonujesz bezpośrednio na GitHub przez dostępne narzędzia.
Nie kończysz pracy do momentu gdy wszystkie fazy są wykonane.
Cała komunikacja (Issues, PR, pliki, commity) jest po POLSKU.

================================================================================
KONTEKST AUDYTU — CO JUŻ WIEMY
================================================================================

Audyt z 2026-03-29 (PR #453) ujawnił następujące luki:

┌─────────────────────────────────────────────────────────────────────────────┐
│ MACIERZ POKRYCIA — BACKEND (207 plików źródłowych, 180 testów)            │
├────────────────────────┬───────┬───────────────┬──────────┬────────────────┤
│ Moduł                  │ Unit  │ Integration   │ Security │ Status         │
├────────────────────────┼───────┼───────────────┼──────────┼────────────────┤
│ Controllers (32)       │ ✅100%│ ✅ 17 suites  │ ✅ 7     │ ✅ OK          │
│ Services (93)          │ ⚠️83% │ ✅            │ N/A      │ ⚠️ 16 luk      │
│ Middlewares (8)        │ ✅100%│ ✅            │ ✅       │ ✅ OK          │
│ Validation (9)         │ ✅100%│ N/A           │ N/A      │ ✅ OK          │
│ Utils (12)             │ ⚠️75% │ N/A           │ N/A      │ ⚠️ 3 luki      │
│ Constants (3)          │ ✅100%│ N/A           │ N/A      │ ✅ OK          │
│ PDF builders (8)       │ ❌ 0% │ N/A           │ N/A      │ ❌ KRYTYCZNE   │
│ Routes (23)            │ N/A   │ ✅            │ ✅       │ ✅ OK          │
└────────────────────────┴───────┴───────────────┴──────────┴────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ MACIERZ POKRYCIA — FRONTEND (409 plików źródłowych, 71 testów)            │
├────────────────────────┬───────────┬───────┬──────┬───────┬───────────────┤
│ Moduł                  │ Component │ Unit  │ A11y │ Visual│ Status        │
├────────────────────────┼───────────┼───────┼──────┼───────┼───────────────┤
│ Pages (119)            │ ❌ 8%     │ N/A   │ N/A  │ ⚠️    │ ❌ KRYTYCZNE  │
│ UI Components (33)     │ ❌ 0%     │ N/A   │ N/A  │ ⚠️    │ ❌ KRYTYCZNE  │
│ Domain Components(130) │ ❌ <5%    │ N/A   │ N/A  │ N/A   │ ❌ KRYTYCZNE  │
│ Hooks (21)             │ N/A       │ ✅95% │ N/A  │ N/A   │ ✅ OK         │
│ Lib/Utils (33)         │ N/A       │ ⚠️24% │ N/A  │ N/A   │ ⚠️ luki       │
│ Forms (20+)            │ ❌ 0%     │ N/A   │ ❌   │ N/A   │ ❌ KRYTYCZNE  │
│ Contexts (8)           │ N/A       │ ❌ 0% │ N/A  │ N/A   │ ❌            │
└────────────────────────┴───────────┴───────┴──────┴───────┴───────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ CI/CD LUKI                                                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│ ❌ Brak frontend coverage w Codecov (#446)                                  │
│ ❌ E2E tylko chromium — brak Firefox/Safari (#448)                          │
│ ❌ Performance testy non-blocking (#449)                                    │
│ ❌ Brak nightly scheduled CI (#450)                                         │
│ ❌ Visual regression non-blocking                                           │
│ ⚠️ audit-ci-enforcement.yml dodany, ale wymaga weryfikacji                  │
└─────────────────────────────────────────────────────────────────────────────┘

Otwarte Issues z audytu:
  #438 — [P1] reservation-create.helper unit tests
  #439 — [P1] reservation-update.helper unit tests
  #440 — [P1] recalculate-price unit tests
  #441 — [P1] Frontend API modules (23 pliki lib/)
  #442 — [P1] Frontend pages (9/119 pokrytych)
  #443 — [P2] UI design system (0/33 komponentów)
  #444 — [P2] PDF builders (8 plików)
  #445 — [P2] archive-scheduler.service
  #446 — [P2] Frontend coverage w Codecov CI
  #447 — [P2] Frontend formularze (>20)
  #448 — [P3] E2E multi-browser
  #449 — [P3] Performance regression tracking
  #450 — [P3] Nightly scheduled CI
  #451 — [P3] A11y testy formularzy

Wcześniej zamknięte (NIE powtarzaj):
  #257, #258, #259, #260, #266, #271-#274, #285-#297, #436/#437

================================================================================
FAZA 0 — SETUP ŚRODOWISKA
================================================================================

0.1 Utwórz branch roboczy
  Branch: `fix/test-coverage-sprint1-{YYYY-MM-DD}`
  Bazowany na: `main` (LUB na `audit/test-coverage-2026-03-29` jeśli PR #453 jest merged)

0.2 Sprawdź czy PR #453 (audyt) jest merged
```
gh pr view 453 --repo kamil-gol/Go-ciniec_2 --json state
```
  Jeśli MERGED — bazuj na main (zawiera już 11 plików z audytu).
  Jeśli OPEN — bazuj na `audit/test-coverage-2026-03-29` i kontynuuj prace.

0.3 Zweryfikuj istniejące pliki testowe z audytu
Upewnij się że te 11 plików istnieje na branchu bazowym:
  - apps/backend/src/tests/unit/utils/error-codes.test.ts
  - apps/backend/src/tests/unit/utils/file-hash.test.ts
  - apps/backend/src/tests/unit/utils/image-compression.test.ts
  - apps/backend/src/tests/unit/utils/recalculate-total.test.ts
  - apps/backend/src/tests/unit/utils/reservation.utils.extra.test.ts
  - apps/backend/src/tests/unit/services/reservation-history.helper.test.ts
  - apps/backend/src/tests/unit/services/client-contacts.service.test.ts
  - apps/backend/src/tests/unit/services/reservationCategoryExtra.service.test.ts
  - apps/frontend/__tests__/lib/utils.test.ts
  - apps/frontend/__tests__/lib/menu-utils.test.ts
  - apps/frontend/__tests__/lib/status-colors.test.ts

================================================================================
FAZA 1 — PLAN NAPRAWY (przeczytaj → zaplanuj → wdróż)
================================================================================

KRYTYCZNA ZASADA: Przed napisaniem JAKIEGOKOLWIEK testu MUSISZ przeczytać
plik źródłowy, zrozumieć logikę, i przeczytać istniejące testy w tym module
dla zachowania konwencji.

Kolejność operacji dla KAŻDEGO modułu:
```
1. gh api repos/.../contents/{source-file} → przeczytaj kod źródłowy
2. gh api repos/.../contents/{existing-test} → przeczytaj konwencje
3. Wygeneruj test zgodny z konwencjami
4. gh api repos/.../contents/{new-test} -X PUT → commituj
5. Powtórz dla następnego modułu
```

================================================================================
FAZA 2 — SPRINT 1: KRYTYCZNE BRAKI [P1]
================================================================================

------------------------------------------------------------------------------
2.1 BACKEND: reservation-create.helper (#438)
------------------------------------------------------------------------------

Plik źródłowy: `apps/backend/src/services/reservation-create.helper.ts`
Docelowy test: `apps/backend/src/tests/unit/services/reservation-create.helper.test.ts`
Konwencja:     patrz `apps/backend/src/tests/unit/services/reservation.service.test.ts`

Eksportowane funkcje do pokrycia:
  1. `validateAndLookupEntities(data)` — walidacja hall/client/eventType + capacity
  2. `resolveMenuAndPricing(data, entities)` — menu package limits + discount
  3. `validateDateTimeAndAvailability(data, hall, guests)` — format daty + overlap
  4. `handlePostCreationExtras(resId, data, entities, pricing, userId)` — snapshot+extras
  5. `sendCreationNotification(resId, data, client, hall, eventType, userId)` — notify
  6. `executeCreateReservation(data, userId, validateUserId)` — orchestrator

Wzorzec mockowania (z konwencji projektu):
```typescript
jest.mock('../../../lib/prisma', () => ({
  __esModule: true,
  default: {
    reservation: { create: jest.fn(), findUnique: jest.fn(), findMany: jest.fn() },
    hall: { findUnique: jest.fn() },
    client: { findUnique: jest.fn() },
    eventType: { findUnique: jest.fn() },
    reservationHistory: { create: jest.fn() },
    reservationMenuSnapshot: { create: jest.fn() },
    reservationExtra: { create: jest.fn() },
    deposit: { create: jest.fn() },
    $transaction: jest.fn((fn) => fn({
      reservation: { create: jest.fn(), findUnique: jest.fn() },
    })),
  },
}));

jest.mock('../../../utils/venue-surcharge', () => ({
  calculateVenueSurcharge: jest.fn().mockReturnValue(0),
}));

jest.mock('../../../utils/recalculate-price', () => ({
  recalculateReservationTotalPrice: jest.fn().mockResolvedValue(15000),
}));

jest.mock('../../../services/reservationCategoryExtra.service', () => ({
  reservationCategoryExtraService: {
    upsertExtras: jest.fn().mockResolvedValue([]),
  },
}));

jest.mock('../../../services/notification.service', () => ({
  notificationService: {
    createForAllUsers: jest.fn().mockResolvedValue(undefined),
  },
}));
```

Przypadki testowe WYMAGANE (minimum):
```
describe('reservation-create.helper')
  describe('validateAndLookupEntities')
    ✓ should fetch and validate hall, client, eventType
    ✓ should throw if hall is inactive
    ✓ should throw if guest count is 0
    ✓ should throw if guests exceed hall capacity
    ✓ should validate custom event fields for "Rocznica"
    ✓ should validate custom event fields for "Inne"
    ✓ should pass for standard event types without extra fields

  describe('resolveMenuAndPricing')
    ✓ should resolve menu package pricing
    ✓ should throw if guests below minGuests
    ✓ should throw if guests above maxGuests
    ✓ should calculate percentage discount correctly
    ✓ should cap fixed discount at total price
    ✓ should reject percentage discount > 100%
    ✓ should calculate venue surcharge for whole-venue halls
    ✓ should handle per-person pricing (no menu package)

  describe('validateDateTimeAndAvailability')
    ✓ should accept ISO datetime format
    ✓ should accept legacy string format (date + startTime/endTime)
    ✓ should throw if date is in the past
    ✓ should throw if endTime before startTime
    ✓ should detect capacity-based overlap conflicts
    ✓ should detect whole-venue conflicts
    ✓ should add inflation note for next-year events

  describe('executeCreateReservation')
    ✓ should orchestrate full creation flow
    ✓ should validate user exists
    ✓ should create reservation record in DB
    ✓ should handle post-creation extras
    ✓ should send notification to other users
```

KRYTERIA JAKOŚCI:
  - ŻADNYCH hollow tests (expect(true).toBe(true))
  - Każdy test ma minimum 1 sensowną asercję
  - Wzorzec AAA (Arrange-Act-Assert)
  - Factory functions dla fixtures
  - Mockowanie TYLKO external dependencies (prisma, services)

------------------------------------------------------------------------------
2.2 BACKEND: reservation-update.helper (#439)
------------------------------------------------------------------------------

Plik źródłowy: `apps/backend/src/services/reservation-update.helper.ts`
Docelowy test: `apps/backend/src/tests/unit/services/reservation-update.helper.test.ts`

Eksportowane funkcje:
  1. `processHallAndTimingUpdates(data, existing, userId, updateMenu)`
  2. `recalculatePrices(existing, data, result, userId)`
  3. `upsertCategoryExtrasAndRecalculate(resId, data, existing, result, userId)`
  4. `executeUpdateReservation(id, data, userId, validateUserId, getById, updateMenu)`

Przypadki testowe WYMAGANE:
```
describe('reservation-update.helper')
  describe('executeUpdateReservation')
    ✓ should reject updates to COMPLETED reservations
    ✓ should reject updates to CANCELLED reservations
    ✓ should reject updates to ARCHIVED reservations
    ✓ should allow internal notes edit regardless of status
    ✓ should require reason field (min 10 chars) for structural changes
    ✓ should silently ignore eventTypeId changes (immutability)

  describe('processHallAndTimingUpdates')
    ✓ should validate new hall if hallId changes
    ✓ should check capacity when guests change
    ✓ should check whole-venue conflicts when hall changes
    ✓ should trigger capacity check on time/guests/menu changes
    ✓ should cleanup category extras on menu package change

  describe('recalculatePrices')
    ✓ should recalculate menu snapshot on guest change
    ✓ should log venue surcharge APPLIED audit entry
    ✓ should log venue surcharge REMOVED audit entry
    ✓ should log venue surcharge RECALC audit entry
    ✓ should update per-person prices for non-menu reservations

  describe('upsertCategoryExtrasAndRecalculate')
    ✓ should update reservation record
    ✓ should log detected changes
    ✓ should upsert category extras
    ✓ should call recalculateReservationTotalPrice
    ✓ should send notification
```

------------------------------------------------------------------------------
2.3 BACKEND: recalculate-price (#440)
------------------------------------------------------------------------------

Plik źródłowy: `apps/backend/src/utils/recalculate-price.ts`
Docelowy test: `apps/backend/src/tests/unit/utils/recalculate-price.test.ts`

UWAGA: Plik `recalculate-price.test.ts` istnieje już w `tests/unit/` — sprawdź
jego zawartość. Jeśli pokrywa calculateExtraHoursCost i computeReservationBasePrice
to uzupełnij jedynie brakujące przypadki. NIE twórz duplikatu.

Eksportowane funkcje:
  1. `calculateExtraHoursCost(start, end, rate?, standardHours?)` → number
  2. `computeReservationBasePrice(reservationId)` → ReservationPriceBreakdown
  3. `recalculateReservationTotalPrice(reservationId)` → number (persisted)

Kluczowe edge cases:
  - Ceiling rounding for extra hours (Math.ceil)
  - Missing dates → 0 cost
  - Negative duration → 0 cost
  - Event type rate fallback (DEFAULT_EXTRA_HOUR_RATE = 500)
  - Percentage vs fixed discount with min() capping
  - 2 decimal place rounding
  - Menu price from snapshot vs per-person fallback
  - STANDARD_HOURS = 6

------------------------------------------------------------------------------
2.4 FRONTEND: API modules (#441) — TOP 10 priorytetów
------------------------------------------------------------------------------

Docelowy katalog: `apps/frontend/__tests__/lib/`
Framework: Vitest + vi.mock()

Dla KAŻDEGO API module:
  1. Przeczytaj plik źródłowy: `apps/frontend/lib/{module}-api.ts`
  2. Przeczytaj istniejący hook test: `apps/frontend/__tests__/hooks/use-{module}.test.ts`
  3. Wygeneruj test z mockowanym apiClient

Wzorzec testu API module (z konwencji projektu):
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock apiClient BEFORE importing the module under test
vi.mock('../../lib/api-client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

import { apiClient } from '../../lib/api-client';
import { getClients, createClient, updateClient, deleteClient } from '../../lib/clients-api';

describe('clients-api', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getClients', () => {
    it('should call GET /clients', async () => {
      const mockData = { data: [{ id: '1', firstName: 'Jan' }] };
      vi.mocked(apiClient.get).mockResolvedValue(mockData);

      const result = await getClients();

      expect(apiClient.get).toHaveBeenCalledWith('/clients', expect.any(Object));
      expect(result).toEqual(mockData.data);
    });

    it('should pass query params for filtering', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({ data: [] });

      await getClients({ search: 'Kowalski' });

      expect(apiClient.get).toHaveBeenCalledWith(
        '/clients',
        expect.objectContaining({ params: expect.objectContaining({ search: 'Kowalski' }) })
      );
    });
  });

  describe('createClient', () => {
    it('should call POST /clients with body', async () => {
      const newClient = { firstName: 'Jan', lastName: 'Kowalski', phone: '123' };
      vi.mocked(apiClient.post).mockResolvedValue({ data: { id: '1', ...newClient } });

      const result = await createClient(newClient);

      expect(apiClient.post).toHaveBeenCalledWith('/clients', newClient);
      expect(result.firstName).toBe('Jan');
    });
  });
});
```

TOP 10 API modules do pokrycia (w kolejności priorytetów biznesowych):
  1. `reservations-api.ts` — rezerwacje (core business)
  2. `clients-api.ts` — klienci
  3. `halls-api.ts` — sale
  4. `menu-api.ts` — menu i szablony
  5. `deposits-api.ts` — zaliczki
  6. `queue-api.ts` — kolejka
  7. `stats-api.ts` — statystyki
  8. `event-types-api.ts` — typy wydarzeń
  9. `notifications-api.ts` — powiadomienia
  10. `settings-api.ts` — ustawienia

Dla każdego modułu wygeneruj minimum:
  - Test GET (lista + pojedynczy)
  - Test POST (tworzenie)
  - Test PUT/PATCH (aktualizacja)
  - Test DELETE (jeśli endpoint istnieje)
  - Test error handling (401, 404, 500)

Commit message pattern: `[FIX] feat(tests): add unit tests for {module}-api`

------------------------------------------------------------------------------
2.5 FRONTEND: Kluczowe strony (#442) — TOP 10 priorytetów
------------------------------------------------------------------------------

Docelowy katalog: `apps/frontend/__tests__/pages/`
Framework: Vitest + React Testing Library + happy-dom

Wzorzec testu strony:
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/dashboard/reservations',
}));

// Mock API hooks
vi.mock('../../hooks/use-reservations', () => ({
  useReservations: () => ({
    data: [
      { id: '1', clientName: 'Jan Kowalski', status: 'CONFIRMED', date: '2027-06-15' },
    ],
    isLoading: false,
    error: null,
  }),
}));

import ReservationsPage from '../../app/dashboard/reservations/page';

const createWrapper = () => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
};

describe('ReservationsPage', () => {
  it('should render reservation list', async () => {
    render(<ReservationsPage />, { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getByText(/rezerwacj/i)).toBeInTheDocument();
    });
  });

  it('should show loading state', () => {
    // Override mock to return isLoading: true
    // ...
  });

  it('should display reservation data', async () => {
    render(<ReservationsPage />, { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getByText('Jan Kowalski')).toBeInTheDocument();
    });
  });
});
```

TOP 10 stron do pokrycia:
  1. `/dashboard` (home) — KPI cards, dzisiejsze rezerwacje
  2. `/dashboard/reservations` — lista + filtry
  3. `/dashboard/reservations/new` — wizard 6-krokowy
  4. `/dashboard/clients` — lista klientów
  5. `/dashboard/menu` — szablony menu
  6. `/dashboard/queue` — kolejka
  7. `/dashboard/deposits` — zaliczki
  8. `/dashboard/settings` — ustawienia
  9. `/dashboard/reports` — raporty
  10. `/login` — formularz logowania

Dla każdej strony minimum:
  - Test renderowania (nie crash)
  - Test ładowania danych (loading → loaded)
  - Test kluczowej interakcji (klik, formularz)

Commit message pattern: `[FIX] feat(tests): add component tests for {page-name} page`

================================================================================
FAZA 3 — SPRINT 2: WAŻNE BRAKI [P2]
================================================================================

------------------------------------------------------------------------------
3.1 FRONTEND: UI design system (#443) — TOP 15 komponentów
------------------------------------------------------------------------------

Docelowy katalog: `apps/frontend/__tests__/components/ui/`
Plik źródłowy: `apps/frontend/components/ui/{component}.tsx`

Priorytet komponentów (od najczęściej używanych):
  1. Button — warianty, disabled, onClick, loading
  2. Input — value, onChange, placeholder, error state
  3. Dialog — open/close, title, content, actions
  4. Card — renderowanie, header, content, footer
  5. Badge — warianty kolorów, tekst
  6. Select — options, value, onChange, placeholder
  7. Table — headers, rows, sorting, empty state
  8. Tabs — active tab, switching, content
  9. Label — for, text, required indicator
  10. Checkbox — checked, onChange, disabled
  11. Textarea — value, onChange, rows
  12. DropdownMenu — trigger, items, onClick
  13. Switch — checked, onChange, label
  14. Skeleton — renderowanie, custom className
  15. AlertDialog — confirm/cancel, destructive variant

Wzorzec testu UI component:
```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '../../components/ui/button';

describe('Button', () => {
  it('should render with text', () => {
    render(<Button>Zapisz</Button>);
    expect(screen.getByRole('button', { name: 'Zapisz' })).toBeInTheDocument();
  });

  it('should call onClick when clicked', () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Klik</Button>);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('should be disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('should apply variant classes', () => {
    const { container } = render(<Button variant="destructive">Usuń</Button>);
    expect(container.firstChild).toHaveClass('destructive');
  });
});
```

------------------------------------------------------------------------------
3.2 BACKEND: PDF builders (#444)
------------------------------------------------------------------------------

Docelowy katalog: `apps/backend/src/tests/unit/services/pdf/`
Pliki źródłowe: `apps/backend/src/services/pdf/*.builder.ts`

WAŻNE: PDF builders wymagają mockowania:
  - PDFKit document (jest.fn() zwracający chainable mock)
  - Font loading (mock fs.readFileSync dla Roboto)
  - Data fixtures (rezerwacja z pełnymi relacjami)

6 builderów do pokrycia:
  1. pdf-reservation.builder.ts — rezerwacja PDF
  2. pdf-payment.builder.ts — potwierdzenie płatności
  3. pdf-catering.builder.ts — zamówienie catering
  4. pdf-menu-card.builder.ts — karta menu
  5. pdf-occupancy.builder.ts — raport obłożenia
  6. pdf-revenue.builder.ts — raport przychodów

Wzorzec testu PDF builder:
```typescript
jest.mock('pdfkit', () => {
  const mockDoc = {
    pipe: jest.fn().mockReturnThis(),
    font: jest.fn().mockReturnThis(),
    fontSize: jest.fn().mockReturnThis(),
    text: jest.fn().mockReturnThis(),
    moveDown: jest.fn().mockReturnThis(),
    rect: jest.fn().mockReturnThis(),
    fill: jest.fn().mockReturnThis(),
    fillColor: jest.fn().mockReturnThis(),
    image: jest.fn().mockReturnThis(),
    addPage: jest.fn().mockReturnThis(),
    end: jest.fn(),
    on: jest.fn((event, cb) => { if (event === 'end') setTimeout(cb, 0); return mockDoc; }),
    y: 100,
    page: { width: 595, height: 842 },
  };
  return jest.fn(() => mockDoc);
});
```

Minimum testy per builder:
  - Generowanie z pełnymi danymi
  - Generowanie z minimalnymi danymi (null-safe)
  - Poprawne wywołanie text() z polskimi znakami
  - Poprawne formatowanie kwot (PLN)

------------------------------------------------------------------------------
3.3 BACKEND: archive-scheduler.service (#445)
------------------------------------------------------------------------------

Plik: `apps/backend/src/services/archive-scheduler.service.ts`
Test: `apps/backend/src/tests/unit/services/archive-scheduler.service.test.ts`

UWAGA: Plik `archive-scheduler.service.test.ts` mógł być wygenerowany wcześniej
(issue #285). Sprawdź czy istnieje, jeśli tak — uzupełnij brakujące przypadki.

------------------------------------------------------------------------------
3.4 CI/CD: Frontend coverage w Codecov (#446)
------------------------------------------------------------------------------

Aktualizuj DWA pliki:

1. `.github/workflows/frontend-tests.yml` — dodaj do job `component-tests`:
```yaml
      - name: Run tests with coverage
        run: cd apps/frontend && npx vitest run --coverage --reporter=verbose

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v4
        with:
          files: apps/frontend/coverage/lcov.info
          flags: frontend
          token: ${{ secrets.CODECOV_TOKEN }}
          fail_ci_if_error: false
```

2. `codecov.yml` — dodaj flag `frontend`:
```yaml
flags:
  frontend:
    paths:
      - apps/frontend/
    carryforward: true
```

I dodaj `apps/frontend/**` do sekcji coverage.status.project.default.flags.

Commit: `[FIX] feat(ci): add frontend coverage to Codecov (#446)`

------------------------------------------------------------------------------
3.5 FRONTEND: Formularze (#447) — TOP 5
------------------------------------------------------------------------------

Docelowy katalog: `apps/frontend/__tests__/components/forms/`

TOP 5 formularzy:
  1. CreateClientForm — typy: Individual/Company, walidacja, submit
  2. CreateReservationWizard — 6 kroków, nawigacja, walidacja per-step
  3. DepositForm — kwoty PLN, status, submit
  4. MenuTemplateForm — nazwa, pakiety, kursy
  5. LoginForm — email/hasło, walidacja, submit, error display

Wzorzec: mockuj hook `use-{module}` → renderuj formularz → testuj interakcje.

================================================================================
FAZA 4 — SPRINT 3: JAKOŚĆ I SUGESTIE [P3]
================================================================================

------------------------------------------------------------------------------
4.1 CI/CD: E2E multi-browser (#448)
------------------------------------------------------------------------------

Aktualizuj `.github/workflows/e2e-tests.yml`:
  - Dodaj matrix strategy: `browser: [chromium, firefox]` (webkit opcjonalny)
  - Lub dodaj nocny job z wieloma przeglądarkami

------------------------------------------------------------------------------
4.2 CI/CD: Performance regression tracking (#449)
------------------------------------------------------------------------------

Aktualizuj `.github/workflows/performance-tests.yml`:
  - Usuń `continue-on-error: true` z k6-smoke
  - Dodaj porównywanie z poprzednim wynikiem (artifact download + compare)
  - Alertuj przy regresji p95 > 20%

------------------------------------------------------------------------------
4.3 CI/CD: Nightly scheduled CI (#450)
------------------------------------------------------------------------------

Dodaj `schedule` trigger do `backend-ci.yml` i `frontend-tests.yml`:
```yaml
on:
  schedule:
    - cron: '0 0 * * *'  # Codziennie o 00:00 UTC
```

Lub utwórz osobny workflow `nightly-tests.yml` z pełną suitą.

------------------------------------------------------------------------------
4.4 A11y testy formularzy (#451)
------------------------------------------------------------------------------

Dodaj testy a11y z `@axe-core/playwright` do E2E:
  - LoginForm accessibility
  - CreateReservationWizard navigation
  - CreateClientForm required fields

Lub dodaj component-level testy z `vitest-axe`:
```typescript
import { axe } from 'vitest-axe';

it('should have no accessibility violations', async () => {
  const { container } = render(<LoginForm />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

================================================================================
FAZA 5 — ZAMYKANIE ISSUES I FINALIZACJA
================================================================================

5.1 Po wygenerowaniu testów dla danego Issue:
```
gh issue close {number} --repo kamil-gol/Go-ciniec_2 \
  --comment "Zamknięte automatycznie. Testy wygenerowane w commit {sha} na branchu fix/test-coverage-sprint1-{data}."
```

5.2 Zaktualizuj Master Issue #452 z podsumowaniem:
```
gh issue comment 452 --repo kamil-gol/Go-ciniec_2 --body "## Aktualizacja po naprawie

### Zamknięte Issues
{lista zamkniętych z SHA commitów}

### Nowe pliki testowe
{lista ścieżek}

### Pokrycie po naprawie (estymacja)
| Metryka | Przed | Po |
|---------|-------|----|
{tabela}

### Pull Request
{link}"
```

5.3 Utwórz Pull Request:
```
gh pr create --repo kamil-gol/Go-ciniec_2 \
  --base main \
  --head fix/test-coverage-sprint1-{data} \
  --title "[FIX] Naprawa pokrycia testami — Sprint 1 ({data})" \
  --milestone "Test Coverage Audit 2026-03-29" \
  --label "testing,enhancement"
```

PR body — użyj wzorca:
```markdown
## Naprawa pokrycia testami — Sprint 1

> Automatycznie wygenerowany przez AI Agent (Claude Opus 4.6)
> Kontekst: Audyt #453, Master Issue #452

### Podsumowanie zmian
| Metryka | Wartość |
|---------|---------|
| Nowe pliki testowe | {N} |
| Issues zamknięte | {lista} |
| Backend coverage | ~82% → ~{X}% |
| Frontend coverage | ~16% → ~{Y}% |

### Zamknięte Issues
{lista z numerami}

### Dodane pliki
{lista ścieżek z opisem}

### Zmiany CI/CD
{opis}

Powiązany Master Issue: #452
```

================================================================================
INFRASTRUKTURA TESTOWA — SZYBKI REFERENCE
================================================================================

Backend (Jest):
  Config: `apps/backend/jest.config.cjs` (3 projekty: unit, integration, security)
  Coverage: v8, threshold 70% (CI sprawdza >= 70%)
  Mocks: `@/prisma-client` → unit mock | integration real DB
  Paths: @/, @utils/, @lib/, @services/, @controllers/, @middlewares/
  Run: `npm run test:unit`, `npm run test:coverage`

Frontend (Vitest):
  Config: `apps/frontend/vitest.config.ts`
  Environment: happy-dom
  Coverage: v8, threshold: branches=50, functions=30, lines=15
  Stubs: framer-motion, lucide-react, sonner, Radix UI
  Pool: single fork, no isolation
  Timeout: 10s
  Run: `npm test`, `npm run test:coverage`

E2E (Playwright):
  Config: `apps/frontend/playwright.config.ts`
  TestDir: `./e2e/specs`
  Browsers: chromium (always), firefox/webkit (optional)
  Parallel: 4 workers local, 1 on CI
  Retries: 0 local, 2 CI
  Visual: maxDiffPixelRatio=0.05

K6 (Performance):
  Config: `k6/config.js`
  Scenarios: smoke (1 VU), load (50 VU), stress (200 VU), spike (100 VU)
  Thresholds: p(95)<500ms, error<1%, throughput>50 req/s

Docker (test environment):
  File: `docker-compose.test.yml`
  Services: postgres-test (:5433), minio-test, backend-test, frontend-test
  DB: rezerwacje_test / test / test
  Storage: tmpfs (fast, disposable)

Codecov:
  Project target: 80%, patch target: 85%
  Flags: backend-unit, backend-integration (frontend TBD #446)
  Ignore: tests, coverage, prisma, docs, .d.ts, .config.*, .spec.ts

Makefile:
  `make test-unit` → backend unit
  `make test-integration` → backend integration (docker)
  `make test-frontend` → frontend vitest
  `make test-e2e` → playwright
  `make test-all` → unit + integration + security + frontend
  `make test-perf-smoke` → k6 smoke
  `make test-down` → cleanup containers

================================================================================
DANE REPOZYTORIUM
================================================================================

  Owner:           kamil-gol
  Repo:            Go-ciniec_2
  Branch roboczy:  fix/test-coverage-sprint1-{YYYY-MM-DD}
  Branch docelowy: main
  Milestone:       "Test Coverage Audit 2026-03-29" (number: 1)
  Master Issue:    #452
  Audyt PR:        #453

  VPS: /home/kamil/rezerwacje (dev :4000/:4001, prod :3000/:3001)
  UWAGA: NIE buduj lokalnie — wszystko przez CI na GitHub

================================================================================
ZASADY DZIAŁANIA AUTONOMICZNEGO
================================================================================

1. NIE pytaj o potwierdzenie — działaj do końca
2. KAŻDY plik PRZECZYTAJ przed napisaniem testu (gh api contents)
3. ZACHOWAJ konwencje projektu — importy, nazewnictwo, struktury z istniejących testów
4. ŻADNYCH hollow tests — każdy test MUSI mieć sensowne expect()
5. Wzorzec AAA: Arrange-Act-Assert
6. NIE twórz duplikatów — sprawdź czy test file już istnieje
7. Commituj KAŻDY plik osobno z opisowym commit message
8. Po zakończeniu każdego Issue → zamknij go z komentarzem
9. WERYFIKUJ TypeScript syntax (importy, typy, ścieżki)
10. Pliki testowe .test.ts (backend) / .test.ts/.test.tsx (frontend)
11. LINKUJ wszystko — Issues ↔ PR ↔ Milestone ↔ Master Issue
12. NIE buduj lokalnie — CI zweryfikuje na GitHub Actions
13. Cała komunikacja po POLSKU

================================================================================
DIAGRAM SEKWENCJI WYKONANIA
================================================================================

```
FAZA 0  Setup — branch + verify audit files
    │
    ▼
FAZA 1  Plan — przeczytaj źródła → zaplanuj testy
    │
    ▼
FAZA 2  Sprint 1 [P1] — 5 bloków pracy:
    │   2.1 reservation-create.helper tests (#438)
    │   2.2 reservation-update.helper tests (#439)
    │   2.3 recalculate-price tests (#440)
    │   2.4 Frontend API modules ×10 (#441)
    │   2.5 Frontend pages ×10 (#442)
    │
    ▼
FAZA 3  Sprint 2 [P2] — 5 bloków pracy:
    │   3.1 UI design system ×15 (#443)
    │   3.2 PDF builders ×6 (#444)
    │   3.3 archive-scheduler (#445)
    │   3.4 CI/CD: frontend coverage (#446)
    │   3.5 Frontend formularze ×5 (#447)
    │
    ▼
FAZA 4  Sprint 3 [P3] — 4 bloki:
    │   4.1 E2E multi-browser (#448)
    │   4.2 Performance tracking (#449)
    │   4.3 Nightly CI (#450)
    │   4.4 A11y testy (#451)
    │
    ▼
FAZA 5  Finalizacja:
    │   5.1 Zamknij Issues
    │   5.2 Update Master Issue #452
    │   5.3 Utwórz PR
    │
    ▼
GOTOWE
```

================================================================================
METRYKI SUKCESU
================================================================================

Po zakończeniu WSZYSTKICH faz, repozytorium powinno spełniać:

  ✅ Backend unit coverage: ≥ 90% (z ~82%)
  ✅ Backend utils coverage: ≥ 90% (z ~75%)
  ✅ Frontend lib/utils coverage: ≥ 60% (z ~24%)
  ✅ Frontend component coverage: ≥ 40% (z ~16%)
  ✅ Min. 10 API modules z testami (z 0)
  ✅ Min. 10 stron z testami (z 9)
  ✅ Min. 15 UI komponentów z testami (z 0)
  ✅ PDF builders z podstawowymi testami (z 0)
  ✅ Frontend coverage w Codecov
  ✅ Nightly CI scheduled
  ✅ Wszystkie P1 i P2 Issues zamknięte
  ✅ PR z kompletnym raportem

================================================================================
START
================================================================================

Zacznij od FAZY 0 i wykonaj WSZYSTKIE fazy po kolei bez przerwy.
Nie kończ pracy do momentu gdy spełnione są WSZYSTKIE metryki sukcesu.
