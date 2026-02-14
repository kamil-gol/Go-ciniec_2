# 📝 Changelog

## [0.9.8] - 2026-02-14

### ✨ Nowe funkcjonalności
- **Moduł Typy Wydarzeń** - pełny frontend CRUD
  - Lista typów z hero, statystykami, wyszukiwaniem, filtrowaniem
  - Strona szczegółów z informacjami i powiązaniami
  - Dialog tworzenia/edycji z color picker
  - Dialog usuwania z walidacją powiązań
  - Toggle aktywności inline
  - Karty z kolorami typów i badge'ami

### 🎨 UI/UX
- Accent fuchsia/pink dla modułu Typy Wydarzeń
- Design tokens w `lib/design-tokens.ts`
- Hero gradient spójny z innymi modułami
- Responsywny grid kart

### 📚 Dokumentacja
- Zaktualizowano API.md (nowe pola: description, color, isActive, stats endpoint)
- Zaktualizowano CURRENT_STATUS.md
- Zaktualizowano CHANGELOG.md

---

## [0.9.7] - 2026-02-11

### ✨ Nowe funkcjonalności
- **System Menu & Dania**
  - Kategorie dań - CRUD API + Frontend UI
  - Biblioteka dań - CRUD, alergeny, filtrowanie
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
- Bug #5: Race conditions - row-level locking
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
