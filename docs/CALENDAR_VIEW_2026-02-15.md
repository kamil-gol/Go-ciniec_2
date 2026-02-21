# 📅 Widok Kalendarza Rezerwacji (US-2.9)

**Data:** 15 lutego 2026  
**Branch:** `feature/calendar-view` → `main` (PR #52)  
**Status:** ✅ Zakończony

---

## Opis

Dodano interaktywny widok kalendarza miesięcznego do modułu rezerwacji. Kalendarz jest teraz **domyślnym widokiem** rezerwacji (redirect z `/dashboard/reservations` na `/dashboard/reservations/calendar`).

## Nowe pliki

### Frontend

| Plik | Opis |
|---|---|
| `app/dashboard/reservations/page.tsx` | Redirect do `/calendar` (domyślny widok) |
| `app/dashboard/reservations/calendar/page.tsx` | Strona kalendarza |
| `app/dashboard/reservations/list/page.tsx` | Strona listy (przeniesiona) |
| `lib/api/calendar-api.ts` | React Query hooks dla kalendarza |

### Backend

| Plik | Opis |
|---|---|
| `src/calendar/calendar.module.ts` | Moduł NestJS |
| `src/calendar/calendar.controller.ts` | Kontroler z dwoma endpointami |
| `src/calendar/calendar.service.ts` | Serwis z logiką pobierania danych |

## Routing

| Route | Widok | Opis |
|---|---|---|
| `/dashboard/reservations` | Redirect | Przekierowuje na kalendarz |
| `/dashboard/reservations/calendar` | Kalendarz | Interaktywna siatka miesięczna |
| `/dashboard/reservations/list` | Lista | Tradycyjna lista rezerwacji |

## API Endpointy

### GET `/api/calendar/reservations`

Pobiera rezerwacje na konkretny miesiąc.

**Query parameters:**
- `year` (number, wymagany) — rok
- `month` (number, wymagany) — miesiąc (1-12)

**Response:**
```json
[
  {
    "id": "uuid",
    "date": "2026-02-20",
    "startTime": "18:00",
    "endTime": "23:00",
    "status": "CONFIRMED",
    "guests": 50,
    "totalPrice": 5000,
    "client": {
      "id": "uuid",
      "firstName": "Jan",
      "lastName": "Kowalski"
    },
    "hall": {
      "id": "uuid",
      "name": "Sala Główna"
    },
    "eventType": {
      "id": "uuid",
      "name": "Wesele",
      "color": "#6366f1"
    }
  }
]
```

### GET `/api/calendar/halls`

Pobiera listę sal do filtrowania.

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "Sala Główna",
    "isActive": true
  }
]
```

## Funkcjonalności kalendarza

### Siatka miesięczna
- 7 kolumn (Pn–Nd) z polskimi skrótami
- Dni spoza miesiąca przyciemnione
- Weekendy (Sb, Nd) w kolorze różowym
- Dzisiejszy dzień podświetlony niebieskim kołem

### Pills rezerwacji
- Kolorowe paski (border-left) w kolorze `eventType.color`
- Status dots: zielony (potwierdzone), żółty (oczekujące), niebieski (w kolejce), szary (zakończone), czerwony (anulowane)
- Format: `[godzina] Imię N.`
- Max 3 pills na dzień + "+N więcej"
- Kliknięcie → strona szczegółów rezerwacji

### Panel boczny
- Otwiera się po kliknięciu w dzień
- Karty każdej rezerwacji z: nazwa wydarzenia, status, klient, godziny, sala, cena
- Animacja wejścia/wyjścia (framer-motion)
- Grid: 2/3 kalendarz + 1/3 panel (lub pełna szerokość bez panelu)

### Nawigacja
- Strzałki prev/next miesiąc
- Przycisk "Dziś" (powrót do bieżącego miesiąca)
- Nazwa miesiąca po polsku

### Filtrowanie
- Dropdown "Wszystkie sale" z listą aktywnych sal
- Filtruje pills na kalendarzu

### Legenda
- Typy wydarzeń z kolorowymi kropkami
- Statusy z kolorowymi kropkami

## Ujednolicony layout

Oba widoki (kalendarz + lista) mają identyczny układ:

1. **PageHero** — gradient z tytułem „Rezerwacje” i przyciskiem „Nowa Rezerwacja”
2. **4 StatCardy** — Wszystkie, Potwierdzone, Oczekujące, Ten miesiąc
3. **Toggle bar** — Kalendarz (lewo) | Lista (prawo)
4. **Zawartość** — siatka kalendarza lub lista z wyszukiwarką

## Stany UI

| Stan | Obsługa |
|---|---|
| Loading | Skeleton grid (35 komórek z animacją pulse) |
| Error | Czerwony alert z ikoną AlertCircle |
| Brak rezerwacji | Panel boczny z ikoną kalendarza i tekstem „Brak rezerwacji” |
| Dark mode | Pełne wsparcie (dark: klasy Tailwind) |
| Responsive | Pełne wsparcie (grid cols, min-heights) |

## Technologie

- **React Query** (SWR) — caching + auto-refetch
- **Framer Motion** — animacje panelu bocznego
- **Lucide Icons** — ikony
- **Tailwind CSS** — styling
- **NestJS** — backend API
