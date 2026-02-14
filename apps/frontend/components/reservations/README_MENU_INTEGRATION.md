# Menu Integration with Reservations

Kompletny przewodnik integracji menu z systemem rezerwacji.

---

## Przeglad

Menu integration pozwala na:
- Wybor szablonow menu dla rezerwacji
- Wybor pakietow z cennikiem (doroslych/dzieci/maluchow)
- Dodawanie opcji dodatkowych (alkohol, muzyka, dekoracje, itp.)
- Automatyczne obliczanie cen na podstawie menu snapshot
- Edycja/aktualizacja wybranego menu
- Podsumowanie finansowe z cenami z menu

---

## Architektura

```
Reservation Details Page
    |
    |-- Client Info
    |-- Hall Info
    |-- Event Details
    |-- Menu Section (ReservationMenuSection)
    |   |-- Package Display (kompaktowy widok)
    |   |-- Dishes Display (inline chips)
    |   |-- Options Display (inline chips)
    |   +-- CRUD Actions (Add/Edit/Delete)
    |-- Notes
    |-- Guests Breakdown
    +-- Financial Summary (ReservationFinancialSummary)
        |-- Koszty uslug (effectiveTotalPrice)
        |   |-- Pakiet gastronomiczny (ceny z menu snapshot)
        |   +-- Opcje dodatkowe (z priceBreakdown)
        |-- Razem do zaplaty
        |-- Stan rozliczen (progress bar)
        +-- Zaliczki (CRUD)
```

---

## Komponenty

### 1. ReservationMenuSection

**Lokalizacja:** `apps/frontend/components/reservations/ReservationMenuSection.tsx`

**Cel:** Wyswietlanie i zarzadzanie menu dla rezerwacji. Kompaktowy widok bez sekcji kosztow (koszty sa w ReservationFinancialSummary).

**Props:**
```typescript
interface ReservationMenuSectionProps {
  reservationId: string
  eventTypeId: string
  eventDate: Date
  adults: number
  children: number
  toddlers: number
  onMenuUpdated?: () => void
}
```

**Widok kompaktowy zawiera:**
- Naglowek z nazwa pakietu + przyciski Zmien/Usun
- Pakiet: jedna linia z cenami (Dor. 200 zl | Dz. 140 zl | Mal. 0 zl)
- Wybrane dania: inline chips pogrupowane po kategoriach (ChefHat icon)
- Opcje dodatkowe: inline chips z cenami

**WAZNE:** Sekcja "Koszt menu" zostala usunieta z tego komponentu - te dane sa wyswietlane w ReservationFinancialSummary aby uniknac duplikacji.

**Uzycie:**
```tsx
import { ReservationMenuSection } from '@/components/reservations/ReservationMenuSection'

<ReservationMenuSection
  reservationId={reservation.id}
  eventTypeId={reservation.eventType.id}
  eventDate={new Date(reservation.startDateTime)}
  adults={reservation.adults || 0}
  children={reservation.children || 0}
  toddlers={reservation.toddlers || 0}
  onMenuUpdated={loadReservation}
/>
```

---

### 2. ReservationFinancialSummary

**Lokalizacja:** `apps/frontend/components/reservations/ReservationFinancialSummary.tsx`

**Cel:** Centralne podsumowanie finansowe rezerwacji z cenami z menu snapshot.

**Props:**
```typescript
interface ReservationFinancialSummaryProps {
  reservationId: string
  adults: number
  children: number
  toddlers: number
  pricePerAdult: number      // fallback gdy brak menu
  pricePerChild: number      // fallback gdy brak menu
  pricePerToddler: number    // fallback gdy brak menu
  totalPrice: number          // fallback gdy brak menu
}
```

**Logika cen (effectivePrice):**
```typescript
// Ceny per osoba - priorytet: menu snapshot > reservation props
const effectivePricePerAdult = hasMenu && priceBreakdown?.packageCost?.adults?.priceEach != null
  ? priceBreakdown.packageCost.adults.priceEach    // np. 200 zl z pakietu
  : pricePerAdult                                   // np. 280 zl z rezerwacji

// Total - priorytet: menu total > reservation total
const effectiveTotalPrice = hasMenu && priceBreakdown?.totalMenuPrice != null
  ? priceBreakdown.totalMenuPrice    // suma pakiet + opcje z menu
  : totalPrice                        // totalPrice z props rezerwacji
```

**Sekcje:**
1. **Koszty uslug** (rozwijane) - pokazuje `effectiveTotalPrice`
   - Pakiet gastronomiczny: ceny z menu snapshot (effectivePricePerAdult/Child/Toddler)
   - Opcje dodatkowe: z `priceBreakdown.optionsCost`
2. **Razem do zaplaty** - zielony banner z `effectiveTotalPrice`
3. **Stan rozliczen** - progress bar (wplacono / effectiveTotalPrice)
4. **Zaliczki** - CRUD z modalami (tworzenie, oplata, PDF, email, anulowanie)

**WAZNE:** Gdy menu jest wybrane, komponent automatycznie pobiera ceny z `priceBreakdown` (menu snapshot) zamiast z propsow rezerwacji. To zapewnia ze "Pakiet gastronomiczny" pokazuje ceny z wybranego pakietu (np. 200 zl) a nie z domyslnego cennika rezerwacji (np. 280 zl).

---

### 3. MenuSelectionFlow

**Lokalizacja:** `apps/frontend/components/menu/MenuSelectionFlow.tsx`

**Cel:** Multi-step wizard do wyboru menu (otwierany w Dialog).

**Kroki:**
1. Wybor szablonu menu
2. Wybor pakietu
3. Wybor dan (z kategoriami i limitami)
4. Dodanie opcji dodatkowych
5. Podsumowanie i potwierdzenie

**Features:**
- Filtrowanie szablonow po typie wydarzenia
- Sprawdzanie dat waznosci
- Obliczanie cen w real-time
- Walidacja przed zapisem
- Dialog nie zamyka sie po kliknieciu poza nim (custom overlay behavior)

---

## Przeplyw danych

### Dodawanie menu

```
User klika "Dodaj menu"
  -> MenuSelectionFlow otwiera sie w Dialog
  -> User wybiera szablon, pakiet, dania, opcje
  -> User potwierdza
  -> POST /api/reservations/:id/select-menu
  -> Backend tworzy menu snapshot
  -> Frontend refetchuje dane
  -> ReservationMenuSection wyswietla kompaktowy widok
  -> ReservationFinancialSummary automatycznie pobiera ceny z menu
```

### Aktualizacja menu

```
User klika "Zmien"
  -> MenuSelectionFlow otwiera sie z obecna selekcja (buildInitialSelection)
  -> User modyfikuje wybor
  -> POST /api/reservations/:id/select-menu (nadpisuje)
  -> Frontend refetchuje
```

### Usuwanie menu

```
User klika ikone kosza
  -> Confirm dialog
  -> DELETE /api/reservations/:id/menu
  -> Frontend refetchuje
  -> Podsumowanie finansowe wraca do cen z propsow rezerwacji
```

---

## Przyklad cen

### Pakiet gastronomiczny (z menu snapshot)

```
Dorosli (40 x 200 zl)     8 000 zl
Dzieci (2 x 140 zl)         280 zl
Maluchy (8)              bezplatnie
------------------------------------
Suma podstawowa           8 280 zl
```

### Opcje dodatkowe

```
Dodatkowe danie glowne (50 x 45 zl)    2 250 zl
Dodatkowa przystawka rybna (50 x 25 zl) 1 250 zl
------------------------------------
Suma opcji                               3 500 zl
```

### Razem

```
========================================
  Razem do zaplaty:        11 780 zl
========================================
```

---

## Stany UI

### Brak menu

```
+----------------------------------------+
|  Menu                                  |
|                                        |
|  [ikona]  Brak wybranego menu          |
|  Dodaj menu do rezerwacji              |
|                                        |
|  [ + Dodaj menu ]                      |
+----------------------------------------+
```

### Menu wybrane (kompaktowy widok)

```
+----------------------------------------+
|  Menu                   [Zmien] [X]    |
|  Tradycyjne                            |
|                                        |
|  Pakiet: Tradycyjne                    |
|  Dor. 200 zl | Dz. 140 zl | Mal. 0 zl |
|  Klasyczne menu komunijne              |
|                                        |
|  Wybrane dania            [17 porcji]  |
|  PRZYSTAWKI                            |
|  [Tatar wolowy] [Carpaccio] [Roladki]  |
|  ZUPY                                  |
|  [Krem z dyni] [Rosol]                 |
|  DANIA GLOWNE                          |
|  [Schab x2] [Losos] [Kurczak]         |
|                                        |
|  Opcje dodatkowe (2)                   |
|  [Dod. danie 45zl] [Przystawka 25zl]  |
+----------------------------------------+
```

### Podsumowanie finansowe

```
+----------------------------------------+
|  Podsumowanie finansowe                |
|                                        |
|  Koszty uslug          11 780 zl  [v]  |
|    Pakiet gastronomiczny               |
|    Dorosli (40 x 200 zl)   8 000 zl   |
|    Dzieci (2 x 140 zl)       280 zl   |
|    Maluchy (8)           bezplatnie    |
|    Suma podstawowa         8 280 zl   |
|                                        |
|    Opcje dodatkowe                     |
|    Dod. danie (50x45zl)   2 250 zl    |
|    Przystawka (50x25zl)   1 250 zl    |
|    Suma opcji              3 500 zl   |
|                                        |
|  [===== Razem do zaplaty 11 780 zl ===]|
|                                        |
|  Stan rozliczen  1000 / 11 780 zl      |
|  [=====>                          ]    |
|  Wplacono (8%) | Brakuje               |
|                                        |
|  Zaliczki (1)                      [v] |
|  [1000 zl - Oplacona]                  |
|  [ + Dodaj zaliczke ]                  |
+----------------------------------------+
```

---

## API Hooks

### useReservationMenu

```typescript
const { data, isLoading, error } = useReservationMenu(reservationId)

// Returns:
{
  snapshot: {
    menuTemplateId: string
    packageId: string
    menuData: {
      packageName: string
      packageDescription: string
      pricePerAdult: number      // cena z pakietu menu
      pricePerChild: number
      pricePerToddler: number
      dishSelections: CategorySelection[]
      selectedOptions: SelectedOption[]
    }
  },
  priceBreakdown: {
    packageCost: {
      adults: { count: number, priceEach: number, total: number }
      children: { count: number, priceEach: number, total: number }
      toddlers: { count: number, priceEach: number, total: number }
      subtotal: number
    },
    optionsCost: {
      option: string
      priceType: 'PER_PERSON' | 'FLAT'
      priceEach: number
      quantity: number
      total: number
    }[],
    optionsSubtotal: number,
    totalMenuPrice: number      // packageCost.subtotal + optionsSubtotal
  }
}
```

### useSelectMenu / useUpdateReservationMenu

```typescript
const selectMutation = useSelectMenu()

await selectMutation.mutateAsync({
  reservationId: 'res_123',
  selection: {
    templateId: 'tpl_456',
    packageId: 'pkg_789',
    selectedOptions: [{ optionId: 'opt_1', quantity: 1 }],
    dishSelections: [{
      categoryId: 'cat_1',
      dishes: [{ dishId: 'dish_1', quantity: 2 }]
    }]
  }
})
```

### useDeleteReservationMenu

```typescript
const deleteMutation = useDeleteReservationMenu()
await deleteMutation.mutateAsync(reservationId)
```

---

## Wazne decyzje projektowe

### 1. Ceny z menu snapshot vs ceny z rezerwacji

Rezerwacja ma wlasne pola `pricePerAdult`, `pricePerChild`, `pricePerToddler`, `totalPrice`.
Gdy menu jest wybrane, **ReservationFinancialSummary** uzywa cen z `priceBreakdown` (menu snapshot) zamiast z propsow rezerwacji:

- `effectivePricePerAdult` = menu snapshot price > reservation prop
- `effectiveTotalPrice` = `priceBreakdown.totalMenuPrice` > `totalPrice` prop

Dziki temu "Pakiet gastronomiczny" zawsze pokazuje ceny zgodne z wybranym pakietem.

### 2. Brak sekcji "Koszt menu" w ReservationMenuSection

Wczesniej ReservationMenuSection mial osobna karte "Koszt menu" z podsumowaniem cen.
Zostala **usunieta** poniewaz te same dane sa w ReservationFinancialSummary.
Unika to duplikacji informacji.

### 3. Kompaktowy widok dan

Dania sa wyswietlane jako **inline chips/tagi** zamiast pelnych kart:
- Pogrupowane po kategoriach (PRZYSTAWKI, ZUPY, DANIA GLOWNE)
- Kazde danie to maly tag z nazwa i iloscia (np. "Schab x2")
- Ikona ChefHat zamiast emoji (unikniecie problemow z Unicode surrogate pairs)

### 4. Dialog nie zamyka sie po kliknieciu poza

MenuSelectionFlow to dlugi wizard - przypadkowe zamkniecie powodowalo utrate selekcji.
Dialog overlay ma wylaczony `onClick` handler.

---

## Pliki

| Plik | Opis |
|------|------|
| `components/reservations/ReservationMenuSection.tsx` | Kompaktowy widok menu (pakiet, dania, opcje) |
| `components/reservations/ReservationFinancialSummary.tsx` | Podsumowanie finansowe (koszty, total, zaliczki) |
| `components/menu/MenuSelectionFlow.tsx` | Wizard wyboru menu (5 krokow) |
| `components/menu/MenuDishesPreview.tsx` | Preview dan (legacy, full-size) |
| `hooks/use-menu.ts` | React Query hooks dla menu API |
| `lib/api/menu-api.ts` | API client dla menu endpoints |
| `lib/api/deposits.ts` | API client dla zaliczek |
| `components/ui/dialog.tsx` | Custom dialog (bez zamykania na overlay) |

---

## Obsluga bledow

1. **Brak aktywnego menu dla typu wydarzenia** - pokazuje pusty stan z przyciskiem "Dodaj menu"
2. **Nieprawidlowa data** - filtruje wygasle szablony
3. **Blad API** - toast notification z opisem bledu
4. **Brak liczby gosci** - domyslnie 0, menu mozna dalej wybrac
5. **Zmiana liczby gosci** - wymaga recznej aktualizacji menu (ceny sa snapshotami)
