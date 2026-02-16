# 📋 Changelog

## [1.7.1] - 2026-02-16

### ✨ Nowe funkcjonalności (Sprint 8 — Audit Log UI)

**PR:** [#77](https://github.com/kamil-gol/Go-ciniec_2/pull/77) | **Branch:** `feature/us-9.8-entity-timeline` | **Status:** ✅ ZDEPLOYOWANE

#### US-9.8: Zakładka Historia w rezerwacji i kliencie

**Wymaganie biznesowe:**  
Użytkownicy systemu muszą mieć łatwy dostęp do pełnej historii zmian danej rezerwacji lub klienta bezpośrednio w widoku szczegółowym encji.

**Rozwiązanie:**  
Dodano zakładkę **Historia** (rezerwacja) oraz **Historia zmian** (klient) w widokach szczegółowych. Zakładka wyświetla chronologiczny timeline wszystkich akcji z audit logu związanych z konkretną encją.

##### Backend
- **Endpoint już istnieje:** `GET /api/audit-log/entity/:entityType/:entityId`
  - Został wdrożony w sprincie 7 (audit log system)
  - Zwraca posortowane wpisy audit log dla podanej encji (RESERVATION, CLIENT, itp.)

##### Frontend — Nowe pliki

| Plik | Opis |
|------|------|
| `lib/api/audit-log.ts` | React Query hook `useEntityActivityLog(entityType, entityId)` z auto-refresh 30s |
| `components/audit-log/EntityActivityTimeline.tsx` | Reużywalny timeline z framer-motion, polskimi labelami, rozwijalnymi szczegółami zmian |

##### Frontend — Zmodyfikowane pliki

| Plik | Zmiana |
|------|--------|
| `app/dashboard/reservations/[id]/page.tsx` | Tab bar **Szczegóły** / **Historia** pod hero section |
| `app/dashboard/clients/[id]/page.tsx` | Tab bar **Dane klienta** / **Historia zmian** pod stats grid |

##### Funkcjonalności UI

- 🎨 **Timeline design** — pionowa oś czasu z kolorowymi ikonami per typ akcji (CREATE, UPDATE, DELETE, STATUS_CHANGE, ARCHIVE, ATTACHMENT_ADD, MENU_RECALCULATED, itp.)
- 🇵🇱 **Polskie labele** — 22 typy akcji z polskimi nazwami (CREATE → Utworzenie, UPDATE → Aktualizacja, MENU_RECALCULATED → Przeliczenie menu)
- 📝 **Polskie nazwy pól** — 35+ pól (hall → Sala, client → Klient, guests → Goście łącznie, eventType → Typ wydarzenia, totalPrice → Cena całkowita)
- 📋 **Rozwijalne szczegóły** — diff zmian (stara → nowa wartość) z kolorowym stylingiem (czerwony przekreślony / zielony bold)
- 🔍 **Smart formatting:**
  - **Obiekty:** `hall` → wyświetla `hall.name`, `client` → `firstName + lastName`, `eventType` → `eventType.name`
  - **Statusy:** po polsku (CONFIRMED → Potwierdzona, PENDING → Oczekująca)
  - **Daty:** format `dd.MM.yyyy HH:mm`
  - **Ceny:** format `6 825 zł` z separatorem tysięcy
  - **Boolean:** Tak / Nie
- ⏳ **Stany UI** — skeleton loading (4 placeholders), empty state ("Brak historii zmian"), error state
- 🔄 **Auto-refresh** — React Query `refetchInterval: 30s` (automatyczne odświeżanie timeline)
- 🎭 **framer-motion** — animacje wejścia elementów timeline + smooth collapse/expand szczegółów
- 🔒 **Ukryte pola techniczne** — `menuSnapshot`, `createdBy`, `updatedBy`, `*Id` (clientId, hallId, eventTypeId), `menuSelections`, itp. nie są wyświetlane w diff

##### Bug #11: [object Object] w szczegółach zmian

**Commit:** [`fb76c4c`](https://github.com/kamil-gol/Go-ciniec_2/commit/fb76c4c7bd6417df90a70d4e5d7d95f9beae594f)

**Problem:**  
Pola typu `hall`, `client`, `eventType` wyświetlały `[object Object]` zamiast czytelnej wartości.

**Przyczyna:**  
Brak obsługi zagnieżdżonych obiektów w funkcji `formatFieldValue()`.

**Rozwiązanie:**  
Dodano funkcję `formatObjectValue()`, która inteligentnie wyciąga czytelne pola:
```typescript
function formatObjectValue(value: any): string | null {
  if (value.name) return value.name  // hall, eventType
  if (value.firstName && value.lastName) return `${value.firstName} ${value.lastName}`  // client
  // ... + fallbacki dla email, title, label, status
}
```

##### Obsługiwane typy akcji (22)

| Akcja | Label | Ikona | Kolor |
|-------|-------|-------|-------|
| CREATE | Utworzenie | Plus | Niebieski |
| UPDATE | Aktualizacja | Edit | Bursztynowy |
| DELETE | Usunięcie | Trash | Czerwony |
| STATUS_CHANGE | Zmiana statusu | RefreshCw | Fioletowy |
| ARCHIVE | Archiwizacja | Archive | Pomarańczowy |
| UNARCHIVE | Przywrócenie z archiwum | ArchiveRestore | Zielony |
| RESTORE | Przywrócenie | ArchiveRestore | Zielony |
| LOGIN | Logowanie | LogIn | Niebieski (sky) |
| LOGOUT | Wylogowanie | LogOut | Szary (slate) |
| QUEUE_ADD | Dodanie do kolejki | ListPlus | Teal |
| QUEUE_REMOVE | Usunięcie z kolejki | ListMinus | Różowy (rose) |
| QUEUE_SWAP | Zamiana pozycji | ArrowLeftRight | Fioletowy (purple) |
| QUEUE_MOVE | Przeniesienie | ArrowUpDown | Indygo |
| MARK_PAID | Oznaczenie płatności | CreditCard | Zielony |
| ATTACHMENT_ADD | Dodanie załącznika | Paperclip | Cyjan |
| ATTACHMENT_DELETE | Usunięcie załącznika | FileX | Różowy (pink) |
| MENU_RECALCULATED | Przeliczenie menu | Calculator | Limonkowy (lime) |
| MENU_CHANGE | Zmiana menu | Calculator | Limonkowy (lime) |
| DEPOSIT_ADD | Dodanie zaliczki | CreditCard | Zielony |
| DEPOSIT_UPDATE | Aktualizacja zaliczki | Edit | Bursztynowy |
| DEPOSIT_DELETE | Usunięcie zaliczki | Trash | Czerwony |
| PRICE_CHANGE | Zmiana ceny | Calculator | Bursztynowy |
| DISCOUNT_CHANGE | Zmiana rabatu | Calculator | Fioletowy (purple) |

### 🚀 Deployment

```bash
cd /home/kamil/rezerwacje
git checkout main
git pull origin main
docker compose restart frontend
```

**Status:** ✅ WYKONANE 2026-02-16 17:49 CET

### ✅ Testy (PASS)

| Test | Wynik |
|------|-------|
| Otwórz `/dashboard/reservations/:id` → kliknij **Historia** | ✅ Timeline wyświetla się, brak `[object Object]` |
| Otwórz `/dashboard/clients/:id` → kliknij **Historia zmian** | ✅ Timeline wyświetla się |
| Pole "hall" w diff | ✅ Wyświetla nazwę sali (np. "Sala Bankietowa") |
| Pole "client" w diff | ✅ Wyświetla imię i nazwisko (np. "Katarzyna Dąbrowska") |
| Pole "totalPrice" w diff | ✅ Format `6 825 zł` z separatorem |
| Pole "status" w diff | ✅ Po polsku ("Potwierdzona", "Oczekująca") |
| Akcja MENU_RECALCULATED | ✅ Label "Przeliczenie menu" + ikona kalkulatora + limonkowy badge |
| Kliknięcie "Szczegóły" | ✅ Rozwija diff zmian z kolorowaniem czerwony/zielony |
| Auto-refresh po 30s | ✅ React Query automatycznie odpytuje endpoint |

---

## [1.7.0] - 2026-02-15 ⚠️ W TRAKCIE

### ✨ Nowe funkcjonalności (Sprint 8 — Audit Log)

**PR:** TBD | **Branch:** `feat/audit-log-frontend` | **Dokumentacja:** [AUDIT_LOG_IMPLEMENTATION.md](AUDIT_LOG_IMPLEMENTATION.md)

- **System logowania audytu (Audit Trail)** — pełna historia wszystkich zmian w systemie.

#### Backend
- 6 nowych endpointów API (`/api/audit-log/*`):
  - `GET /api/audit-log` — lista logów z filtrami (action, entityType, userId, entityId, daty) i paginacją
  - `GET /api/audit-log/recent` — ostatnie N logów (dla widgetu dashboard)
  - `GET /api/audit-log/statistics` — statystyki (podział po typie, akcji, użytkownikach)
  - `GET /api/audit-log/meta/entity-types` — dostępne typy encji
  - `GET /api/audit-log/meta/actions` — dostępne akcje
  - `GET /api/audit-log/entity/:entityType/:entityId` — historia zmian konkretnej encji
- Service z filtrowaniem, paginacją i agregacją statystyk
- Controller z pełną walidacją i obsługą błędów

#### Frontend
- **Nowa strona:** `/dashboard/audit-log`
- **Komponenty:**
  - `AuditLogTable` — tabela z pełną historią zmian
  - `AuditLogFilters` — filtry (akcja, typ encji, zakres dat)
  - `AuditLogStats` — statystyki i liczniki
- **Hooks:** React Query integration z 6 custom hooks (`useAuditLogs`, `useRecentAuditLogs`, etc.)
- **Typy:** Pełne TypeScript definitions dla audit log

#### Funkcjonalności
- ✅ Filtrowanie po typie akcji (CREATE, UPDATE, DELETE)
- ✅ Filtrowanie po typie encji (CLIENT, RESERVATION, MENU, itp.)
- ✅ Filtrowanie po zakresie dat
- ✅ Paginacja (konfigurowalna ilość rekordów na stronę)
- ✅ Statystyki (liczniki, wykresy, top 10 użytkowników)
- ✅ Historia zmian dla konkretnej encji
- ✅ Widget z ostatnimi logami (gotowy do dashboard)

### 🐛 Bugfixy (Sprint 8)

#### Bug #10: Podwójny `/api/` w URL audit-log
**Commit:** [`99ebf99`](https://github.com/kamil-gol/Go-ciniec_2/commit/99ebf990e526fbbb1e61ac56130a5779e6d632b5)

**Problem:**  
Frontend wysyłał requesty do `/api/api/audit-log/*` zamiast `/api/audit-log/*` (404 Not Found).

**Przyczyna:**  
Hooks w `use-audit-log.ts` używały pełnych ścieżek z `/api/` prefix, ale `api` client już miał base URL z `/api/`.

**Rozwiązanie:**  
Usunięto `/api/` prefix ze wszystkich endpointów w hooks:
```typescript
// ❌ Przed
await api.get('/api/audit-log/statistics');

// ✅ Po
await api.get('/audit-log/statistics');
```

**Status:** ✅ Naprawione (wymaga pull + restart na serwerze)

### 📚 Zmienione/nowe pliki

#### Backend
- `apps/backend/src/routes/audit-log.routes.ts` — nowe routes
- `apps/backend/src/controllers/audit-log.controller.ts` — nowy kontroler
- `apps/backend/src/services/audit-log.service.ts` — nowy service
- `apps/backend/src/server.ts` — rejestracja routes

#### Frontend
- `apps/frontend/src/app/dashboard/audit-log/page.tsx` — nowa strona
- `apps/frontend/src/hooks/use-audit-log.ts` — nowe hooks
- `apps/frontend/src/components/audit-log/AuditLogTable.tsx` — nowy komponent
- `apps/frontend/src/components/audit-log/AuditLogFilters.tsx` — nowy komponent
- `apps/frontend/src/components/audit-log/AuditLogStats.tsx` — nowy komponent
- `apps/frontend/src/types/audit-log.types.ts` — nowe typy

#### Dokumentacja
- `AUDIT_LOG_IMPLEMENTATION.md` — pełna dokumentacja implementacji
- `CHANGELOG.md` — aktualizacja

### 🚀 Deployment (DO WYKONANIA)

```bash
cd /home/kamil/rezerwacje

# Pull najnowszych zmian
git pull origin feat/audit-log-frontend

# Zrestartuj frontend
docker-compose restart frontend

# Sprawdź logi
docker-compose logs -f frontend
```

### ✅ Testy (DO WYKONANIA po deploy)

| Test | Oczekiwany wynik |
|------|------------------|
| Otwórz `/dashboard/audit-log` | Strona ładuje się bez błędów |
| Console (F12) | Brak 404 dla `/api/audit-log/*` |
| Filtry | Działają (akcja, typ, daty) |
| Paginacja | Można przechodzić między stronami |
| Statystyki | Wyświetlają się poprawnie |

### ⚠️ Znane problemy

1. **Route Not Found (404)** — wymaga pull + restart na serwerze (nie zastosowano jeszcze fix'a)
2. **Brak danych testowych** — tabela `ActivityLog` może być pusta

---

## [1.6.0] - 2026-02-15

### ✨ Nowe funkcjonalności (Sprint 7 — System Rabatów)

- **System rabatów dla rezerwacji** — rabat procentowy lub kwotowy, z powodem i pełną kalkulacją ceny końcowej.

#### US-7.1: Schema & Migracja DB
- 5 nowych pól w `Reservation`: `discountType` (PERCENTAGE/FIXED), `discountValue` (Decimal), `discountAmount` (Decimal), `discountReason` (String), `priceBeforeDiscount` (Decimal).
- Migracja Prisma wdrożona na produkcji.

#### US-7.2: Backend API — Rabaty
- `PATCH /api/reservations/:id/discount` — zastosuj/edytuj rabat (typ, wartość, powód).
- `DELETE /api/reservations/:id/discount` — usuń rabat (przywraca cenę sprzed rabatu).
- Walidacja: value > 0, reason min 3 znaki, % ≤ 100, rabat nie może przekroczyć ceny.
- Historia: wpisy `DISCOUNT_APPLIED` / `DISCOUNT_REMOVED` w `ReservationHistory`.

#### US-7.3: Frontend — Rabat w szczegółach rezerwacji
- `DiscountSection.tsx` — komponent z 3 stanami: brak rabatu → „Dodaj rabat”; aktywny → karta z edit/delete; edycja → formularz z live preview.
- `discountApi` + hooki (`useApplyDiscount`, `useRemoveDiscount`) z cache invalidation.
- Integracja w `ReservationFinancialSummary.tsx`.
- `finalTotalPrice = effectiveTotalPrice - discountAmount` (prawidłowa kalkulacja ceny końcowej).

#### US-7.4: Frontend — Rabat w formularzu tworzenia rezerwacji ✅
- Sekcja „Rabat” w podsumowaniu nowej rezerwacji (wizard) z wyborem typu (% / PLN), wartością, powodem i live preview.
- Pola rabatu przekazywane do `POST /api/reservations`.

### 🐛 Bugfixy (Sprint 7)
- Fix mutacji discount (eliminacja `/reservations/undefined/discount`).
- Fix kalkulacji total bar: użycie `finalTotalPrice` (uwzględnia rabat).
- Fix layoutu DiscountSection (kompaktowy design, bez card-in-card).

### 📚 Zmienione/nowe pliki (wybrane)
- `apps/backend/prisma/schema.prisma` — pola rabatu.
- `apps/backend/src/services/discount.service.ts` — apply/remove.
- `apps/backend/src/controllers/discount.controller.ts` — kontroler.
- `apps/backend/src/routes/reservation.routes.ts` — endpointy rabatu.
- `apps/frontend/components/reservations/DiscountSection.tsx`.
- `apps/frontend/components/reservations/CreateReservationDiscountSection.tsx`.
- `apps/frontend/components/reservations/ReservationFinancialSummary.tsx`.

---

## [1.5.0] - 2026-02-15

### ✨ Nowe funkcjonalności (Sprint 6 — Quick Wins)

**PR:** [#62](https://github.com/kamil-gol/Go-ciniec_2/pull/62) | **Branch:** `feature/sprint-6-quick-wins`

- **US-6.2: Usunięcie nazwy sali z PDF** — potwierdzenie rezerwacji (PDF) nie zawiera już nazwy sali.
- **US-6.3: Usunięcie auto-notatki >6h** — zlikwidowano automatyczne dopisywanie notatki o dodatkowych godzinach.
- **US-6.4: Blokada statusu COMPLETED przed datą wydarzenia** — zmiana statusu na COMPLETED jest blokowana, jeśli wydarzenie jeszcze się nie zakończyło.
- **US-6.6: Auto-notatka o inflacji** — przy tworzeniu rezerwacji na następny rok system dopisuje informację o możliwej zmianie cen.

### 📚 Zmienione pliki
- `apps/backend/src/services/pdf-generator.service.ts` — US-6.2
- `apps/backend/src/services/reservation.service.ts` — US-6.3, US-6.4, US-6.6

### ✅ Testy (wykonane na serwerze produkcyjnym)
| Test | Wynik |
|------|-------|
| US-6.2: `strings test-pdf.pdf \| grep sala` → pusty | ✅ PASS |
| US-6.3: Rezerwacja 8h → notes bez extra hours | ✅ PASS |
| US-6.4: COMPLETED na przyszłą datę → błąd 400 | ✅ PASS |
| US-6.6: Rezerwacja na 2027 → auto-notatka inflacja | ✅ PASS |

### 🚀 Deployment
```bash
cd /home/kamil/rezerwacje && git checkout main && git pull origin main && docker compose restart backend
```

---

## [1.4.4] - 2026-02-15

### 🐛 Bugfixy
- **Fix kodowania UTF-8 w szczegółach rezerwacji** — zamiana ~12 Unicode escape sequences na poprawne polskie znaki w `reservations/[id]/page.tsx`.
- **Fix API Error 500: `/api/attachments`** — `attachment.routes.ts` wywoływał `attachmentController.list()`, ale kontroler eksportuje tę metodę jako `getByEntity()`. Zmieniono wywołanie na `.getByEntity()`.

### 📚 Zmienione pliki
- `apps/frontend/app/dashboard/reservations/[id]/page.tsx`
- `apps/backend/src/routes/attachment.routes.ts`

### 🚀 Deployment
```bash
cd /home/kamil/rezerwacje && git pull origin main && docker compose restart backend frontend
```

---

## [1.4.3] - 2026-02-15

### 🚀 Ulepszenia
- **Frontend w trybie produkcyjnym** — przejście na `npm run build && npm run start` oraz `NODE_ENV=production`.
- **Backend pozostaje w trybie dev** — `npm run dev` (zmiana planowana osobno).

### 📚 Zmienione pliki
- `docker-compose.yml`

---

## [1.4.2] - 2026-02-15

### 🐛 Bugfixy
- **Fix kodowania UTF-8 w formularzu rezerwacji** — zamiana ~100+ Unicode escape sequences (`\\uXXXX`) na poprawne znaki UTF-8 w `create-reservation-form.tsx`.

---

## [1.4.1] - 2026-02-15

### 🐛 Bugfixy
- Fix build error: brakujący moduł `./client` w `menu-selection.ts`.
- Fix crash buildu przez `NODE_ENV` dual-bundle.
- Fix fallback 404 dla App Router (`app/not-found.tsx`).

---

## [1.4.0] - 2026-02-14

### ✨ Nowe funkcjonalności
- **Redesign formularza rezerwacji — 6-krokowy Wizard UI** (PR #49).

---

## [1.3.0] - 2026-02-14

### ✨ Nowe funkcjonalności
- **Karta Menu PDF** — generowanie karty menu jako PDF.

---

## [1.2.0] - 2026-02-14

### ✨ Nowe funkcjonalności
- **Detekcja konfliktu \"Cała Sala\"**.

---

## [1.1.0] - 2026-02-14

### 🔒 Bezpieczeństwo
- **Auth middleware na endpointach menu**.

---

## [1.0.0] - 2026-02-14

### 📚 Dokumentacja
- Pełna aktualizacja CURRENT_STATUS.md + API.md.

---

## [0.9.8] - 2026-02-14

### ✨ Nowe funkcjonalności
- **Moduł Typy Wydarzeń** — pełny frontend CRUD.

---

## [0.9.7] - 2026-02-11

### ✨ Nowe funkcjonalności
- **System Menu & Dania**.

---

## [0.9.6] - 2026-02-09

### 🐛 Bugfixy
- Bug #9: Nullable constraints + batch update.

---

## [0.9.5] - 2026-02-07

### 🐛 Bugfixy
- Bug #5-#8: Race conditions, loading, auto-cancel, walidacje.

---

## [0.9.0] - 2026-02-06

### ✨ Nowe funkcjonalności
- System rezerwacji (pełny CRUD) + kolejka + sale + klienci + typy wydarzeń.
