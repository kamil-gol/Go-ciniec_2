# 📍 Status Projektu - 15.02.2026

## ⚡ Szybki Przegląd

**Branch:** `main`  
**Ostatnia aktualizacja:** 15.02.2026, 13:42 CET  
**Status:** ✅ Stabilny - W aktywnym rozwoju  
**Wersja:** 1.4.4 (Fix encoding + attachments API)  
**Następna wersja:** 1.5.0 (Sprint 6 — Quick Wins)

---

## 🗺️ Roadmap

| Sprint | Temat | Estymacja | Wersja | Status |
|--------|-------|-----------|--------|--------|
| 6 | Quick Wins & Bugfixy (6 tasków) | ~1 dzień | v1.5.0-v1.5.5 | 🔳 Następny |
| 7 | System Rabatów (% / PLN) | ~2-3 dni | v1.6.0 | 🔳 Planowany |
| 8 | Historia Zmian & Archiwum | ~3-5 dni | v1.7.0-v1.7.1 | 🔳 Planowany |
| 9 | Ujednolicenie UI & Mobile | ~5-7 dni | v1.8.0 | 🔳 Planowany |

📚 **Pełny plan sprintów:** [docs/SPRINTS.md](docs/SPRINTS.md)

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

### 🔧 Build Fixes (v1.4.1)
✅ **Fix `menu-selection.ts`** — import `./client` (nieistniejący) → `@/lib/api-client`  
✅ **Fix NODE_ENV dual-bundle** — wymuszenie `NODE_ENV=production` w build script  
✅ **Fix Pages Router 404** — dodanie `app/not-found.tsx` (App Router custom 404)  
✅ **Build 29/29 stron** — kompilacja, linting, generowanie static pages bez błędów  

### 🧙 Formularz Rezerwacji — 6-krokowy Wizard (v1.4.0)
✅ **Krok 1 — Wydarzenie:** Typ wydarzenia + pola kontekstowe (urodziny/rocznica/inne)  
✅ **Krok 2 — Sala i termin:** Wybór sali + DatePicker + TimePicker + auto-check dostępności  
✅ **Krok 3 — Goście:** Podział na 3 grupy wiekowe z capacity warning  
✅ **Krok 4 — Menu i ceny:** Flow Szablon → Pakiet → Ceny (lub ręczne ustalanie)  
✅ **Krok 5 — Klient:** Combobox z wyszukiwarką + modal tworzenia nowego klienta  
✅ **Krok 6 — Podsumowanie:** Kolorowe karty klikalne, price breakdown, notatki  
📚 **Dokumentacja:** [docs/RESERVATION_FORM_WIZARD.md](docs/RESERVATION_FORM_WIZARD.md)

### System Rezerwacji & Kolejki
✅ System kolejki rezerwacji (status RESERVED)  
✅ Drag & drop zmiany kolejności (z loading states)  
✅ Awansowanie do pełnej rezerwacji  
✅ Pola warunkowe (Urodziny, Rocznica, Inne)  
✅ Podział gości na 3 grupy wiekowe  
✅ Auto-kalkulacja cen + dodatkowe godziny z automatyczną notą  
✅ Row-level locking + Retry logic + Auto-cancel  
✅ Detekcja konfliktu "Cała Sala" (v1.2.0)  
✅ Sanityzacja null bytes (v1.2.0)  

### 🍽️ System Menu (KOMPLETNY)
✅ Kategorie Dań, Biblioteka Dań, Szablony Menu, Pakiety Menu  
✅ Opcje Menu, Grupy Dodatków, Ustawienia Kategorii  
✅ Historia Cen, Karta Menu PDF (v1.3.0)  

### 📎 System Załączników (Attachments)
✅ Upload plików z kategoriami (RODO, Umowa, Faktura, Zdjęcie, Korespondencja, Inne)  
✅ Panel załączników, Batch check RODO/Contract, Download/Archive/Delete  

### 🔒 Bezpieczeństwo & Auth (v1.1.0)
✅ JWT Authentication + Role-Based Access Control (ADMIN, EMPLOYEE)  
✅ Auth middleware na WSZYSTKICH endpointach menu — 45+ endpointów  

### 🔔 System Powiadomień (v1.2.0)
✅ Sonner Toaster — stackowanie, close button, z-index: 99999  

### 🔗 Integracja Menu z Rezerwacjami
✅ ReservationMenuSnapshot — select/get/update/remove menu, kalkulator cen  

### 🎭 Typy Wydarzeń
✅ Backend API (CRUD + stats) + Frontend (lista, szczegóły, formularze)  

### 💰 System Zaliczek (Deposits)
✅ Model Deposit + DepositPayment — CRUD + statusy + częściowe płatności  

### 🧪 Testy E2E
✅ 45 testów (43 pass, 2 skip) — Playwright w Docker  
📚 **Dokumentacja:** [docs/E2E_TESTING_PLAN.md](docs/E2E_TESTING_PLAN.md)

---

## 📋 TODO — Nadchodzące Sprinty

### 🔧 Sprint 6: Quick Wins (v1.5.x) — ~1 dzień
- [ ] US-6.1: Redirect do szczegółów po utworzeniu rezerwacji (1 linia)
- [ ] US-6.2: Usunięcie sali z PDF potwierdzenia
- [ ] US-6.3: Usunięcie automatycznej notatki o >6h
- [ ] US-6.4: Blokada zmiany statusu na COMPLETED przed datą wydarzenia
- [ ] US-6.5: Dodawanie nowego klienta w formularzu rezerwacji
- [ ] US-6.6: Auto-notatka o inflacji (+10%) dla rezerwacji na następny rok

### 💰 Sprint 7: System Rabatów (v1.6.0) — ~2-3 dni
- [ ] US-7.1: Migracja DB — 5 nowych pól (discountType, discountValue, discountAmount, discountReason, priceBeforeDiscount)
- [ ] US-7.2: Backend API — `PATCH/DELETE /api/reservations/:id/discount`
- [ ] US-7.3: Frontend — UI rabatu w Financial Summary (toggle %, input, preview)
- [ ] US-7.4: Rabat w formularzu nowej rezerwacji (Krok 6)

### 📜 Sprint 8: Historia Zmian & Archiwum (v1.7.x) — ~3-5 dni
- [ ] US-8.1: Reusable Audit Logger (`logChange()` + `diffObjects()`)
- [ ] US-8.2: Integracja we WSZYSTKICH modułach (11 serwisów, ~35 akcji)
- [ ] US-8.3: Activity Log API z paginacją i filtrami
- [ ] US-8.4: Frontend `<AuditTimeline>` + widok globalny
- [ ] US-8.5: Moduł Archiwum (strona, API, auto-archiwizacja)

### 🎨 Sprint 9: Ujednolicenie UI & Mobile (v1.8.0) — ~5-7 dni
- [ ] US-9.1: Design System — `ModuleHero`, `ModuleList`, `ResponsiveTable`, `MobileNav`
- [ ] US-9.2: Migracja 8 modułów na shared components
- [ ] US-9.3: Mobile-first responsive (sidebar, formularze, tabele, modale)

### 🔄 Backlog (po Sprint 9)
- [ ] Backend production mode (kompilacja TS → JS + `npm run start`)
- [ ] Testy jednostkowe systemu menu
- [ ] Import/Export menu (CSV/JSON)
- [ ] Sezonowość dań
- [ ] Zdjęcia dań (upload + gallery)
- [ ] Statystyki popularności dań
- [ ] Multi-language menu (PL/EN)
- [ ] System emaili (szablony + queue + przypomnienia)
- [ ] Widok kalendarza rezerwacji

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
├── attachment.routes.ts          # Upload/download/archiwum załączników
├── dish-category.routes.ts
├── dish.routes.ts
├── menu.routes.ts              # Templates + Packages + Options
├── menu-calculator.routes.ts   # Kalkulator cen
├── stats.routes.ts             # Statystyki dashboard
└── README_MENU_API.md          # Pełna dokumentacja Menu API
```

---

## 📚 Dokumentacja

| Dokument | Opis |
|----------|------|
| [API.md](API.md) | Dokumentacja API — wszystkie endpointy |
| [apps/backend/src/routes/README_MENU_API.md](apps/backend/src/routes/README_MENU_API.md) | Szczegółowa dokumentacja Menu API z przykładami |
| [CHANGELOG.md](CHANGELOG.md) | Historia zmian |
| [docs/README.md](docs/README.md) | Główny indeks dokumentacji |
| [docs/SPRINTS.md](docs/SPRINTS.md) | **Plan sprintów 6-9 (nowy!)** |
| [docs/RESERVATION_FORM_WIZARD.md](docs/RESERVATION_FORM_WIZARD.md) | Dokumentacja 6-krokowego wizarda rezerwacji |
| [docs/E2E_TESTING_PLAN.md](docs/E2E_TESTING_PLAN.md) | Plan testów E2E (45 testów) |
| [docs/QUEUE.md](docs/QUEUE.md) | Dokumentacja systemu kolejki |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Architektura projektu |
| [docs/DATABASE.md](docs/DATABASE.md) | Struktura bazy danych |

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
1. CURRENT_STATUS.md — pełny status + roadmap + TODO + struktura
2. CHANGELOG.md — historia zmian (najnowsza wersja: 1.4.4)
3. docs/SPRINTS.md — plan sprintów 6-9 z user stories
4. apps/backend/prisma/schema.prisma — modele bazy danych
5. docker-compose.yml — konfiguracja kontenerów

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

## Roadmap (co dalej):
- 🔧 Sprint 6: Quick Wins (v1.5.x) — 6 tasków, ~1 dzień
- 💰 Sprint 7: System Rabatów (v1.6.0) — migracja DB + API + UI
- 📜 Sprint 8: Historia Zmian & Archiwum (v1.7.x) — audit trail + archiwum
- 🎨 Sprint 9: Ujednolicenie UI & Mobile (v1.8.0) — design system + responsive

Zacznij od przeczytania CURRENT_STATUS.md → docs/SPRINTS.md, potem zacznij od Sprint 6.
```

---

## 🐞 Znane Problemy

**Brak krytycznych bugów** 🎉

### ⚠️ Uwagi
- Backend kontener nadal w dev mode (`npm run dev`) — zmiana na production planowana osobno
- Ostrzeżenie "Disabling SWC Minifier" jest informacyjne — zostanie usunięte w Next.js 15
- Każdy restart frontend = rebuild ~30-60s (trade-off za production performance)

---

## 📊 Postęp Ogólny

- **Backend:** 99% ✅
- **Frontend:** 99% ✅ (production mode ✅)
- **Bezpieczeństwo:** 95% ✅ (auth na wszystkich endpointach)
- **Testy:** 80% 🔄 (E2E: 45 testów pass)
- **Dokumentacja:** 99% ✅ (zaktualizowana 15.02, 13:42)
- **Deployment:** 85% 🔄 (frontend: production ✅, backend: dev 🔄)

### Postęp Modułów:
- **Sale (Halls):** 100% ✅
- **Klienci:** 100% ✅
- **Rezerwacje + Kolejka:** 100% ✅
- **Formularz Rezerwacji (Wizard):** 100% ✅ (v1.4.0)
- **Typy Wydarzeń:** 100% ✅
- **System Menu (kompletny):** 100% ✅
- **Integracja Menu+Rezerwacje:** 100% ✅
- **System Zaliczek:** 100% ✅
- **System Załączników:** 100% ✅ (v1.4.4)
- **Auth Middleware:** 100% ✅ (v1.1.0)
- **Testy E2E:** 100% ✅ (45 testów)
- **UTF-8 Encoding Fix:** 100% ✅ (v1.4.2 + v1.4.4)
- **Production Mode:** 100% ✅ (v1.4.3)
- **System Rabatów:** 0% 🔳 (Sprint 7)
- **Historia Zmian (Audit):** 0% 🔳 (Sprint 8)
- **Moduł Archiwum:** 0% 🔳 (Sprint 8)
- **Ujednolicenie UI:** 0% 🔳 (Sprint 9)
- **Responsywność Mobile:** 0% 🔳 (Sprint 9)

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

# Migracje (wymagane w Sprint 7 i 8!)
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
- `ReservationHistory` — audit trail rezerwacji

### Deposits
- `Deposit` — zaliczki z statusem i terminami
- `DepositPayment` — częściowe płatności

### Menu System
- `DishCategory`, `Dish`, `MenuTemplate`, `MenuPackage`, `MenuOption`
- `MenuPackageOption`, `PackageCategorySettings`, `AddonGroup`, `AddonGroupDish`
- `ReservationMenuSnapshot`, `MenuPriceHistory`

### Attachments
- `Attachment` — załączniki (entityType, entityId, category, file metadata, soft-delete)

### Audit
- `ActivityLog` — logi aktywności (action, entityType, entityId, details JSON)

---

**Status:** Projekt w wersji 1.4.4. Frontend w trybie produkcyjnym. Kompletny system rezerwacji z 6-krokowym wizardem, flow Szablon→Pakiet, systemem załączników. Zaplanowane Sprinty 6-9 (Quick Wins → Rabaty → Audit Trail → UI/Mobile). Gotowy do Sprint 6.
