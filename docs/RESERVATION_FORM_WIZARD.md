# 🧙 Formularz Rezerwacji — 6-krokowy Wizard

## 📊 Przegląd

**Data implementacji:** 14.02.2026  
**Wersja:** 1.4.0  
**PR:** [#49](https://github.com/kamil-gol/Go-ciniec_2/pull/49)  
**Branch:** `feature/reservation-form-redesign`  
**Statystyki:** +1894 / -758 linii | 12 plików | 10 commitów

---

## 🎯 Co się zmieniło

Kompletna przebudowa formularza tworzenia rezerwacji — z płaskiego, długiego formularza na **6-krokowy wizard** z premium UI, animacjami (framer-motion) i spójnym design systemem.

### Przed vs Po

| Aspekt | Stary formularz | Nowy wizard |
|--------|----------------|-------------|
| Layout | Jeden długi formularz | 6 kroków z nawigacją |
| Nawigacja | Scroll | Stepper (desktop) / Progress bar (mobile) |
| Wybór klienta | Zwykły Select | Combobox z wyszukiwarką + "Dodaj klienta" |
| Data/godzina | Zwykłe inputy | DatePicker + TimePicker (scrollowalna siatka) |
| Menu | Brak integracji | Flow: Szablon → Pakiet → Ceny |
| Extra hours | Brak | Automatyczna kalkulacja >6h (500 PLN/h) |
| Podsumowanie | Brak | Kolorowe karty klikalne z price breakdown |
| Walidacja | Na submit | Per-step (nie przejdziesz dalej bez wypełnienia) |

---

## 🪨 Kroki Wizarda

### Krok 1 — Wydarzenie
**Cel:** Wybór typu wydarzenia z polami kontekstowymi.

- **Select** z listą typów wydarzeń (z API `useEventTypes`)
- **Pola dynamiczne** zależne od typu:
  - Urodziny → `birthdayAge` (wiek jubilata)
  - Rocznica → `anniversaryYear` (która rocznica) + `occasionDetails` (okazja)
  - Inne → `occasionDetails` (opis własny)
- Walidacja: typ wydarzenia wymagany

### Krok 2 — Sala i termin
**Cel:** Wybór sali, daty i godzin.

- **Select** z salami (z API `useHalls`)
- **DatePicker** z polskim locale (`date-fns/locale/pl`), minimum = dzisiaj
- **TimePicker** × 2 (start + koniec) — scrollowalna siatka co 15 min, auto-scroll do wybranej
- **Auto-check dostępności** sali w wybranym terminie
- **Info o extra hours** jeśli czas trwania > 6h
- **Switch** `isWholeVenue` (Cały Obiekt)

### Krok 3 — Goście
**Cel:** Podział gości na grupy wiekowe.

- **3 karty** z inputami:
  - Dorośli (adults)
  - Dzieci 4–12 (children)
  - Maluchy 0–3 (toddlers)
- **Capacity warning** — ostrzeżenie gdy suma gości > pojemność sali
- **Auto-suma** wyświetlana na bieżąco

### Krok 4 — Menu i ceny 🆕
**Cel:** Wybór menu z szablonu lub ręczne ustalanie cen.

#### Flow: Szablon → Pakiet → Ceny

```
① Szablon menu (filtrowany po eventTypeId + isActive)
    ↓ useMenuTemplates()
② Pakiet cenowy (pakiety wybranego szablonu)
    ↓ usePackagesByTemplate(templateId)
③ Ceny automatyczne z pakietu
    → pricePerAdult / pricePerChild / pricePerToddler
```

- **Breadcrumb:** `Szablon → Pakiet → Ceny` widoczny w UI
- **Auto-clear:** Zmiana szablonu kasuje wybrany pakiet; zmiana event type kasuje szablon
- **Alternatywa:** Można też ustalić ceny ręcznie (bez szablonu)
- **Zod schema:** Dodano pole `menuTemplateId` do formularza
- Submit payload zawiera `menuTemplateId` + `menuPackageId` + ceny

#### Hooki używane
| Hook | Źródło | Opis |
|------|--------|------|
| `useMenuTemplates()` | `lib/api/menu-templates-api.ts` | Aktywne szablony filtrowane po `eventTypeId` |
| `usePackagesByTemplate(id)` | `lib/api/menu-packages-api.ts` | Pakiety cenowe wybranego szablonu |

### Krok 5 — Klient
**Cel:** Wybór istniejącego lub utworzenie nowego klienta.

- **Combobox** (Radix Command / cmdk) z:
  - Wyszukiwaniem po nazwie/telefonie
  - Ikonkami i secondary labels
  - Footer action: "Dodaj nowego klienta"
- **Modal tworzenia klienta** — otwarcie inline bez opuszczania wizarda
- Pełna obsługa klawiatury (Arrow keys, Enter, Escape)

### Krok 6 — Podsumowanie
**Cel:** Przegląd wszystkich danych przed zapisem.

- **Kolorowe karty** — klikalne (przenoszą do odpowiedniego kroku)
- **Price breakdown:**
  - Cena bazowa (z pakietu lub ręczna)
  - Extra hours cost (>6h × 500 PLN/h)
  - Effective total price
- **Notatki** — pole textarea
- **Przycisk Submit** — tworzy rezerwację

---

## 🏛️ Nowe Komponenty UI

### `Stepper`
**Plik:** `components/ui/stepper.tsx`

- Desktop: ikonki + linie postępu z animacją (framer-motion)
- Mobile: progress bar + step dots
- Klikalne kroki (cofanie do ukończonych)
- Stany: `active` (primary) → `completed` (zielony check) → `upcoming` (szary)

### `Combobox`
**Plik:** `components/ui/combobox.tsx`

- Radix Command (cmdk) pod spodem
- Popover z filtrowaniem, ikonkami, secondary labels
- Footer action ("Dodaj nowego klienta")
- Pełna obsługa klawiatury

### `DatePicker`
**Plik:** `components/ui/date-picker.tsx`

- Popover + Calendar (`react-day-picker`)
- Polski locale (`date-fns/locale/pl`)
- Min date constraint

### `TimePicker`
**Plik:** `components/ui/time-picker.tsx`

- Scrollowalna siatka z interwałami co 15 min
- Auto-scroll do wybranej godziny
- Wizualnie spójny z DatePicker

---

## 🐛 Poprawki w ramach PR #49

### Fix #1: Combobox — transparentne tło
- **Plik:** `components/ui/command.tsx`
- **Problem:** `bg-popover` renderował się jako transparentny
- **Fix:** `bg-popover` → `bg-white text-secondary-900`

### Fix #2: Extra hours w Financial Summary
- **Plik:** `components/reservations/reservation-financial-summary.tsx`
- **Nowe propsy:** `startDateTime`, `endDateTime`, `extraHourRate`
- **Logika:** Jeśli czas trwania > 6h, oblicza dodatkowe godziny i koszt (500 PLN/h)
- **UI:** Nowa sekcja z ikoną Timer, `effectiveTotalPrice = baseTotalPrice + extraHoursCost`

### Fix #3: Propsy datetime na stronie szczegółów
- **Plik:** `app/(dashboard)/dashboard/reservations/[id]/page.tsx`
- **Problem:** `ReservationFinancialSummary` nie otrzymywał `startDateTime`/`endDateTime`
- **Fix:** Przekazanie propsów z danych rezerwacji

---

## 📁 Zmienione pliki

| Plik | Typ zmiany |
|------|------------|
| `components/ui/stepper.tsx` | 🆕 Nowy komponent |
| `components/ui/combobox.tsx` | 🆕 Nowy komponent |
| `components/ui/date-picker.tsx` | 🆕 Nowy komponent |
| `components/ui/time-picker.tsx` | 🆕 Nowy komponent |
| `components/ui/command.tsx` | 🐛 Fix bg-popover |
| `components/reservations/create-reservation-form.tsx` | 🔄 Redesign → wizard |
| `components/reservations/reservation-financial-summary.tsx` | ✨ Extra hours |
| `app/(dashboard)/dashboard/reservations/[id]/page.tsx` | 🐛 Fix props |
| `app/(dashboard)/dashboard/reservations/new/page.tsx` | 🔄 Wizard integration |
| `lib/api/menu-templates-api.ts` | 🔗 Hook useMenuTemplates |
| `lib/api/menu-packages-api.ts` | 🔗 Hook usePackagesByTemplate |
| `lib/validations/reservation.ts` | ✨ menuTemplateId w schema |

---

## 🚀 Zależności

### Npm packages (dodane/używane)
- `framer-motion` — animacje Stepper
- `cmdk` — Combobox (Command menu)
- `react-day-picker` — DatePicker calendar
- `date-fns` + `date-fns/locale/pl` — formatowanie dat po polsku
- `@radix-ui/react-popover` — Popover dla DatePicker/Combobox
- `@radix-ui/react-switch` — Switch (isWholeVenue)
- `@radix-ui/react-select` — Select (typ wydarzenia, sala)

---

## 🧪 Testowane scenariusze

- [x] Przejście przez wszystkie 6 kroków
- [x] Walidacja per-step (nie przejdziesz bez wypełnienia)
- [x] Auto-fill czasu zakończenia
- [x] Flow: Szablon → Pakiet → auto-ceny
- [x] Auto-kasowanie pakietu przy zmianie szablonu
- [x] Pakiet menu vs ręczne ceny (przełączanie)
- [x] Extra hours (>6h) w Financial Summary
- [x] Sprawdzanie dostępności sali
- [x] Tworzenie klienta z modala (bez opuszczania wizarda)
- [x] Cofanie do poprzednich kroków (klikanie Stepper)
- [x] Docker Compose restart — działa na serwerze

---

## 📚 Związane Dokumenty

- [CHANGELOG.md](../CHANGELOG.md) — wpis v1.4.0
- [CURRENT_STATUS.md](../CURRENT_STATUS.md) — sekcja "Formularz Rezerwacji"
- [FRONTEND_MENU_INTEGRATION.md](./FRONTEND_MENU_INTEGRATION.md) — integracja menu z rezerwacjami
- [MENU_SYSTEM.md](./MENU_SYSTEM.md) — pełna dokumentacja systemu menu
- [BUGFIX_SESSION_2026-02-14.md](./BUGFIX_SESSION_2026-02-14.md) — bugi naprawione tego dnia

---

**Commit:** [`5df7b2e`](https://github.com/kamil-gol/Go-ciniec_2/commit/5df7b2e329b5ef67d69f1bfed0b6022fd7320849)  
**PR:** [#49](https://github.com/kamil-gol/Go-ciniec_2/pull/49)  
**Data:** 14.02.2026, 20:56 CET  
**Branch:** main
