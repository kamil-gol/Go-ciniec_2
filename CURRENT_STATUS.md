# 📍 Status Projektu - 15.02.2026

## ⚡ Szybki Przegląd

**Branch:** `main`  
**Ostatnia aktualizacja:** 15.02.2026, 13:35 CET  
**Status:** ✅ Stabilny - W aktywnym rozwoju  
**Wersja:** 1.4.4 (Fix encoding + attachments API)

---

## 📦 Co Działa

### 🐛 Reservation Detail Fixes (v1.4.4) 🆕
✅ **Fix kodowania UTF-8 w szczegółach rezerwacji** — zamiana 12 Unicode escape sequences na poprawne polskie znaki w `reservations/[id]/page.tsx`  
✅ **Fix API Error 500 `/api/attachments`** — `attachment.routes.ts` wołał `.list()` zamiast `.getByEntity()` (metoda nie istniała w kontrolerze)  
✅ **Załączniki na stronie rezerwacji** — ładują się poprawnie bez błędów 500  

### 🚀 Production Mode (v1.4.3)
✅ **Frontend w trybie produkcyjnym** — `npm run build && npm run start` zamiast `npm run dev`  
✅ **NODE_ENV=production** — domyślna wartość w docker-compose.yml  
✅ **Szybsze ładowanie stron** — pre-rendered HTML, statyczna optymalizacja  
✅ **Niższe zużycie zasobów** — brak file watchera i kompilacji on-demand  
✅ **Auto-build przy restarcie** — `docker compose restart frontend` automatycznie buduje i serwuje  
⚠️ **Backend pozostaje w trybie dev** — `npm run dev` (zmiana planowana osobno)  

### 🔤 UTF-8 Encoding Fix (v1.4.2)
✅ **Fix kodowania polskich znaków** — zamiana ~100+ Unicode escape sequences (`\uXXXX`) na poprawne znaki UTF-8 w `create-reservation-form.tsx`  
✅ **Skan całego systemu** — pozostałe pliki (8 komponentów) sprawdzone i OK  
✅ **Znaki:** ą, ę, ó, ś, ź, ż, ł, ń, ć + symbole: —, ×, –, •, ═, 💡  

### 🔧 Build Fixes (v1.4.1)
✅ **Fix `menu-selection.ts`** — import `./client` (nieistniejący) → `@/lib/api-client`  
✅ **Fix NODE_ENV dual-bundle** — wymuszenie `NODE_ENV=production` w build script (eliminacja podwójnego React runtime)  
✅ **Fix Pages Router 404** — dodanie `app/not-found.tsx` (App Router custom 404)  
✅ **Build 29/29 stron** — kompilacja, linting, generowanie static pages bez błędów  

### 🧙 Formularz Rezerwacji — 6-krokowy Wizard (v1.4.0)
✅ **Krok 1 — Wydarzenie:** Typ wydarzenia + pola kontekstowe (urodziny/rocznica/inne)  
✅ **Krok 2 — Sala i termin:** Wybór sali + DatePicker + TimePicker + auto-check dostępności  
✅ **Krok 3 — Goście:** Podział na 3 grupy wiekowe z capacity warning  
✅ **Krok 4 — Menu i ceny:** Flow Szablon → Pakiet → Ceny (lub ręczne ustalanie)  
✅ **Krok 5 — Klient:** Combobox z wyszukiwarką + modal tworzenia nowego klienta  
✅ **Krok 6 — Podsumowanie:** Kolorowe karty klikalne, price breakdown, notatki  
✅ **Nowe komponenty:** Stepper (desktop/mobile), Combobox, DatePicker, TimePicker  
✅ **Extra hours:** Automatyczna dopłata 500 PLN/h za godziny ponad 6h w Financial Summary  
✅ **Breadcrumb:** Szablon → Pakiet → Ceny w kroku Menu  
✅ **Auto-clear:** Zmiana szablonu kasuje pakiet, zmiana event type kasuje szablon  
📚 **Dokumentacja:** [docs/RESERVATION_FORM_WIZARD.md](docs/RESERVATION_FORM_WIZARD.md)

### System Rezerwacji & Kolejki
✅ **System kolejki rezerwacji** (status RESERVED)  
✅ **Drag & drop zmiany kolejności** (z loading states)  
✅ **Awansowanie do pełnej rezerwacji**  
✅ **Pola warunkowe** (Urodziny, Rocznica, Inne)  
✅ **Podział gości** na 3 grupy wiekowe  
✅ **Auto-kalkulacja cen**  
✅ **Dodatkowe godziny** z automatyczną notą  
✅ **Row-level locking** (race condition protection)  
✅ **Retry logic** z exponential backoff  
✅ **Auto-cancel** (tylko przeszłe daty)  
✅ **Walidacja pozycji** w kolejce  
✅ **Nullable constraints** dla queue fields  
✅ **Batch update API** (atomiczne transakcje)  
✅ **Detekcja konfliktu "Cała Sala"** — blokada podwójnej rezerwacji gdy isWholeVenue (v1.2.0)  
✅ **Sanityzacja null bytes** — `sanitizeString()` chroni PostgreSQL przed `\x00` (v1.2.0)  
✅ **AppError(401) przy braku użytkownika** — czytelny komunikat zamiast generycznego 404 (v1.2.0)

### 🍽️ System Menu (KOMPLETNY)
✅ **Kategorie Dań** — CRUD API + Frontend UI, sortowanie, ikony emoji + kolory  
✅ **Biblioteka Dań** — CRUD, alergeny, filtrowanie, wyszukiwanie, premium UI  
✅ **Szablony Menu (MenuTemplate)** — CRUD, warianty, validFrom/validTo, duplikowanie, przypisanie do EventType  
✅ **Pakiety Menu (MenuPackage)** — CRUD, ceny per adult/child/toddler, includedItems, reorder, isPopular/isRecommended  
✅ **Opcje Menu (MenuOption)** — CRUD, kategorie (Alkohol, Muzyka itp.), priceType: PER_PERSON/FLAT, przypisanie do pakietów  
✅ **Grupy Dodatków (AddonGroup)** — CRUD, min/maxSelect, priceType, powiązania z daniami  
✅ **Ustawienia Kategorii w Pakietach (PackageCategorySettings)** — minSelect/maxSelect per kategoria  
✅ **Historia Cen (MenuPriceHistory)** — automatyczne śledzenie zmian cen  
✅ **Karta Menu PDF** — generowanie PDF z pełnymi danymi dań (v1.3.0)  
✅ **Premium UI/UX Components** — Switch, AlertDialog, DishDialog, loading states

### 📎 System Załączników (Attachments)
✅ **Upload plików** — multipart/form-data z kategoriami (RODO, Umowa, Faktura, Zdjęcie, Korespondencja, Inne)  
✅ **Panel załączników** — filtrowanie po kategorii, archiwum, cross-reference RODO z klienta  
✅ **Batch check RODO/Contract** — masowe sprawdzanie statusu dokumentów  
✅ **Download/Archive/Delete** — pełny CRUD z soft-delete  
✅ **Backend API** — `GET/POST/PATCH/DELETE /api/attachments` + `/check` + `/batch-check-rodo` + `/batch-check-contract`  

### 🔒 Bezpieczeństwo & Auth (v1.1.0)
✅ **JWT Authentication** — Bearer token, auto-refresh, secure fallback  
✅ **Role-Based Access Control** — ADMIN, EMPLOYEE  
✅ **Auth middleware na WSZYSTKICH endpointach menu** — 45+ endpointów zabezpieczonych  
✅ **Polityka dostępu:**  
- GET (odczyt) → Staff (ADMIN + EMPLOYEE)  
- POST/PUT/DELETE (zapis) → Admin only  
- Dish categories GET → Publiczne  
- Menu calculator → Staff  
✅ **Frontend auto-token** — apiClient dodaje Bearer token automatycznie  
✅ **Error handling** — 401 → redirect login, 403 → toast "Brak uprawnień"

### 🔔 System Powiadomień (v1.2.0)
✅ **Sonner Toaster** — single source of truth w `components/ui/toaster.tsx`  
✅ **Stackowanie toastów** — `expand={true}`, `gap={8}`, `visibleToasts={5}`  
✅ **Przycisk zamknięcia** — `closeButton` na każdym toaście  
✅ **z-index: 99999** — toasty zawsze nad modali/dialogami  
✅ **Rich colors** — automatyczne kolory success/error/warning/info

### 🔗 Integracja Menu z Rezerwacjami
✅ **ReservationMenuSnapshot** — zapis wybranego menu w rezerwacji  
✅ **POST /api/reservations/:id/select-menu** — wybór menu z kalkulacją cen  
✅ **GET /api/reservations/:id/menu** — pobranie snapshotu z price breakdown  
✅ **PUT /api/reservations/:id/menu** — aktualizacja (zmiana liczby gości)  
✅ **DELETE /api/reservations/:id/menu** — usunięcie menu z rezerwacji  
✅ **Kalkulator cen** — packageCost + optionsCost = totalMenuPrice

### 🎭 Typy Wydarzeń
✅ **Backend API** — pełny CRUD + stats endpoint + filtrowanie isActive  
✅ **Nowe pola modelu** — `description`, `color` (hex), `isActive`  
✅ **Frontend** — lista z hero, statystykami, wyszukiwaniem + strona szczegółów  
✅ **Formularze** — dialog tworzenia/edycji z color picker, dialog usuwania z walidacją  
✅ **Design System** — accent fuchsia/pink, design tokens

### 💰 System Zaliczek (Deposits)
✅ **Model Deposit** — amount, remainingAmount, paidAmount, status, paymentMethod  
✅ **DepositPayment** — częściowe płatności  
✅ **Backend API** — CRUD + statusy + potwierdzenia

### 🧪 Testy E2E
✅ **45 testów** (43 pass, 2 skip) w 3 plikach spec  
✅ **Playwright** w Docker (Chromium)  
✅ **Regresja Bug #5-9** — 19 testów  
📚 **Dokumentacja:** [docs/E2E_TESTING_PLAN.md](docs/E2E_TESTING_PLAN.md)

---

## 📁 Struktura Frontend Menu

```
apps/frontend/app/dashboard/menu/
├── page.tsx              # Główna strona Menu (hub)
├── categories/           # Kategorie dań
├── dishes/               # Biblioteka dań
├── courses/              # Dania/kursy
├── templates/            # Szablony menu (page.tsx)
├── packages/             # Pakiety cenowe
├── options/              # Opcje dodatkowe
└── addons/               # Grupy dodatków
```

---

## 📁 Backend Routes

```
apps/backend/src/routes/
├── auth.routes.ts
├── hall.routes.ts
├── client.routes.ts
├── eventType.routes.ts
├── reservation.routes.ts
├── queue.routes.ts
├── deposit.routes.ts
├── reservation-deposit.routes.ts
├── attachment.routes.ts          # Upload/download/archiwum załączników (auth protected)
├── dish-category.routes.ts
├── dish.routes.ts
├── menu.routes.ts              # Templates + Packages + Options (auth protected)
├── menu-calculator.routes.ts   # Kalkulator cen (auth protected)
├── stats.routes.ts             # Statystyki dashboard
└── README_MENU_API.md          # Pełna dokumentacja Menu API
```

---

## 📚 Dokumentacja

| Dokument | Opis |
|----------|------|
| [API.md](API.md) | Dokumentacja API — wszystkie endpointy |
| [apps/backend/src/routes/README_MENU_API.md](apps/backend/src/routes/README_MENU_API.md) | **Szczegółowa dokumentacja Menu API** z przykładami |
| [CHANGELOG.md](CHANGELOG.md) | Historia zmian |
| [docs/README.md](docs/README.md) | Główny indeks dokumentacji |
| [docs/RESERVATION_FORM_WIZARD.md](docs/RESERVATION_FORM_WIZARD.md) | **Dokumentacja 6-krokowego wizarda rezerwacji** |
| [docs/E2E_TESTING_PLAN.md](docs/E2E_TESTING_PLAN.md) | Plan testów E2E (45 testów) |
| [docs/QUEUE.md](docs/QUEUE.md) | Dokumentacja systemu kolejki |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Architektura projektu |
| [docs/DATABASE.md](docs/DATABASE.md) | Struktura bazy danych |
| [docs/SPRINTS.md](docs/SPRINTS.md) | Plan i postęp sprintów |

---

## 🚀 Quick Start - Nowy Wątek

### Użyj tego promptu:

```
Kontynuuję pracę nad projektem "Gościniec" — system rezerwacji (repo: kamil-gol/Go-ciniec_2, branch: main).

## Repo & Infrastruktura
- **GitHub:** kamil-gol/Go-ciniec_2
- **Branch:** main
- **Serwer:** Docker na VPS (cd /home/kamil/rezerwacje)
- **Baza:** PostgreSQL (serwis: postgres, user: rezerwacje, database: rezerwacje)
- **Frontend:** Next.js 14 App Router (port 3000, kontener: rezerwacje-web) — PRODUCTION MODE (build + start)
- **Backend:** Node.js + Express + Prisma (port 3001, kontener: rezerwacje-api) — dev mode
- **Build:** `NODE_ENV=production next build` (wymuszony w package.json + docker-compose)

## Zasady pracy — BEZWZGLĘDNE
1. Masz PEŁNY dostęp do GitHub — czytaj, edytuj, twórz pliki BEZPOŚREDNIO bez pytania o zgodę
2. Wykonuj WSZYSTKIE operacje na GitHubie automatycznie — nie pytaj o zatwierdzenie
3. Twórz nowe branche na nowe funkcjonalności (`feature/nazwa`), potem merguj do main
4. Po zmianach daj mi TYLKO komendy do wykonania na serwerze (git pull + docker restart)
5. NIE każ mi robić rzeczy manualnie — sam organizuj pliki na GitHubie
6. Sprawdzaj istniejący kod PRZED edycją (get_file_contents)
7. Aktualizuj dokumentację (CHANGELOG.md, CURRENT_STATUS.md) po KAŻDEJ zmianie
8. Polskie znaki pisz bezpośrednio (ą, ę, ó, ś, ź, ż, ł, ń, ć)

## Workflow
```bash
# Sprawdzanie kodu:
mcp_tool_github_mcp_direct_get_file_contents → repo: kamil-gol/Go-ciniec_2

# Edycja plików:
mcp_tool_github_mcp_direct_create_or_update_file → zapisuje bezpośrednio do repo
mcp_tool_github_mcp_direct_push_files → wiele plików w jednym commit

# Po zmianach DAJ MI komendy:
cd /home/kamil/rezerwacje && git pull origin main
docker compose restart frontend  # auto-build + serve (~30-60s)
docker compose restart backend   # jeśli zmiany backend
docker compose logs -f frontend --tail=50  # sprawdź logi
```

## Przeczytaj na start:
1. CURRENT_STATUS.md — pełny status + TODO + struktura
2. CHANGELOG.md — historia zmian (najnowsza wersja: 1.4.4)
3. apps/backend/prisma/schema.prisma — modele bazy danych
4. docker-compose.yml — konfiguracja kontenerów

## Co jest gotowe (v1.4.4):
- ✅ Frontend w PRODUCTION MODE (build + start, NODE_ENV=production)
- ✅ Rezerwacje + kolejka + drag&drop + auto-cancel + row-level locking
- ✅ Formularz rezerwacji — 6-krokowy Wizard UI (Stepper, Combobox, DatePicker, TimePicker)
- ✅ Flow: Szablon → Pakiet → Ceny w formularzu rezerwacji
- ✅ Extra hours — dopłata 500 PLN/h za >6h w Financial Summary
- ✅ Sale, Klienci, Typy Wydarzeń (pełny CRUD)
- ✅ System Menu kompletny (Kategorie, Dania, Szablony, Pakiety, Opcje, Dodatki)
- ✅ Integracja Menu z Rezerwacjami (snapshot + kalkulator cen)
- ✅ Karta Menu PDF (generowanie + pobieranie)
- ✅ System zaliczek (Deposits + partial payments)
- ✅ System załączników (upload, kategorie, RODO cross-ref, batch check)
- ✅ Auth middleware na WSZYSTKICH endpointach (JWT + RBAC)
- ✅ Detekcja konfliktu "Cała Sala" (isWholeVenue)
- ✅ Build 29/29 stron bez błędów (NODE_ENV=production)
- ✅ Testy E2E — 45 testów (43 pass, 2 skip)
- ✅ UTF-8 encoding — polskie znaki poprawione w formularzu + szczegółach rezerwacji

## Znane uwagi:
- ⚠️ Backend kontener nadal w dev mode (`npm run dev`) — zmiana planowana osobno
- ⚠️ SWC Minifier warning — informacyjne, zniknie w Next.js 15
- ⚠️ Każdy restart frontend = rebuild ~30-60s (trade-off za production mode)

## Co wymaga dalszej pracy:
- 🔄 Backend production mode (kompilacja TS + npm run start)
- 🔄 Testy jednostkowe systemu menu
- 🔄 Import/Export menu (CSV/JSON)

Zacznij od przeczytania CURRENT_STATUS.md, potem zaproponuj plan dalszych działań.
```

---

## 🐞 Znane Problemy

**Brak krytycznych bugów** 🎉

### ⚠️ Uwagi
- Backend kontener nadal w dev mode (`npm run dev`) — zmiana na production planowana osobno
- Ostrzeżenie "Disabling SWC Minifier" jest informacyjne — zostanie usunięte w Next.js 15
- Każdy restart frontend = rebuild ~30-60s (trade-off za production performance)

---

## 📋 TODO

### 🔄 Planowane
- [ ] Backend production mode (kompilacja TS → JS + `npm run start`)
- [ ] Testy jednostkowe systemu menu
- [ ] Import/Export menu (CSV/JSON)
- [ ] Sezonowość dań
- [ ] Zdjęcia dań (upload + gallery)
- [ ] Statystyki popularności dań
- [ ] Multi-language menu (PL/EN)

---

## 📊 Postęp Ogólny

- **Backend:** 99% ✅
- **Frontend:** 99% ✅ (production mode ✅)
- **Bezpieczeństwo:** 95% ✅ (auth na wszystkich endpointach)
- **Testy:** 80% 🔄 (E2E: 45 testów pass)
- **Dokumentacja:** 99% ✅ (zaktualizowana 15.02, 13:35)
- **Deployment:** 85% 🔄 (frontend: production ✅, backend: dev 🔄)

### Postęp Modułów:
- **Sale (Halls):** 100% ✅
- **Klienci:** 100% ✅
- **Rezerwacje + Kolejka:** 100% ✅
- **Formularz Rezerwacji (Wizard):** 100% ✅ (v1.4.0)
- **Typy Wydarzeń:** 100% ✅
- **Kategorie Dań:** 100% ✅
- **Biblioteka Dań:** 100% ✅
- **Szablony Menu:** 100% ✅
- **Pakiety Menu:** 100% ✅
- **Opcje Menu:** 100% ✅
- **Grupy Dodatków:** 100% ✅
- **Integracja Menu+Rezerwacje:** 100% ✅
- **System Zaliczek:** 100% ✅
- **Historia Cen:** 100% ✅
- **System Załączników:** 100% ✅ (v1.4.4) 🆕
- **Auth Middleware:** 100% ✅ (v1.1.0)
- **Whole-Venue Conflict:** 100% ✅ (v1.2.0)
- **Toast Stacking:** 100% ✅ (v1.2.0)
- **Karta Menu PDF:** 100% ✅ (v1.3.0)
- **Build Fixes:** 100% ✅ (v1.4.1)
- **UTF-8 Encoding Fix:** 100% ✅ (v1.4.2 + v1.4.4)
- **Production Mode:** 100% ✅ (v1.4.3)
- **Testy E2E:** 100% ✅ (45 testów)

---

## 🔧 Komendy Docker

```bash
# Pobranie zmian
cd /home/kamil/rezerwacje
git checkout main
git pull origin main

# Restart frontend (auto-build + serve, ~30-60s)
docker compose restart frontend

# Restart backend
docker compose restart backend

# Restart obu
docker compose restart backend frontend

# Rebuild (jeśli zmiany w package.json lub Dockerfile)
docker compose down
docker compose up --build -d

# Pełny rebuild bez cache
docker compose down
docker compose build --no-cache frontend
docker compose up -d

# Logi
docker compose logs -f frontend --tail=50
docker compose logs -f backend --tail=50

# Migracje
docker compose exec backend npm run prisma:migrate:deploy

# Baza danych
docker compose exec postgres psql -U rezerwacje -d rezerwacje
```

---

## 🗄️ Modele Bazy Danych (Prisma)

### Core
- `User` — użytkownicy systemu (ADMIN, EMPLOYEE)
- `Hall` — sale bankietowe
- `Client` — klienci
- `EventType` — typy wydarzeń (z color, description)
- `Reservation` — rezerwacje (z kolejką, statusami, isWholeVenue)
- `ReservationHistory` — audit trail

### Deposits
- `Deposit` — zaliczki z statusem i terminami
- `DepositPayment` — częściowe płatności

### Menu System
- `DishCategory` — kategorie dań (slug, icon, color)
- `Dish` — dania (allergens, categoryId)
- `MenuTemplate` — szablony menu (eventTypeId, variant, validFrom/To)
- `MenuPackage` — pakiety cenowe (pricePerAdult/Child/Toddler)
- `MenuOption` — opcje dodatkowe (priceType: PER_PERSON/FLAT)
- `MenuPackageOption` — junction: pakiet ↔ opcja
- `PackageCategorySettings` — konfiguracja kategorii w pakietach
- `AddonGroup` — grupy dodatków
- `AddonGroupDish` — junction: grupa ↔ danie
- `ReservationMenuSnapshot` — snapshot menu w rezerwacji (menuData JSON)
- `MenuPriceHistory` — historia zmian cen

### Attachments
- `Attachment` — załączniki (entityType, entityId, category, file metadata, soft-delete)

### Other
- `ActivityLog` — logi aktywności

---

**Status:** Projekt w wersji 1.4.4. Frontend w trybie produkcyjnym (build + start). Kompletny system rezerwacji z 6-krokowym wizardem, flow Szablon→Pakiet, systemem załączników, detekcją konfliktu "Cała Sala", testami E2E, poprawionym kodowaniem UTF-8. Gotowy do dalszego rozwoju.
