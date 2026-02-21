# 📝 Inline Editing — Sesja 15.02.2026

## Kontekst

Issue: [#53](https://github.com/kamil-gol/Go-ciniec_2/issues/53)  
PR: [#54](https://github.com/kamil-gol/Go-ciniec_2/pull/54) (squash merged)  
Branch: `feature/inline-editing-details` → `main`

## Problem

Edycja rezerwacji odbywała się przez ciężki modal (`edit-reservation-modal.tsx`, 42KB / 1044 linie), który:
- Nie sprawdzał dostępności sali przy zmianie
- Używał surowego `datetime-local` zamiast DatePicker
- Nie wymagał powodu zmiany (brak audit trail)
- Duplikował cały formularz tworzenia rezerwacji

Dodatkowo istniał `reservation-details-modal.tsx` (22KB / 511 linii), który był zbędny po wprowadzeniu pełnej strony `/dashboard/reservations/[id]`.

## Rozwiązanie

Każda sekcja strony szczegółów rezerwacji stała się edytowalna inline, bez opuszczania widoku.

### Nowe komponenty

```
components/reservations/editable/
├── EditableCard.tsx          # Generyczny wrapper view/edit (framer-motion)
├── StatusChanger.tsx         # Inline zmiana statusu w hero section
├── EditableHallCard.tsx      # Sala + useCheckAvailability
├── EditableEventCard.tsx     # Typ, data, czas (DatePicker/TimePicker)
├── EditableGuestsCard.tsx    # Dorośli/dzieci/maluchy + capacity validation
├── EditableNotesCard.tsx     # Notatki + termin potwierdzenia
└── index.ts                  # Barrel export
```

### Kluczowe decyzje

| Decyzja | Uzasadnienie |
|---|---|
| `EditableCard` jako generyczny wrapper | DRY — wspólna logika edit/view/save/cancel/reason dla 5 kart |
| Wymagany powód zmiany (min 10 znaków) | Audit trail — każda zmiana jest udokumentowana |
| AlertDialog dla niebezpiecznych operacji | UX — anulowanie rezerwacji wymaga potwierdzenia |
| `useCheckAvailability` w EditableHallCard | Bezpieczeństwo — stary modal nie sprawdzał kolizji! |
| DatePicker/TimePicker zamiast datetime-local | Spójność z create form + lepszy UX |
| Usunięcie Edit button z listy rezerwacji | Zbędny duplikat — Eye button prowadzi do tej samej strony |

### Schemat EditableCard

```
[View Mode]  ── klik ołówka ──▶  [Edit Mode]
  │                                    │
  │                              Formularz edycji
  │                              + pole "Powód zmiany"
  │                                    │
  │                         ┌─────────┴────────┐
  │                         │                   │
  │                    [Anuluj]            [Zapisz]
  │                         │                   │
  ◀─────────────────────┘          PATCH /api/reservations/:id
                                                 │
                                           refetch() + toast
```

## Usunięte pliki

| Plik | Rozmiar | Linie |
|---|---|---|
| `edit-reservation-modal.tsx` | 42 KB | 1044 |
| `reservation-details-modal.tsx` | 22 KB | 511 |
| **Razem** | **64 KB** | **~1600** |

## Zmiany w `reservations-list.tsx`

- Usunięto importy: `ReservationDetailsModal`, `EditReservationModal`
- Usunięto stan: `selectedReservationId`, `editingReservationId`
- Usunięto funkcje: `handleEdit`, `handleEditSuccess`
- Usunięto renderowanie modali
- Usunięto przycisk Edit (ołówek) — Eye button prowadzi do strony z inline editing
- Usunięto import `Edit` z lucide-react

## Ulepszenia vs. stary modal

- 🆕 Sprawdzenie dostępności sali (`useCheckAvailability`)
- 🆕 DatePicker + TimePicker zamiast `datetime-local`
- 🆕 Warunkowe pola per event type (urodziny/rocznica)
- 🆕 Kalkulator dodatkowych godzin z ceną
- 🆕 Wymagany powód każdej zmiany (min 10 znaków)
- 🆕 Potwierdzenie niebezpiecznych operacji (AlertDialog)
- 🆕 Animacje framer-motion przy przełączaniu view/edit
- 🆕 Poprawione kodowanie polskich znaków (UTF-8)

## Co pozostało do rozważenia

- [ ] Szablon → Pakiet flow (2-poziomowy wybór jak w create) — osobne zadanie
- [ ] Backend audit log — weryfikacja czy pole `reason` jest logowane w `reservation_history`
- [ ] Testy E2E dla inline editing

## Commity

1. `feat: add inline editable components for reservation details` — nowe komponenty
2. `fix: Polish character encoding in editable components (UTF-8)` — kodowanie
3. `refactor: remove edit/details modals, cleanup reservations-list` — cleanup
4. `chore: delete edit-reservation-modal.tsx` — usunięcie 42KB
5. `chore: delete reservation-details-modal.tsx` — usunięcie 22KB
6. `fix: remove redundant Edit button from reservations list` — ostatni cleanup
