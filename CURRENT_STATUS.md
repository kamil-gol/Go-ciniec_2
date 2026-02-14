# 📍 Status Projektu - 14.02.2026

## ⚡ Szybki Przegląd

**Branch:** `main`  
**Ostatnia aktualizacja:** 14.02.2026, 17:00 CET  
**Status:** ✅ Stabilny - W aktywnym rozwoju  
**Wersja:** 1.1.0 (Auth Middleware + Full Menu System)

---

## 📦 Co Działa

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

### 🍽️ System Menu (KOMPLETNY)
✅ **Kategorie Dań** — CRUD API + Frontend UI, sortowanie, ikony emoji + kolory  
✅ **Biblioteka Dań** — CRUD, alergeny, filtrowanie, wyszukiwanie, premium UI  
✅ **Szablony Menu (MenuTemplate)** — CRUD, warianty, validFrom/validTo, duplikowanie, przypisanie do EventType  
✅ **Pakiety Menu (MenuPackage)** — CRUD, ceny per adult/child/toddler, includedItems, reorder, isPopular/isRecommended  
✅ **Opcje Menu (MenuOption)** — CRUD, kategorie (Alkohol, Muzyka itp.), priceType: PER_PERSON/FLAT, przypisanie do pakietów  
✅ **Grupy Dodatków (AddonGroup)** — CRUD, min/maxSelect, priceType, powiązania z daniami  
✅ **Ustawienia Kategorii w Pakietach (PackageCategorySettings)** — minSelect/maxSelect per kategoria  
✅ **Historia Cen (MenuPriceHistory)** — automatyczne śledzenie zmian cen  
✅ **Premium UI/UX Components** — Switch, AlertDialog, DishDialog, loading states

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
├── dish-category.routes.ts
├── dish.routes.ts
├── menu.routes.ts              # Templates + Packages + Options (auth protected)
├── menu-calculator.routes.ts   # Kalkulator cen (auth protected)
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
- **Frontend:** Next.js (port 3000)
- **Backend:** Node.js + Prisma (port 3001)

## Zasady pracy
1. Masz pełny dostęp do GitHub — czytaj, edytuj, twórz pliki bezpośrednio bez pytania
2. Twórz nowe branche na nowe funkcjonalności, potem PR do main
3. Po zmianach daj mi TYLKO komendy do wykonania na serwerze
4. Nie każ mi robić rzeczy manualnie — sam organizuj pliki na GitHubie
5. Sprawdzaj istniejący kod przed edycją
6. Aktualizuj dokumentację po każdym module
7. Polskie znaki pisz bezpośrednio (ą, ę, ó, ś)

## Workflow
- Sprawdzanie kodu: get_file_contents → repo: kamil-gol/Go-ciniec_2
- Edycja: create_or_update_file → zapisuje bezpośrednio
- Po zmianach komendy:
  cd /home/kamil/rezerwacje && git pull origin main
  docker-compose restart backend  # lub frontend
  docker-compose logs -f backend --tail=50

Przeczytaj na start:
1. CURRENT_STATUS.md — pełny status + TODO
2. API.md — dokumentacja endpointów
3. apps/backend/src/routes/README_MENU_API.md — szczegółowa dokumentacja Menu API
4. apps/backend/prisma/schema.prisma — modele bazy danych

## Co jest gotowe (v1.1.0):
- ✅ Rezerwacje + kolejka + drag&drop + auto-cancel
- ✅ Sale, Klienci, Typy Wydarzeń (pełny CRUD)
- ✅ Kategorie dań + Biblioteka dań
- ✅ Szablony Menu + Pakiety + Opcje + Dodatki
- ✅ Integracja Menu z Rezerwacjami (snapshot + kalkulator cen)
- ✅ System zaliczek (Deposits + payments)
- ✅ Historia cen menu (MenuPriceHistory)
- ✅ Auth middleware na WSZYSTKICH endpointach menu

## Co wymaga dalszej pracy:
- ❓ Generowanie PDF z menu w rezerwacji
- 🔄 Testy jednostkowe systemu menu
- 🔄 Production deployment

Zacznij od przeczytania CURRENT_STATUS.md, potem zaproponuj plan.
```

---

## 🐞 Znane Problemy

**Brak znanych bugów** 🎉

---

## 📋 TODO

### 🔄 Planowane
- [ ] Generowanie PDF z menu w rezerwacji
- [ ] Testy jednostkowe systemu menu
- [ ] Production deployment
- [ ] Import/Export menu (CSV/JSON)
- [ ] Sezonowość dań
- [ ] Zdjęcia dań (upload + gallery)
- [ ] Statystyki popularności dań
- [ ] Multi-language menu (PL/EN)
- [ ] Generowanie kart menu do wydruku

---

## 📊 Postęp Ogólny

- **Backend:** 99% ✅
- **Frontend:** 95% ✅
- **Bezpieczeństwo:** 95% ✅ (auth na wszystkich endpointach)
- **Testy:** 78% 🔄
- **Dokumentacja:** 98% ✅ (zaktualizowana 14.02)
- **Deployment:** 70% 🔄

### Postęp Modułów:
- **Sale (Halls):** 100% ✅
- **Klienci:** 100% ✅
- **Rezerwacje + Kolejka:** 100% ✅
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
- **Auth Middleware:** 100% ✅ (v1.1.0)
- **PDF Generation:** ❓ Do implementacji

---

## 🔧 Komendy Docker

```bash
# Pobranie zmian
cd /home/kamil/rezerwacje
git checkout main
git pull origin main

# Restart (po pull)
docker-compose restart backend frontend

# Rebuild (jeśli zmiany w package.json lub Dockerfile)
docker-compose down
docker-compose up --build -d

# Pełny rebuild bez cache
docker-compose down
docker-compose build --no-cache frontend
docker-compose up -d

# Logi
docker-compose logs -f backend --tail=50
docker-compose logs -f frontend --tail=50

# Migracje
docker-compose exec backend npm run prisma:migrate:deploy

# Baza danych
docker-compose exec postgres psql -U rezerwacje -d rezerwacje
```

---

## 🗄️ Modele Bazy Danych (Prisma)

### Core
- `User` — użytkownicy systemu (ADMIN, EMPLOYEE)
- `Hall` — sale bankietowe
- `Client` — klienci
- `EventType` — typy wydarzeń (z color, description)
- `Reservation` — rezerwacje (z kolejką, statusami)
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

### Other
- `ActivityLog` — logi aktywności

---

**Status:** Projekt w wersji 1.1.0. Kompletny system menu z auth middleware na wszystkich endpointach. Gotowy do dalszego rozwoju (PDF, testy, deployment).
