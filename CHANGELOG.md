# 📝 Changelog

## [1.1.0] - 2026-02-14

### 🔒 Bezpieczeństwo
- **Auth middleware na endpointach menu** — wszystkie 45+ endpointów zabezpieczonych
  - GET endpointy → `authMiddleware` + `requireStaff` (ADMIN + EMPLOYEE)
  - POST/PUT/DELETE → `authMiddleware` + `requireAdmin`
  - Dish categories GET → publiczne (potrzebne do UI)
  - Dish categories POST/PUT/DELETE → `requireAdmin` (wcześniej brak kontroli roli)
  - Menu calculator → `authMiddleware` + `requireStaff`
  - Reservation menu selection → `authMiddleware` + `requireStaff`

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
