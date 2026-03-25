# 🎯 E2E Tests — Status Implementacji

**Data utworzenia:** 08.02.2026
**Ostatnia aktualizacja:** 25.03.2026
**Status:** ✅ **CI ZIELONE — 231 passed, 0 failed, 38 skipped**
**Branch:** `claude/musing-wozniak` (PR #241)

---

## 🏆 Status CI (25.03.2026)

| Workflow | Status | Wynik |
|----------|--------|-------|
| **Backend CI/CD** | ✅ SUCCESS | Wszystkie testy przechodzą |
| **Frontend Tests** | ✅ SUCCESS | Wszystkie testy przechodzą |
| **E2E Smoke Tests** | ✅ SUCCESS | 10 passed |
| **Full E2E Tests** | ✅ SUCCESS | **231 passed, 0 failed, 38 skipped** |

---

## 📊 Pełna Inwentaryzacja Testów E2E

### Pliki testowe i ich status

| # | Plik | Aktywne | Pominięte | Razem | Status CI |
|---|------|---------|-----------|-------|-----------|
| 1 | `smoke.spec.ts` | 10 | 0 | 10 | ✅ PASS |
| 2 | `auth.spec.ts` | 11 | 0 | 11 | ✅ PASS |
| 3 | `reservations-crud.spec.ts` | 12 | 0 | 12 | ✅ PASS |
| 4 | `reservations-filters.spec.ts` | 13 | 0 | 13 | ✅ PASS |
| 5 | `queue-basic.spec.ts` | 16 | 0 | 16 | ✅ PASS |
| 6 | `queue-drag-drop.spec.ts` | 13 | 0 | 13 | ✅ PASS |
| 7 | `queue-promotion.spec.ts` | 14 | 0 | 14 | ✅ PASS |
| 8 | `clients.spec.ts` | 14 | 0 | 14 | ✅ PASS |
| 9 | `validations.spec.ts` | 19 | 0 | 19 | ✅ PASS |
| 10 | `bugfix-regression.spec.ts` | 14 | 0 | 14 | ✅ PASS |
| 11 | `concurrent.spec.ts` | 7 | 0 | 7 | ✅ PASS |
| 12 | `check-availability.spec.ts` | 4 | 0 | 4 | ✅ PASS |
| 13 | `pdf-generation.spec.ts` | 14 | 0 | 14 | ✅ PASS |
| 14 | `wizard-menu-template.spec.ts` | 4 | 5 | 9 | ✅ PASS |
| 15 | `menu-api-flow.spec.ts` | 17 | 18 | 35 | ✅ PASS |
| 16 | `menu-templates.spec.ts` | 9 | 6 | 15 | ✅ PASS |
| 17 | `menu-assignment.spec.ts` | 8 | 14 | 22 | ✅ PASS |
| 18 | `menu-calculator.spec.ts` | 8 | 14 | 22 | ✅ PASS |
| 19 | `history.spec.ts` | 12 | 12 | 24 | ✅ PASS (all skip) |
| | **RAZEM** | **219** | **69** | **288** | **✅ ALL GREEN** |

> **Uwaga:** CI raportuje 231 passed + 38 skipped = 269 (Playwright liczy inaczej niż grep po `test(` —
> niektóre testy są zagnieżdżone w `test.describe.serial` lub rozliczane jako sub-testy).

### Podział pominięte testy (38 skipped)

| Plik | Powód skip | Opis |
|------|-----------|------|
| `history.spec.ts` (12) | Brak endpointu `/api/audit-logs` z filtrami | Testy historii zmian czekają na rozbudowę API |
| `menu-api-flow.spec.ts` (≤18) | `test.skip()` warunkowy — brak endpointów `menu-options`, `addon-groups` | Część API menu jeszcze nie zaimplementowana |
| `menu-assignment.spec.ts` (14) | Brak seed data / endpointów menu | Testy przypisania menu do rezerwacji |
| `menu-calculator.spec.ts` (14) | Brak seed data / endpointów menu | Testy kalkulatora cen menu |
| `menu-templates.spec.ts` (6) | Brak seed data szablonów | Testy zarządzania szablonami |
| `wizard-menu-template.spec.ts` (5) | Brak seed data szablonów/pakietów w DB | Testy flow Szablon → Pakiet → Ceny w wizardzie |

---

## ✅ Co Jest Zaimplementowane i Działające

### Faza 1: Setup (100% ✅)
- ✅ `playwright.config.ts` — Chromium only na CI, retry 2x, screenshots on failure
- ✅ `e2e/fixtures/auth.ts` — `login()`, `authenticatedPage` fixture
- ✅ `e2e/fixtures/reservation.ts` — `ReservationHelper` (goToList, goToDetail, etc.)
- ✅ `e2e/fixtures/wizard.ts` — `WizardHelper` (selectRadix, selectDate, selectTime, selectClient, etc.)
- ✅ CI/CD: GitHub Actions workflow `e2e-tests.yml` z Smoke + Full E2E jobami

### Faza 2: Testy Krytyczne (100% ✅)

| Moduł | Plik | Testy | Status |
|-------|------|-------|--------|
| **Autentykacja** | `auth.spec.ts` | 11 | ✅ DONE |
| **Smoke / Nawigacja** | `smoke.spec.ts` | 10 | ✅ DONE |
| **Rezerwacje CRUD** | `reservations-crud.spec.ts` | 12 | ✅ DONE |
| **Rezerwacje Filtry** | `reservations-filters.spec.ts` | 13 | ✅ DONE |
| **Kolejka Basic** | `queue-basic.spec.ts` | 16 | ✅ DONE |
| **Kolejka Drag & Drop** | `queue-drag-drop.spec.ts` | 13 | ✅ DONE |
| **Kolejka Awansowanie** | `queue-promotion.spec.ts` | 14 | ✅ DONE |
| **Klienci** | `clients.spec.ts` | 14 | ✅ DONE |
| **Walidacje** | `validations.spec.ts` | 19 | ✅ DONE |
| **Bugfix Regression** | `bugfix-regression.spec.ts` | 14 | ✅ DONE |
| **Concurrent Operations** | `concurrent.spec.ts` | 7 | ✅ DONE |
| **Dostępność terminów** | `check-availability.spec.ts` | 4 | ✅ DONE |

### Faza 3: Testy Rozszerzone (częściowo ✅)

| Moduł | Plik | Aktywne/Skip | Status |
|-------|------|-------------|--------|
| **PDF Generation** | `pdf-generation.spec.ts` | 14/0 | ✅ DONE |
| **Wizard Menu** | `wizard-menu-template.spec.ts` | 4/5 | 🟡 Częściowe (brak seed data) |
| **Menu API Flow** | `menu-api-flow.spec.ts` | 17/18 | 🟡 Częściowe (brak endpointów) |
| **Menu Templates** | `menu-templates.spec.ts` | 9/6 | 🟡 Częściowe (brak seed data) |
| **Menu Assignment** | `menu-assignment.spec.ts` | 8/14 | 🟡 Częściowe (brak seed data) |
| **Menu Calculator** | `menu-calculator.spec.ts` | 8/14 | 🟡 Częściowe (brak seed data) |
| **Historia Zmian** | `history.spec.ts` | 0/12 | ⏳ Czeka na API audit-logs |

---

## ⏳ Co Pozostało Do Wykonania

### Priorytet 🔴 WYSOKI — Odblokowanie skipped testów

#### 1. Seed data dla testów menu (odblokowuje ~35 testów)
- Brak szablonów menu, pakietów cenowych w testowej bazie danych
- Potrzebne: `seed:test` skrypt tworzący min. 2 szablony + 2 pakiety + kursy
- **Dotyczy:** `wizard-menu-template`, `menu-templates`, `menu-assignment`, `menu-calculator`
- **Powiązane issue:** brak (do utworzenia)

#### 2. API endpoints menu-options i addon-groups (odblokowuje ~10 testów)
- `POST/GET/DELETE /api/menu-options` — nie zaimplementowane
- `POST/GET/DELETE /api/addon-groups` — nie zaimplementowane
- **Dotyczy:** `menu-api-flow.spec.ts` testy 8-10, 13-14
- **Powiązane issue:** #98 (zamknięte — do reopenowania lub nowy issue)

#### 3. API audit-logs z filtrami (odblokowuje 12 testów)
- Endpoint `GET /api/audit-logs?entityType=&entityId=` z filtrowaniem
- **Dotyczy:** `history.spec.ts` — wszystkie 12 testów
- **Powiązane issue:** #100

### Priorytet 🟡 ŚREDNI — Nowe testy

#### 4. Category Extras E2E (issue #218)
- Nowy `reservation-category-extras.spec.ts`
- Flow: rezerwacja → menu z extras → weryfikacja podsumowania → PDF
- **Powiązane issue:** #218

#### 5. Testy komponentów frontendowych (issue #101)
- React Testing Library testy dla kluczowych komponentów
- Wizard steps, DatePicker, TimePicker, Combobox
- **Powiązane issue:** #101

### Priorytet 🟢 NISKI — Quality of Life

#### 6. Naprawa jakości frontend testów (issue #239)
- `act()` warnings, wolne testy, słabe asercje
- **Powiązane issue:** #239

#### 7. Testy walidacji Zod (issue #238)
- 7 brakujących schematów walidacji
- **Powiązane issue:** #238

#### 8. Testy modułu Catering (issue #236)
- Zero pokrycia: 3 serwisy, 2 kontrolery, 2 walidacje
- **Powiązane issue:** #236

---

## 📋 Mapowanie na GitHub Issues

| Issue | Tytuł | Status | Dotyczy E2E? |
|-------|-------|--------|-------------|
| #92 | 🧪 EPIC: Plan testów automatycznych | OPEN | ✅ Nadrzędny epic |
| #93 | Faza 1: Konfiguracja środowiska | **CLOSED** ✅ | Setup done |
| #94 | Faza 2: Testy Rezerwacje | **CLOSED** ✅ | E2E done |
| #95 | Faza 2: Testy Kolejki | **CLOSED** ✅ | E2E done |
| #96 | Faza 2: Testy Autoryzacja | **CLOSED** ✅ | E2E done |
| #97 | Faza 2: Testy Depozyty | **CLOSED** ✅ | Integration done |
| #98 | Faza 3: Testy Menu | **CLOSED** ✅ | ⚠️ E2E częściowe — brak menu-options/addon-groups |
| #99 | Faza 3: Klienci/Sale/Wydarzenia | OPEN | ✅ E2E clients done, sale/wydarzenia brak |
| #100 | Faza 3: Raporty/Audit/PDF | OPEN | 🟡 PDF done, audit-logs czeka na API |
| #101 | Faza 3: Komponenty frontend (RTL) | OPEN | ⏳ Nie rozpoczęte |
| #102 | Faza 4: Regresja/a11y/metryki | OPEN | ⏳ Nie rozpoczęte |
| #218 | CategoryExtras: CSV/KPI/testy | OPEN | ⏳ E2E nie rozpoczęte |
| #236 | Testy Catering | OPEN | ⏳ Nie rozpoczęte |
| #237 | Testy reservation-validation | OPEN | ⏳ Nie rozpoczęte |
| #238 | Testy walidacji Zod | OPEN | ⏳ Nie rozpoczęte |
| #239 | Naprawa jakości frontend testów | OPEN | ⏳ Nie rozpoczęte |

---

## 🔧 Naprawy Wykonane na PR #241 (25.03.2026)

Podczas prac nad PR #241 naprawiono 79 → 0 failujących testów E2E:

### Główne naprawy:
1. **rdp v8 selektory** — `.rdp-nav_button_next` → `button[name="next-month"]`, `.rdp-day` → `button[name="day"]`
2. **Radix Popover stabilność** — unikanie `nextMonth()` w popoverze (powodowało detach DOM)
3. **Strict mode violations** — dodanie `.first()` do ambigous selektorów
4. **Queue heading ambiguity** — `getByRole('heading')` → `page.locator('h2').filter()`
5. **Sidebar nav ambiguity** — scope do `main` aby uniknąć matchowania sidebar
6. **Detail link matching** — `:not([href*="/list"]):not([href*="/calendar"])`
7. **Menu API field names** — `pricePerPerson` → `pricePerAdult/Child/Toddler`, `name` → `newName`
8. **Smoke 404 false positive** — `text=404` → `getByRole('heading', { name: '404' })`
9. **TimePicker w popoverze** — kliknięcie triggera przed wyborem slotu
10. **Form field names** — `babies` → `toddlers`

---

## 📊 Podsumowanie Liczbowe

| Metryka | Wartość |
|---------|--------|
| **Plików testowych E2E** | 19 |
| **Testów aktywnych (running)** | ~231 |
| **Testów pominięte (skip)** | ~38 |
| **Testów łącznie (w kodzie)** | ~288 |
| **Testów failujących** | **0** |
| **CI/CD workflows** | 3 (Backend, Frontend, E2E) |
| **Czas E2E suite** | ~11.3 min |
| **Pokrycie modułów krytycznych** | **100%** |
| **Pokrycie modułów rozszerzonych** | ~60% |

---

**Autor:** AI Assistant + Kamil Gol
**Ostatnia aktualizacja:** 25.03.2026
**Branch:** `claude/musing-wozniak` (PR #241)
**Status:** ✅ **ALL CI GREEN — 231 passed, 0 failed**
