# 📝 Changelog

## [1.4.4] - 2026-02-15

### 🐛 Bugfixy
- **Fix kodowania UTF-8 w szczegółach rezerwacji** — plik `reservations/[id]/page.tsx` zawierał ~12 Unicode escape sequences. Zamienione na poprawne znaki UTF-8:
  - `Powr\u00f3t do listy` → Powrót do listy
  - `Szczeg\u00f3\u0142y rezerwacji` → Szczegóły rezerwacji
  - `Imi\u0119 i nazwisko` → Imię i nazwisko
  - `B\u0142\u0105d` → Błąd
  - `Za\u0142\u0105czniki rezerwacji` → Załączniki rezerwacji
  - `Anuluj rezerwacj\u0119` → Anuluj rezerwację
  - i inne (został, udało się, pobrać, załadować, anulować, powód)
- **Fix API Error 500: `/api/attachments`** — `attachment.routes.ts` wywoływał `attachmentController.list()`, ale kontroler eksportuje tę metodę jako `getByEntity()`. Zmieniono wywołanie na `.getByEntity()`
  - Eliminacja błędu: `import_attachment.default.list is not a function`
  - Załączniki na stronie szczegółów rezerwacji teraz ładują się poprawnie

### 📦 Zmienione pliki
- `apps/frontend/app/dashboard/reservations/[id]/page.tsx` — 12 zamian encoding
- `apps/backend/src/routes/attachment.routes.ts` — fix nazwy metody `.list()` → `.getByEntity()`

### 🚀 Deployment
Komenda wdrożenia:
```bash
cd /home/kamil/rezerwacje && git pull origin main && docker compose restart backend frontend
```

---

## [1.4.3] - 2026-02-15

### 🚀 Ulepszenia
- **Frontend w trybie produkcyjnym** — kontener przeszedł z `npm run dev` (dev server z hot reload) na `npm run build && npm run start` (zbudowana, zoptymalizowana wersja)
  - Strony ładują się 2-5x szybciej (pre-rendered HTML, statyczna optymalizacja)
  - Niższe zużycie CPU/RAM (brak file watchera i kompilacji on-demand)
  - Poprawny SSR + static generation
  - `NODE_ENV` frontend domyślnie `production` (wcześniej `development`)
- **Backend pozostaje w trybie dev** — `npm run dev` z hot reload (zmiana na produkcję planowana osobno)

### 📦 Zmienione pliki
- `docker-compose.yml` — frontend: `command: npm run dev` → `command: sh -c "npm run build && npm run start"`, `NODE_ENV: development` → `production`

### ⚠️ Uwaga
- Każdy restart kontenera frontend (`docker compose restart frontend`) teraz zawiera krok budowania (~30-60s)
- Po `git pull` wystarczy: `docker compose restart frontend` (build wykona się automatycznie)
- Nie trzeba już ręcznie wywoływać `docker compose exec frontend npm run build`

### 🚀 Deployment
Komenda wdrożenia:
```bash
cd /home/kamil/rezerwacje && git pull origin main && docker compose restart frontend
```

---

## [1.4.2] - 2026-02-15

### 🐛 Bugfixy
- **Fix kodowania UTF-8 w formularzu rezerwacji** — plik `create-reservation-form.tsx` zawierał ~100+ Unicode escape sequences (`\uXXXX`) zamiast poprawnych polskich znaków. Wszystkie zamienione na bezpośrednie znaki UTF-8.
  - `\u0105` → ą (np. "Wyszukaj istniejącego klienta")
  - `\u0119` → ę (np. "Wybierz salę")
  - `\u015b` → ś (np. "Goście", "Dorośli")
  - `\u0142` → ł (np. "dorosłego", "całkowita")
  - `\u0144` → ń (np. "Zakończenie")
  - `\u00f3` → ó (np. "Utwórz")
  - `\u0107` → ć (np. "dostępność")
  - `\u0141` → Ł (np. "Łącznie")
  - `\u017c` → ż (np. "każdej")
  - `\u2014` → — (em dash), `\u00d7` → × (multiplication), `\u2013` → – (en dash)
  - `\u2022` → • (bullet), `\u2550` → ═ (box drawing), `\ud83d\udca1` → 💡 (emoji)

### 📦 Zmienione pliki
- `apps/frontend/components/reservations/create-reservation-form.tsx` — zamiana ~100+ escape sequences na UTF-8

### 🔍 Przeskanowane pliki (OK — bez problemów)
- `ReservationFinancialSummary.tsx` ✅
- `editable/EditableEventCard.tsx` ✅
- `editable/EditableCard.tsx` ✅
- `editable/EditableGuestsCard.tsx` ✅
- `editable/EditableHallCard.tsx` ✅
- `editable/EditableNotesCard.tsx` ✅
- `editable/StatusChanger.tsx` ✅
- `reservations-list.tsx` ✅

### 🚀 Deployment
Komenda wdrożenia:
```bash
cd /home/kamil/rezerwacje && git pull origin main && docker compose exec frontend npm run build && docker compose restart frontend
```

---

## [1.4.1] - 2026-02-15

### 🐛 Bugfixy
- **Fix build error: brakujący moduł `./client` w `menu-selection.ts`** — plik importował `api` z nieistniejącego `./client`. Zmieniono na `import { apiClient } from '@/lib/api-client'` oraz zaktualizowano wszystkie wywołania `api.get/post/put/delete` → `apiClient.get/post/put/delete` (spójne z resztą API w `lib/api/`)
- **Fix crash buildu: `useContext` null na wszystkich stronach (29/29)** — `NODE_ENV` w kontenerze Docker był ustawiony na `development` (default z `docker-compose.yml`), co powodowało ładowanie dwóch instancji React (prod + dev runtime) jednocześnie. Hooki React (`useContext`, `useState`) wymagają singletonu React — dwa bundla = `null` w kontekście. Naprawiono przez wymuszenie `NODE_ENV=production` w skrypcie build w `package.json`
- **Fix prerender error: `<Html>` import z `pages/_document`** — Next.js próbował generować fallbackowe strony `/404` i `/500` przez Pages Router (auto-generated `_error`), który importował `<Html>` z `next/document`. Dodano `app/not-found.tsx` z custom stroną 404 dla App Router, eliminując potrzebę Pages Router fallbacku

### 📦 Zmienione pliki
- `apps/frontend/lib/api/menu-selection.ts` — poprawiony import (z `./client` na `@/lib/api-client`)
- `apps/frontend/package.json` — build script: `next build` → `NODE_ENV=production next build`
- `apps/frontend/app/not-found.tsx` — **nowy plik** — custom strona 404 (App Router)

### 🚀 Deployment
Komenda wdrożenia:
```bash
cd /home/kamil/rezerwacje && git pull origin main && docker compose exec frontend npm run build && docker compose restart frontend
```

### ⚠️ Uwaga
- Kontener frontend nadal serwuje przez `npm run dev` — dla lepszej wydajności na produkcji zalecana zmiana komendy w `docker-compose.yml` na `npm run start` (serwowanie zbudowanej wersji)
- Ostrzeżenie "Disabling SWC Minifier" jest informacyjne — zostanie usunięte w Next.js 15

---

## [1.4.0] - 2026-02-14

### ✨ Nowe funkcjonalności
- **Redesign formularza rezerwacji — 6-krokowy Wizard UI** (PR #49)
  - Kompletna przebudowa z płaskiego formularza na interaktywny wizard z premium UI
  - **Nowe komponenty:** Stepper (desktop + mobile), Combobox (z wyszukiwarką), DatePicker, TimePicker
  - **Krok 1 — Wydarzenie:** Typ + pola kontekstowe (urodziny → wiek, rocznica → rok + okazja, inne → custom)
  - **Krok 2 — Sala i termin:** Select + DatePicker + TimePicker + auto-check dostępności + info o extra hours
  - **Krok 3 — Goście:** Karty z inputami dla dorosłych, dzieci 4–12, maluchów 0–3 + capacity warning
  - **Krok 4 — Menu i ceny:** 🆕 Flow: Szablon → Pakiet → Ceny (lub ręczne ustalanie)
  - **Krok 5 — Klient:** Combobox z wyszukiwarką + modal tworzenia nowego klienta
  - **Krok 6 — Podsumowanie:** Kolorowe karty klikalne, price breakdown z extra hours, notatki
  - Flow Szablon → Pakiet: `useMenuTemplates` filtrowany po `eventTypeId` + `usePackagesByTemplate`
  - Auto-kasowanie pakietu przy zmianie szablonu / szablonu przy zmianie event type
  - Breadcrumb `Szablon → Pakiet → Ceny` w kroku Menu
  - Dodany `menuTemplateId` do Zod schema + submit payload

### 🐛 Bugfixy
- **Fix Command (Combobox) — transparentne tło:** `bg-popover` → `bg-white text-secondary-900` w `command.tsx`
- **Fix Extra Hours w Financial Summary:** nowe propsy `startDateTime`/`endDateTime`, obliczanie dodatkowych godzin (>6h = dopłata 500 PLN/h), nowa sekcja UI z ikoną Timer, `effectiveTotalPrice`
- **Fix propsy datetime na stronie szczegółów rezerwacji:** przekazanie `startDateTime`/`endDateTime` do `ReservationFinancialSummary`

### 📊 Statystyki PR #49
- **+1894 / -758 linii** | 12 plików zmienionych | 10 commitów
- Branch: `feature/reservation-form-redesign`

---

## [1.3.0] - 2026-02-14

### ✨ Nowe funkcjonalności
- **Karta Menu PDF** — generowanie profesjonalnej karty menu jako PDF z pełnymi danymi dań
  - `GET /api/menu-templates/:id/pdf` — endpoint generujący PDF (wymaga Staff access)
  - PDFKit z fontami DejaVu dla pełnej obsługi polskich znaków (ą, ę, ś, ź, ż, ó, ł, ń, ć)
  - Automatyczne pobieranie dań przez PackageCategorySettings → DishCategory → Dish
  - Dane restauracji z env vars (`RESTAURANT_NAME`, `RESTAURANT_ADDRESS`, etc.)
  - Przycisk pobierania PDF na karcie szablonu w dashboardzie (ikona 🖨️) z loading state
  - Rozmiar wygenerowanego PDF: ~55KB z 3 pakietami i 19 kategoriami dań

### 🐛 Bugfixy
- **Fix import `menu-packages`** — strona pakietów importowała z `@/lib/api/menu-packages` (plik używał nieistniejącego `./client`). Zmieniono na `@/lib/api/menu-packages-api` z prawidłowymi funkcjami `getAllActivePackages()` / `getPackagesByTemplate()`
- **Fix wyświetlania typu wydarzenia przy edycji szablonu** — `MenuTemplateDialog` nie pokazywał nazwy typu wydarzenia w trybie edycji (race condition: `reset()` ustawiał `eventTypeId` przed załadowaniem `eventTypes`). Naprawiono przez: dodanie `eventTypes` do deps `useEffect` + zamianę disabled `Select` na disabled `Input` z bezpośrednim wyświetlaniem nazwy

### 🧹 Cleanup
- Usunięto martwy plik `apps/frontend/lib/api/menu-packages.ts` (zastąpiony przez `menu-packages-api.ts`)

---

## [1.2.0] - 2026-02-14

### ✨ Nowe funkcjonalności
- **Detekcja konfliktu "Cała Sala"** — przy rezerwacji z flagą `isWholeVenue` system sprawdza, czy wybrana sala nie ma już zarezerwowanej w tym terminie innej rezerwacji (i odwrotnie: nie pozwala rezerwować pojedynczej sali, jeśli jest rezerwacja na "Całą Salę")

### 🐛 Bugfixy
- **Sanityzacja null bytes** — dodana funkcja `sanitizeString()` w backend, która usuwa znaki `\x00` z pól tekstowych przed zapisem do PostgreSQL (zapobieganie `invalid byte sequence for encoding "UTF8": 0x00`)
- **Fix "User not found" przy tworzeniu rezerwacji** — `validateUserId()` rzuca teraz `AppError(401)` z czytelnym polskim komunikatem zamiast generycznego `Error` trafiającego w 404 bridge pattern
- **Fix nachodzących powiadomień (toasts)** — jeden `<Toaster/>` z pełną konfiguracją sonner (`expand`, `gap={8}`, `visibleToasts={5}`, `closeButton`, `offset={16}`, `zIndex: 99999`); usunięty duplikat surowego `<Toaster/>` z layout.tsx

### 🛠️ Ulepszenia
- Import `Toaster` w `layout.tsx` zmieniony z `sonner` na `@/components/ui/toaster` — single source of truth dla konfiguracji toastów

---

## [1.1.0] - 2026-02-14

### 🔒 Bezpieczeństwo
- **Auth middleware na endpointach menu** — wszystkie 45+ endpointów zabezpieczonych
  - GET endpointy → `authMiddleware` + `requireStaff` (ADMIN + EMPLOYEE)
  - POST/PUT/DELETE → `authMiddleware` + `requireAdmin`
  - Dish categories GET → publiczne (potrzebne do UI)
  - Dish categories POST/PUT/DELETE → `requireAdmin` (wcześniej brak kontroli roli)
  - Menu calculator → `authMiddleware` + `requireStaff`

### 🐛 Bugfixy
- **Fix route ordering bug:** `PUT /api/menu-packages/reorder` przeniesione PRZED `PUT /api/menu-packages/:id` — wcześniej Express matchował `:id="reorder"` i endpoint nigdy nie działał

### 🛠️ Ulepszenia
- Dodano `asyncHandler` wrapper na wszystkie endpointy menu (spójne error handling)
- Dodano `validateUUID` na wszystkie parametry UUID w menu routes
- Ujednolicony pattern: controller wywołania przez `.call()` zamiast `.bind()`

---

## [1.0.0] - 2026-02-14

### 📚 Dokumentacja
- Pełna aktualizacja CURRENT_STATUS.md — odzwierciedla rzeczywisty stan projektu
- API.md v2.0.0 — ~68 endpointów (dodano Menu System, Deposits)
- Dodano referencję do README_MENU_API.md z pełnymi przykładami
- Wersja projektu: 0.9.8 → 1.0.0

### ✅ Zweryfikowane moduły (już zaimplementowane, nieudokumentowane wcześniej)
- **Szablony Menu (MenuTemplate)** — CRUD + duplicate + active-by-event-type, warianty, validFrom/To
- **Pakiety Menu (MenuPackage)** — CRUD + reorder + assign-options, ceny per adult/child/toddler
- **Opcje Menu (MenuOption)** — CRUD, kategorie, priceType: PER_PERSON/FLAT
- **Grupy Dodatków (AddonGroup + AddonGroupDish)** — CRUD, min/maxSelect
- **Ustawienia Kategorii (PackageCategorySettings)** — minSelect/maxSelect per kategoria
- **Integracja Menu+Rezerwacje (ReservationMenuSnapshot)** — select/get/update/remove menu, kalkulator cen
- **Historia Cen (MenuPriceHistory)** — automatyczne śledzenie zmian
- **System Zaliczek (Deposit + DepositPayment)** — CRUD + partial payments

---

## [0.9.8] - 2026-02-14

### ✨ Nowe funkcjonalności
- **Moduł Typy Wydarzeń** — pełny frontend CRUD
  - Lista typów z hero, statystykami, wyszukiwaniem, filtrowaniem
  - Strona szczegółów z informacjami i powiązaniami
  - Dialog tworzenia/edycji z color picker
  - Dialog usuwania z walidacją powiązań
  - Toggle aktywności inline

### 🎨 UI/UX
- Accent fuchsia/pink dla modułu Typy Wydarzeń
- Design tokens w `lib/design-tokens.ts`

---

## [0.9.7] - 2026-02-11

### ✨ Nowe funkcjonalności
- **System Menu & Dania**
  - Kategorie dań — CRUD API + Frontend UI
  - Biblioteka dań — CRUD, alergeny, filtrowanie
  - Premium UI components (Switch, AlertDialog, DishDialog)

### 🐛 Bugfixy
- Fix infinite loop w DishDialog
- Fix auth w dishes API
- Fix transparentność AlertDialog

---

## [0.9.6] - 2026-02-09

### 🐛 Bugfixy
- Bug #9: Nullable constraints dla queue fields
- Bug #9: Batch update race condition (atomiczne transakcje)

---

## [0.9.5] - 2026-02-07

### 🐛 Bugfixy
- Bug #5: Race conditions — row-level locking
- Bug #6: Loading states
- Bug #7: Auto-cancel logic (tylko przeszłe daty)
- Bug #8: Position validation w kolejce

---

## [0.9.0] - 2026-02-06

### ✨ Nowe funkcjonalności
- System rezerwacji (pełny CRUD)
- System kolejki rezerwacji
- Zarządzanie salami
- Zarządzanie klientami
- Typy wydarzeń (backend)
- JWT Authentication
- Role-Based Access Control
