# 🧪 Plan Testów Automatycznych — Go-ciniec_2

> **Data utworzenia:** 2026-02-18
> **System:** Go-ciniec Rodzinny — System rezerwacji sal
> **Monorepo:** `apps/backend` (TypeScript/Node.js/Express) + `apps/frontend` (Next.js/React/Tailwind)

---

## Spis treści

1. [Architektura systemu](#architektura-systemu)
2. [Moduł 1: Rezerwacje](#moduł-1-rezerwacje-reservations)
3. [Moduł 2: System Kolejek](#moduł-2-system-kolejek-queue)
4. [Moduł 3: Menu i Posiłki](#moduł-3-menu-i-posiłki)
5. [Moduł 4: Klienci](#moduł-4-klienci-clients)
6. [Moduł 5: Autoryzacja i Uprawnienia](#moduł-5-autoryzacja-i-uprawnienia)
7. [Moduł 6: Sale](#moduł-6-sale-halls)
8. [Moduł 7: Zaliczki / Depozyty](#moduł-7-zaliczki--depozyty)
9. [Moduł 8: Raporty i Statystyki](#moduł-8-raporty-i-statystyki)
10. [Moduł 9: Audit Log](#moduł-9-audit-log)
11. [Moduł 10: Załączniki i PDF](#moduł-10-załączniki-i-pdf)
12. [Moduł 11: Typy Wydarzeń](#moduł-11-typy-wydarzeń)
13. [Strategia wdrożenia](#strategia-wdrożenia-testów)
14. [Struktura plików testów](#struktura-plików-testów)

---

## Architektura systemu

| Warstwa | Technologia | Lokalizacja |
|---|---|---|
| **Backend** | TypeScript / Node.js / Express | `apps/backend/src/` |
| **Frontend** | Next.js / React / TypeScript / Tailwind | `apps/frontend/` |
| **Baza danych** | PostgreSQL (via Prisma/Docker) | `docker-compose.yml` |
| **E2E (istniejące)** | Playwright | `apps/frontend/e2e/` |

### Narzędzia testowe

| Typ testu | Narzędzie | Cel |
|---|---|---|
| Jednostkowe backend | **Jest** | Serwisy, kontrolery, middleware, walidatory |
| Integracyjne API | **Jest + Supertest** | Endpointy REST, baza danych |
| Komponenty frontend | **Jest + React Testing Library** | Komponenty React, hooki, formularze |
| E2E | **Playwright** (już skonfigurowany) | Pełne scenariusze użytkownika |

---

## Moduł 1: Rezerwacje (Reservations)

> Najważniejszy moduł systemu — `reservation.service.ts` (~43KB kodu)

### 1.1 Testy jednostkowe backendu

**Plik:** `apps/backend/src/tests/unit/services/reservation.service.test.ts`

- Walidacja dat rezerwacji (data w przeszłości, nakładające się terminy)
- Sprawdzanie konfliktów rezerwacji (ta sama sala, nakładające się godziny)
- Obliczanie kosztów rezerwacji (base price + dodatki + rabaty)
- Zmiana statusów (potwierdzona → anulowana → zakończona)
- Paginacja i filtrowanie wyników
- Edge case: rezerwacja na przełomie dnia (23:00 - 01:00)

**Plik:** `apps/backend/src/tests/unit/controllers/reservation.controller.test.ts`

- Testy request/response dla każdego endpointu
- Walidacja parametrów wejściowych (body, params, query)
- Obsługa błędów 400/404/500
- Sprawdzenie middleware auth na endpointach

**Plik:** `apps/backend/src/tests/unit/services/reservation-menu.service.test.ts`

- Przypisywanie menu do rezerwacji
- Przeliczanie cen z menu
- Tworzenie snapshotów menu (zmiana szablonu nie zmienia istniejącej rezerwacji)

### 1.2 Testy integracyjne backendu (API)

**Plik:** `apps/backend/src/tests/integration/reservations.api.test.ts`

- `POST /api/reservations` — tworzenie rezerwacji z pełnymi danymi
- `PUT /api/reservations/:id` — edycja, w tym zmiana sali/daty
- `GET /api/reservations` — filtrowanie po dacie, sali, statusie, kliencie
- `GET /api/reservations/:id` — pobieranie szczegółów
- `DELETE /api/reservations/:id` — usuwanie i walidacja kaskadowa
- Test konfliktu rezerwacji (ta sama sala, nakładające się godziny) → 409 Conflict
- Test race conditions (równoczesne rezerwacje na tę samą salę) — znany bug `BUG5_RACE_CONDITIONS.md`
- Test autoryzacji — brak tokenu, niewystarczające uprawnienia

### 1.3 Testy komponentów frontendowych

**Katalog:** `apps/frontend/__tests__/components/reservations/`

- Formularz tworzenia rezerwacji — walidacja pól, obsługa dat, wybór sali
- Formularz edycji rezerwacji — pre-fill danych, zapis zmian
- Lista rezerwacji — sortowanie, filtrowanie, paginacja
- Widok kalendarza — poprawne wyświetlanie rezerwacji
- Komponent statusu — poprawne kolory i etykiety
- Walidacja formularzy (daty, liczba gości, wymagane pola)

### 1.4 Testy E2E (Playwright)

**Istniejący:** `apps/frontend/e2e/reservations-crud.spec.ts` — rozszerzyć o:
- Edge case: rezerwacja na dzień dzisiejszy
- Edycja rezerwacji z przeniesieniem na inną salę
- Usunięcie rezerwacji z potwierdzeniem

**Nowy:** `apps/frontend/e2e/reservations-filters.spec.ts`
- Filtrowanie po zakresie dat
- Filtrowanie po sali
- Filtrowanie po statusie
- Filtrowanie po kliencie
- Kombinacja wielu filtrów
- Reset filtrów

---

## Moduł 2: System Kolejek (Queue)

> Moduł z wieloma znanymi bugami — `queue.service.ts` (~27KB)

### 2.1 Testy jednostkowe backendu

**Plik:** `apps/backend/src/tests/unit/services/queue.service.test.ts`

- Dodawanie elementu do kolejki (na koniec, na określoną pozycję)
- Promowanie elementu z kolejki do rezerwacji
- Zmiana pozycji elementu (drag & drop backend)
- Obsługa nullable pól — znany bug `BUG9_QUEUE_NULLABLE.md`
- Batch updates — wiele zmian pozycji naraz
- Race conditions w batch update — znany bug `BUG9_BATCH_UPDATE_RACE_CONDITION.md`

**Plik:** `apps/backend/src/tests/unit/controllers/queue.controller.test.ts`

- Walidacja pozycji — znany bug `BUG8_POSITION_VALIDATION.md`
- Odpowiedzi API dla różnych scenariuszy błędów

### 2.2 Testy integracyjne backendu

**Plik:** `apps/backend/src/tests/integration/queue.api.test.ts`

- CRUD kolejek z walidacją pozycji
- Promowanie elementu z kolejki do rezerwacji (pełny flow)
- Równoczesne operacje batch update (test transakcji)
- Testy nullable pól w operacjach CRUD
- Usuwanie elementu i reindeksacja pozycji

### 2.3 Testy komponentów frontendowych

**Katalog:** `apps/frontend/__tests__/components/queue/`

- Lista kolejki — renderowanie, sortowanie
- Drag & drop — simulacja przeciągania (zgodnie z `DRAG_AND_DROP_IMPLEMENTATION.md`)
- Formularz dodawania do kolejki
- Przycisk promowania + dialog potwierdzenia

### 2.4 Testy E2E (Playwright)

**Istniejące (rozszerzenie):**
- `queue-basic.spec.ts` — dodać testy usuwania, edycji inline
- `queue-drag-drop.spec.ts` — dodać testy graniczne (pierwszy↔ostatni)
- `queue-promotion.spec.ts` — dodać test promocji z pre-fillem danych

**Nowy:** `apps/frontend/e2e/queue-edge-cases.spec.ts`
- Pusta kolejka — UI komunikat
- Kolejka z jednym elementem — drag & drop disabled
- Maksymalna ilość elementów
- Cofanie ostatniej operacji (undo)

---

## Moduł 3: Menu i Posiłki

> Złożony moduł z wieloma powiązanymi serwisami

### 3.1 Testy jednostkowe backendu

**Pliki testów:**

| Serwis | Plik testu | Kluczowe scenariusze |
|---|---|---|
| `menu.service.ts` (~19KB) | `menu.service.test.ts` | Szablony, pakiety, opcje, kalkulacja cen |
| `menuCourse.service.ts` | `menuCourse.service.test.ts` | CRUD kursów, sortowanie pozycji |
| `menuSnapshot.service.ts` | `menuSnapshot.service.test.ts` | Tworzenie snapshotów, immutability |
| `dish.service.ts` | `dish.service.test.ts` | CRUD dań, przypisanie do kategorii |
| `packageCategory.service.ts` | `packageCategory.service.test.ts` | Hierarchia kategorii pakietów |
| `addonGroup.service.ts` | `addonGroup.service.test.ts` | Grupy dodatków, min/max selekcji |
| `discount.service.ts` | `discount.service.test.ts` | Kalkulacja rabatów (%, kwotowy, warunkowy) |

### 3.2 Testy integracyjne backendu

**Plik:** `apps/backend/src/tests/integration/menu.api.test.ts`

- `POST/PUT/DELETE /api/menu-templates` — pełny CRUD szablonów
- `POST/PUT/DELETE /api/menu-packages` — pakiety menu
- `POST/PUT/DELETE /api/menu-options` — opcje menu
- `POST/PUT/DELETE /api/menu-courses` — kursy/dania w menu
- `POST/PUT/DELETE /api/dishes` — zarządzanie daniami
- `POST/PUT/DELETE /api/dish-categories` — kategorie dań
- `POST/PUT/DELETE /api/addon-groups` — grupy dodatków
- `/api/menu-calculator` — kalkulator cen menu (różne kombinacje)
- `/api/menu-package-categories` — kategorie pakietów
- Test spójności: edycja szablonu NIE zmienia snapshotów istniejących rezerwacji

### 3.3 Testy komponentów frontendowych

**Katalog:** `apps/frontend/__tests__/components/menu/`

- Konfigurator menu — dodawanie kursów, dań, dodatków
- Kalkulator cen — dynamiczne przeliczanie
- Drag & drop kursów — zmiana kolejności
- Formularz szablonu menu
- Selektor pakietów — wybór z ograniczeniami min/max

### 3.4 Testy E2E (Playwright)

**Nowy:** `apps/frontend/e2e/menu-templates.spec.ts`
- Tworzenie szablonu menu od zera (z kursami, daniami, dodatkami)
- Edycja istniejącego szablonu
- Klonowanie szablonu
- Usunięcie szablonu (z weryfikacją że nie jest używany)

**Nowy:** `apps/frontend/e2e/menu-calculator.spec.ts`
- Obliczenia cen z różnymi pakietami
- Dodanie/usunięcie dodatków i wpływ na cenę
- Zastosowanie rabatu i weryfikacja kalkulacji
- Kalkulacja dla różnych liczb gości

**Nowy:** `apps/frontend/e2e/menu-assignment.spec.ts`
- Przypisanie menu do nowej rezerwacji
- Zmiana menu w istniejącej rezerwacji
- Weryfikacja snapshotu po zmianie szablonu

---

## Moduł 4: Klienci (Clients)

### 4.1 Testy jednostkowe backendu

**Plik:** `apps/backend/src/tests/unit/services/client.service.test.ts`

- CRUD klientów
- Wyszukiwanie po nazwie, telefonie, email
- Walidacja danych kontaktowych (format telefonu, email)
- Sprawdzanie duplikatów (ten sam telefon/email)
- Pobieranie klienta z powiązanymi rezerwacjami

### 4.2 Testy integracyjne backendu

**Plik:** `apps/backend/src/tests/integration/clients.api.test.ts`

- API CRUD z walidacją unikalności
- Wyszukiwanie z autocomplete
- Powiązanie klient → rezerwacje (usunięcie klienta z aktywnymi rezerwacjami → 409)

### 4.3 Testy komponentów frontendowych

**Katalog:** `apps/frontend/__tests__/components/clients/`

- Lista klientów — sortowanie, wyszukiwanie
- Formularz klienta — walidacja pól
- Autocomplete klienta w formularzu rezerwacji

### 4.4 Testy E2E (Playwright)

**Istniejący:** `apps/frontend/e2e/clients.spec.ts` — rozszerzyć o:
- Edycja danych klienta
- Próba usunięcia klienta z rezerwacjami (oczekiwany błąd)
- Wyszukiwanie klienta w formularzu rezerwacji (autocomplete)

---

## Moduł 5: Autoryzacja i Uprawnienia

### 5.1 Testy jednostkowe backendu

**Pliki testów:**

| Serwis | Scenariusze |
|---|---|
| `auth.service.ts` | Logowanie (poprawne/błędne dane), generowanie JWT, odświeżanie tokenów, hashowanie haseł |
| `roles.service.ts` | CRUD ról, przypisanie/odebranie uprawnień, domyślna rola |
| `permissions.service.ts` | Sprawdzanie uprawnień do zasobów, cache uprawnień |
| `users.service.ts` | CRUD użytkowników, zmiana hasła, dezaktywacja konta |

### 5.2 Testy integracyjne backendu

**Plik:** `apps/backend/src/tests/integration/auth.api.test.ts`

- `POST /api/auth/login` — poprawne dane → 200 + token
- `POST /api/auth/login` — błędne dane → 401
- `POST /api/auth/login` — zablokowane konto → 403
- `POST /api/auth/refresh` — odświeżanie tokenu → nowy access token
- `POST /api/auth/refresh` — expired refresh token → 401
- Middleware `auth` — request bez tokenu → 401
- Middleware `auth` — expired access token → 401
- Middleware uprawnień — admin vs user vs readonly na chronionych endpointach

### 5.3 Testy E2E (Playwright)

**Istniejący:** `apps/frontend/e2e/auth.spec.ts` — rozszerzyć o:
- Logowanie z różnymi rolami
- Automatyczny logout po wygaśnięciu sesji
- Remember me / persistent login

**Nowy:** `apps/frontend/e2e/permissions.spec.ts`
- Użytkownik z rolą admin — widzi wszystkie opcje menu
- Użytkownik z rolą user — ograniczony dostęp
- Użytkownik readonly — brak przycisków edycji/usuwania
- Próba dostępu do chronionej strony przez URL → redirect do 403

---

## Moduł 6: Sale (Halls)

### 6.1 Testy jednostkowe backendu

**Plik:** `apps/backend/src/tests/unit/services/hall.service.test.ts`

- CRUD sal
- Walidacja pojemności (min/max gości)
- Sprawdzanie dostępności sali w danym terminie
- Pobieranie sal z rezerwacjami w danym zakresie dat

### 6.2 Testy integracyjne backendu

**Plik:** `apps/backend/src/tests/integration/halls.api.test.ts`

- CRUD sal z walidacją
- Sprawdzanie dostępności: `GET /api/halls/availability?date=...`
- Usunięcie sali z przyszłymi rezerwacjami → 409

### 6.3 Testy komponentów frontendowych

**Katalog:** `apps/frontend/__tests__/components/halls/`

- Lista sal — karty sal z pojemnością
- Formularz edycji sali
- Widok dostępności (kalendarz sal)

### 6.4 Testy E2E (Playwright)

**Nowy:** `apps/frontend/e2e/halls-management.spec.ts`
- Dodawanie nowej sali
- Edycja parametrów sali
- Sprawdzanie dostępności w kalendarzu
- Próba usunięcia sali z rezerwacjami

---

## Moduł 7: Zaliczki / Depozyty

### 7.1 Testy jednostkowe backendu

**Plik:** `apps/backend/src/tests/unit/services/deposit.service.test.ts`

- Tworzenie depozytu powiązanego z rezerwacją (~21KB logiki)
- Zmiana statusu płatności (oczekujący → wpłacony → zwrócony)
- Obliczanie kwoty depozytu (% od wartości rezerwacji)
- Walidacja terminów płatności

**Plik:** `apps/backend/src/tests/unit/services/deposit-reminder.service.test.ts`

- Generowanie przypomnień o zbliżającym się terminie
- Logika retry (nieudane przypomnienia)
- Filtrowanie depozytów wymagających przypomnienia

### 7.2 Testy integracyjne backendu

**Plik:** `apps/backend/src/tests/integration/deposits.api.test.ts`

- CRUD depozytów powiązanych z rezerwacjami
- Statusy: oczekujący → wpłacony → zwrócony
- Automatyczne przypomnienia (cron mock)
- Usunięcie rezerwacji → anulowanie powiązanego depozytu

### 7.3 Testy komponentów frontendowych

**Katalog:** `apps/frontend/__tests__/components/deposits/`

- Lista depozytów — statusy kolorami
- Formularz depozytu — kalkulacja kwoty
- Historia płatności

### 7.4 Testy E2E (Playwright)

**Nowy:** `apps/frontend/e2e/deposits.spec.ts`
- Pełny cykl życia depozytu (tworzenie → wpłata → weryfikacja)
- Edycja kwoty depozytu
- Filtrowanie depozytów po statusie
- Weryfikacja że anulowanie rezerwacji anuluje depozyt

---

## Moduł 8: Raporty i Statystyki

### 8.1 Testy jednostkowe backendu

**Pliki testów:**

| Serwis | Scenariusze |
|---|---|
| `reports.service.ts` | Generowanie raportów, agregacja danych wg okresów |
| `reports-export.service.ts` | Eksport do Excel (XLSX), eksport do PDF, formatowanie danych |
| `stats.service.ts` | Obliczanie: liczba rezerwacji, przychody, popularne sale, średni czas |

### 8.2 Testy integracyjne backendu

**Plik:** `apps/backend/src/tests/integration/reports.api.test.ts`

- `GET /api/reports` — raporty z różnymi zakresami dat
- `GET /api/reports?type=revenue` — raport przychodów
- `GET /api/reports?type=occupancy` — raport zajętości sal
- `GET /api/reports/export?format=xlsx` — eksport Excel (weryfikacja content-type)
- `GET /api/reports/export?format=pdf` — eksport PDF
- `GET /api/stats` — dashboard statystyk
- Test poprawności obliczeń na znanych danych testowych

### 8.3 Testy E2E (Playwright)

**Nowy:** `apps/frontend/e2e/reports.spec.ts`
- Generowanie raportu za wybrany okres
- Zmiana typu raportu
- Pobranie eksportu Excel
- Pobranie eksportu PDF
- Weryfikacja dashboardu statystyk

---

## Moduł 9: Audit Log

### 9.1 Testy jednostkowe backendu

**Plik:** `apps/backend/src/tests/unit/services/audit-log.service.test.ts`

- Rejestrowanie operacji CRUD (create, update, delete)
- Zapisywanie danych przed i po zmianie (diff)
- Filtrowanie logów po użytkowniku, typie, dacie
- Paginacja logów

### 9.2 Testy integracyjne backendu

**Plik:** `apps/backend/src/tests/integration/audit-log.api.test.ts`

- Weryfikacja że CRUD na rezerwacjach tworzy wpisy w audit log
- Weryfikacja że CRUD na klientach tworzy wpisy
- `GET /api/audit-log` — filtrowanie po użytkowniku
- `GET /api/audit-log` — filtrowanie po typie operacji
- `GET /api/audit-log` — filtrowanie po zakresie dat

### 9.3 Testy E2E (Playwright)

**Istniejący:** `apps/frontend/e2e/history.spec.ts` — rozszerzyć o:
- Weryfikacja kompletności logów po operacji CRUD
- Filtrowanie historii zmian
- Szczegóły zmiany (diff view)

---

## Moduł 10: Załączniki i PDF

### 10.1 Testy jednostkowe backendu

**Pliki testów:**

| Serwis | Scenariusze |
|---|---|
| `attachment.service.ts` | Upload plików, download, usuwanie, walidacja rozmiaru/typu |
| `pdf.service.ts` (~35KB) | Generowanie PDF rezerwacji, polskie znaki, formatowanie, tabele |
| `email.service.ts` | Wysyłanie maili, szablony, załączniki, obsługa błędów SMTP |

### 10.2 Testy integracyjne backendu

**Plik:** `apps/backend/src/tests/integration/attachments.api.test.ts`

- Upload pliku (multipart/form-data)
- Download pliku
- Usunięcie pliku
- Upload zbyt dużego pliku → 413
- Upload niedozwolonego typu → 400

**Plik:** `apps/backend/src/tests/integration/pdf.api.test.ts`

- Generowanie PDF z poprawnymi danymi (w tym polskie znaki: ą, ę, ś, ć, ź, ż, ó, ł, ń)
- PDF z menu
- PDF bez menu
- PDF z wieloma kursami

### 10.3 Testy E2E (Playwright)

**Istniejący:** `apps/frontend/e2e/pdf-generation.spec.ts` — rozszerzyć o:
- Generowanie PDF dla różnych typów rezerwacji
- Weryfikacja pobrania pliku
- PDF z polskimi znakami (edge case)

---

## Moduł 11: Typy Wydarzeń

### 11.1 Testy jednostkowe backendu

**Plik:** `apps/backend/src/tests/unit/services/eventType.service.test.ts`

- CRUD typów wydarzeń (wesele, komunia, chrzciny, konferencja itp.)
- Walidacja unikalności nazwy
- Pobieranie typów z liczbą powiązanych rezerwacji

### 11.2 Testy integracyjne

**Plik:** `apps/backend/src/tests/integration/event-types.api.test.ts`

- CRUD API
- Usunięcie typu z powiązanymi rezerwacjami → 409

### 11.3 Testy komponentów frontendowych

**Katalog:** `apps/frontend/__tests__/components/event-types/`

- Lista typów wydarzeń
- Formularz dodawania/edycji
- Selektor typu w formularzu rezerwacji

---

## Strategia wdrożenia testów

### Faza 1 — Fundamenty (Tydzień 1-2)

1. **Konfiguracja środowiska testowego:**
   - Backend: `jest.config.ts` + `jest.setup.ts` z Supertest
   - Frontend: `jest.config.ts` + React Testing Library setup
   - E2E: rozszerzenie istniejącego `playwright.config.ts`
2. **Testowa baza danych:**
   - Osobny kontener Docker PostgreSQL dla testów
   - Skrypt seedowania danych testowych (`db-seed.ts`)
   - Automatyczne czyszczenie między testami (truncate)
3. **CI/CD Pipeline (GitHub Actions):**
   - Job 1: Lint + Type check
   - Job 2: Testy jednostkowe backend
   - Job 3: Testy integracyjne backend (z PostgreSQL service)
   - Job 4: Testy komponentów frontend
   - Job 5: Testy E2E (z pełnym stackiem w Docker)
   - Raport pokrycia kodu → komentarz w PR

### Faza 2 — Testy krytyczne (Tydzień 3-4)

1. **Testy jednostkowe serwisów:**
   - `reservation.service.test.ts` ⭐ (priorytet najwyższy)
   - `queue.service.test.ts` ⭐
   - `auth.service.test.ts` ⭐
   - `deposit.service.test.ts` ⭐
2. **Testy integracyjne API:**
   - `reservations.api.test.ts`
   - `queue.api.test.ts`
   - `auth.api.test.ts`
3. **Rozszerzenie istniejących E2E:**
   - `reservations-crud.spec.ts` + edge cases
   - `queue-basic.spec.ts` + edge cases
   - `auth.spec.ts` + role-based tests

### Faza 3 — Pokrycie pełne (Tydzień 5-6)

1. **Testy pozostałych serwisów:**
   - Menu (menu, menuCourse, menuSnapshot, dish, packageCategory, addonGroup, discount)
   - Raporty (reports, reports-export, stats)
   - Infrastruktura (hall, client, eventType, attachment, pdf, email, audit-log)
2. **Testy komponentów frontendowych (React Testing Library):**
   - Wszystkie katalogi w `components/`
   - Testy hooków w `hooks/`
3. **Nowe scenariusze E2E:**
   - `menu-templates.spec.ts`
   - `menu-calculator.spec.ts`
   - `deposits.spec.ts`
   - `halls-management.spec.ts`
   - `reports.spec.ts`
   - `permissions.spec.ts`
   - `reservations-filters.spec.ts`

### Faza 4 — Regresja i stabilność (Tydzień 7-8)

1. **Rozszerzenie testów regresji:**
   - `bugfix-regression.spec.ts` — dodać testy dla WSZYSTKICH znanych bugów
   - Testy race conditions (`concurrent.spec.ts`)
2. **Testy wydajnościowe:**
   - Czas odpowiedzi API pod obciążeniem
   - Renderowanie dużych list (100+ rezerwacji)
3. **Testy dostępności (a11y):**
   - Nawigacja klawiaturą
   - Screen reader compatibility
   - Kontrast kolorów
4. **Metryki:**
   - Cel pokrycia kodu: **>80%** (backend), **>70%** (frontend)
   - Wszystkie znane bugi pokryte testami regresji
   - Czas wykonania pełnego suite'a E2E: **<15 minut**

---

## Struktura plików testów

```
apps/backend/src/tests/
├── unit/
│   ├── services/
│   │   ├── reservation.service.test.ts
│   │   ├── reservation-menu.service.test.ts
│   │   ├── queue.service.test.ts
│   │   ├── auth.service.test.ts
│   │   ├── deposit.service.test.ts
│   │   ├── deposit-reminder.service.test.ts
│   │   ├── menu.service.test.ts
│   │   ├── menuCourse.service.test.ts
│   │   ├── menuSnapshot.service.test.ts
│   │   ├── dish.service.test.ts
│   │   ├── packageCategory.service.test.ts
│   │   ├── addonGroup.service.test.ts
│   │   ├── discount.service.test.ts
│   │   ├── client.service.test.ts
│   │   ├── hall.service.test.ts
│   │   ├── eventType.service.test.ts
│   │   ├── reports.service.test.ts
│   │   ├── reports-export.service.test.ts
│   │   ├── stats.service.test.ts
│   │   ├── pdf.service.test.ts
│   │   ├── email.service.test.ts
│   │   ├── attachment.service.test.ts
│   │   ├── audit-log.service.test.ts
│   │   ├── roles.service.test.ts
│   │   ├── permissions.service.test.ts
│   │   ├── users.service.test.ts
│   │   └── company-settings.service.test.ts
│   ├── controllers/
│   │   ├── reservation.controller.test.ts
│   │   ├── queue.controller.test.ts
│   │   ├── auth.controller.test.ts
│   │   ├── menu-calculator.controller.test.ts
│   │   └── ... (po 1 na kontroler)
│   ├── middlewares/
│   │   ├── auth.middleware.test.ts
│   │   ├── permissions.middleware.test.ts
│   │   └── error-handler.middleware.test.ts
│   └── validation/
│       ├── reservation.validation.test.ts
│       ├── client.validation.test.ts
│       └── ...
├── integration/
│   ├── reservations.api.test.ts
│   ├── queue.api.test.ts
│   ├── auth.api.test.ts
│   ├── menu.api.test.ts
│   ├── clients.api.test.ts
│   ├── deposits.api.test.ts
│   ├── halls.api.test.ts
│   ├── event-types.api.test.ts
│   ├── reports.api.test.ts
│   ├── attachments.api.test.ts
│   ├── pdf.api.test.ts
│   ├── audit-log.api.test.ts
│   ├── roles.api.test.ts
│   └── users.api.test.ts
├── helpers/
│   ├── setup.ts              # Global setup (DB connection, env)
│   ├── teardown.ts           # Global teardown (cleanup)
│   ├── db-seed.ts            # Dane testowe
│   ├── test-utils.ts         # Helpery (createTestUser, createTestReservation, etc.)
│   └── mock-factories.ts     # Factory functions dla mocków
└── jest.config.ts

apps/frontend/
├── __tests__/
│   ├── components/
│   │   ├── reservations/
│   │   │   ├── ReservationForm.test.tsx
│   │   │   ├── ReservationList.test.tsx
│   │   │   ├── ReservationCalendar.test.tsx
│   │   │   └── ReservationStatus.test.tsx
│   │   ├── queue/
│   │   │   ├── QueueList.test.tsx
│   │   │   ├── QueueDragDrop.test.tsx
│   │   │   └── QueuePromotion.test.tsx
│   │   ├── menu/
│   │   │   ├── MenuConfigurator.test.tsx
│   │   │   ├── MenuCalculator.test.tsx
│   │   │   └── CourseList.test.tsx
│   │   ├── clients/
│   │   │   ├── ClientForm.test.tsx
│   │   │   ├── ClientList.test.tsx
│   │   │   └── ClientAutocomplete.test.tsx
│   │   ├── deposits/
│   │   │   ├── DepositForm.test.tsx
│   │   │   └── DepositList.test.tsx
│   │   ├── halls/
│   │   │   ├── HallForm.test.tsx
│   │   │   └── HallAvailability.test.tsx
│   │   ├── settings/
│   │   │   ├── RolesManager.test.tsx
│   │   │   └── UsersManager.test.tsx
│   │   ├── shared/
│   │   │   ├── DataTable.test.tsx
│   │   │   ├── ConfirmDialog.test.tsx
│   │   │   └── DatePicker.test.tsx
│   │   └── layout/
│   │       ├── Sidebar.test.tsx
│   │       └── Header.test.tsx
│   ├── hooks/
│   │   ├── useReservations.test.ts
│   │   ├── useQueue.test.ts
│   │   ├── useAuth.test.ts
│   │   └── useDebounce.test.ts
│   └── lib/
│       ├── api-client.test.ts
│       └── utils.test.ts
├── e2e/
│   ├── auth.spec.ts                  ✅ istnieje — rozszerzyć
│   ├── clients.spec.ts               ✅ istnieje — rozszerzyć
│   ├── reservations-crud.spec.ts     ✅ istnieje — rozszerzyć
│   ├── queue-basic.spec.ts           ✅ istnieje — rozszerzyć
│   ├── queue-drag-drop.spec.ts       ✅ istnieje — rozszerzyć
│   ├── queue-promotion.spec.ts       ✅ istnieje — rozszerzyć
│   ├── smoke.spec.ts                 ✅ istnieje
│   ├── validations.spec.ts           ✅ istnieje — rozszerzyć
│   ├── bugfix-regression.spec.ts     ✅ istnieje — rozszerzyć
│   ├── concurrent.spec.ts            ✅ istnieje — rozszerzyć
│   ├── history.spec.ts               ✅ istnieje — rozszerzyć
│   ├── pdf-generation.spec.ts        ✅ istnieje — rozszerzyć
│   ├── menu-templates.spec.ts        🆕 nowy
│   ├── menu-calculator.spec.ts       🆕 nowy
│   ├── menu-assignment.spec.ts       🆕 nowy
│   ├── deposits.spec.ts              🆕 nowy
│   ├── halls-management.spec.ts      🆕 nowy
│   ├── reports.spec.ts               🆕 nowy
│   ├── permissions.spec.ts           🆕 nowy
│   ├── reservations-filters.spec.ts  🆕 nowy
│   └── queue-edge-cases.spec.ts      🆕 nowy
│   ├── fixtures/                     ✅ istnieje — rozszerzyć
│   └── specs/                        ✅ istnieje
└── jest.config.ts                    🆕 nowy (konfiguracja React Testing Library)
```

---

## Znane bugi do pokrycia testami regresji

Na podstawie plików dokumentacji w repozytorium:

| Bug | Plik dokumentacji | Moduł | Priorytet |
|---|---|---|---|
| Race conditions | `BUG5_RACE_CONDITIONS.md` | Rezerwacje | 🔴 Krytyczny |
| Walidacja pozycji | `BUG8_POSITION_VALIDATION.md` | Kolejka | 🟡 Wysoki |
| Nullable w kolejce | `BUG9_QUEUE_NULLABLE.md` | Kolejka | 🟡 Wysoki |
| Batch update race | `BUG9_BATCH_UPDATE_RACE_CONDITION.md` | Kolejka | 🔴 Krytyczny |

Każdy z tych bugów powinien mieć dedykowany test w `bugfix-regression.spec.ts` aby zapobiec regresji.

---

## Metryki sukcesu

- [ ] Pokrycie kodu backend: **>80%**
- [ ] Pokrycie kodu frontend (komponenty): **>70%**
- [ ] Wszystkie znane bugi pokryte testami regresji
- [ ] Czas pełnego suite'a E2E: **<15 minut**
- [ ] Zero flaky testów (stabilność >99%)
- [ ] CI/CD pipeline działa na każdym PR
