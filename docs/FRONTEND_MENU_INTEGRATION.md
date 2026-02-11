# 🍴 Frontend Menu Integration - Przewodnik

## 📝 Wprowadzenie

System integracji menu z frontendem umożliwia:
- Wybieranie gotowych pakietów menu podczas tworzenia rezerwacji
- Automatyczne ustawianie cen na podstawie wybranego pakietu
- Zapisywanie "snapshotu" menu w rezerwacji (ceny nie zmienią się jeśli pakiet zostanie później zmodyfikowany)
- Obsługę 3 grup wiekowych: Dorośli, Dzieci 4-12, Dzieci 0-3

## 📚 Spis treści

- [Architektura](#architektura)
- [Użycie](#użycie)
- [API Reference](#api-reference)
- [Typy TypeScript](#typy-typescript)
- [Komponenty](#komponenty)
- [Testowanie](#testowanie)

---

## 🏛️ Architektura

```
Frontend Flow:

1. User opens Create Reservation Form
   ↓
2. useAllActivePackages() fetches packages from API
   ↓
3. User toggles "Użyj gotowego pakietu"
   ↓
4. User selects package from dropdown
   ↓
5. Form auto-fills prices from package:
   - pricePerAdult
   - pricePerChild
   - pricePerToddler
   ↓
6. User submits form
   ↓
7. POST /reservations with menuPackageId
   ↓
8. Backend creates MenuSnapshot
   ↓
9. Reservation saved with frozen menu prices
```

---

## 🛠️ Użycie

### Podstawowy przepływ użytkownika

1. **Otwórz formularz rezerwacji**
   ```
   Dashboard > Rezerwacje > Nowa Rezerwacja
   ```

2. **Wypełnij podstawowe informacje:**
   - Sala
   - Klient
   - Typ wydarzenia
   - Daty i godziny

3. **Wprowadź liczby gości:**
   - Dorośli (wymagane > 0)
   - Dzieci 4-12 (opcjonalne)
   - Dzieci 0-3 (opcjonalne)

4. **Wybierz pakiet menu:**
   - Włącz checkbox "Użyj gotowego pakietu"
   - Wybierz pakiet z listy rozwijanej
   - Sprawdź podgląd pakietu (nazwa, opis, ceny)

5. **Potwiedź ceny:**
   - Ceny automatycznie się wypełnią z pakietu
   - Całkowita cena przelicza się na bieżąco

6. **Utwórz rezerwację**

---

## 📡 API Reference

### Pobieranie pakietów

```typescript
// Hook
import { useAllActivePackages } from '@/hooks/use-menu-packages'

const { data: packages, isLoading } = useAllActivePackages()

// API Function
import { getAllActivePackages } from '@/lib/api/menu-packages-api'

const packages = await getAllActivePackages()
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Pakiet Premium",
      "shortDescription": "Eleganckie menu 5-daniowe",
      "pricePerAdult": "150.00",
      "pricePerChild": "75.00",
      "pricePerToddler": "37.50",
      "menuTemplate": {
        "id": "uuid",
        "name": "Menu Wesele"
      },
      "packageOptions": [...]
    }
  ]
}
```

### Tworzenie rezerwacji z menu

```typescript
// With menu package
const input: CreateReservationInput = {
  hallId: '...',
  clientId: '...',
  eventTypeId: '...',
  startDateTime: '2026-06-15T16:00:00',
  endDateTime: '2026-06-15T22:00:00',
  adults: 50,
  children: 10,
  toddlers: 5,
  menuPackageId: 'package-uuid',  // 🆕 Prices from package
  // pricePerAdult, pricePerChild, pricePerToddler NOT needed
}

// Without menu package (manual pricing)
const input: CreateReservationInput = {
  hallId: '...',
  clientId: '...',
  eventTypeId: '...',
  startDateTime: '2026-06-15T16:00:00',
  endDateTime: '2026-06-15T22:00:00',
  adults: 50,
  children: 10,
  toddlers: 5,
  pricePerAdult: 120,
  pricePerChild: 60,
  pricePerToddler: 30,
  // menuPackageId NOT provided
}
```

---

## 📝 Typy TypeScript

### MenuPackage

```typescript
interface MenuPackage {
  id: string
  name: string
  description?: string
  menuTemplateId: string
  pricePerAdult: number
  pricePerChild: number
  pricePerToddler: number
  minGuests?: number
  maxGuests?: number
  isActive: boolean
  createdAt: string
  updatedAt: string
  menuTemplate?: {
    id: string
    name: string
  }
}
```

### MenuSnapshot

```typescript
interface MenuSnapshot {
  id: string
  reservationId: string
  menuData: {
    packageName: string
    templateName: string
    pricePerAdult: number
    pricePerChild: number
    pricePerToddler: number
    selectedOptions: Array<{
      name: string
      pricePerUnit: number
      quantity: number
    }>
    packageDescription?: string
  }
  menuTemplateId: string
  packageId: string
  packagePrice: string
  optionsPrice: string
  totalMenuPrice: string
  adultsCount: number
  childrenCount: number
  toddlersCount: number
  selectedAt: string
  updatedAt: string
}
```

### CreateReservationInput

```typescript
interface CreateReservationInput {
  hallId: string
  clientId: string
  eventTypeId: string
  startDateTime: string
  endDateTime: string
  
  // Guest counts - ALL REQUIRED
  adults: number
  children: number
  toddlers: number
  
  // Pricing - CONDITIONAL
  pricePerAdult?: number      // Required if NO menuPackageId
  pricePerChild?: number      // Required if NO menuPackageId
  pricePerToddler?: number    // Required if NO menuPackageId
  
  // Menu Integration
  menuPackageId?: string      // Optional - if provided, prices from package
  selectedOptions?: MenuOptionSelection[]
  
  confirmationDeadline?: string
  notes?: string
  deposit?: {
    amount: number
    dueDate: string
    paid?: boolean
    paymentMethod?: string
    paidAt?: string
  }
}
```

---

## 🧩 Komponenty

### CreateReservationForm

**Location:** `apps/frontend/components/reservations/create-reservation-form.tsx`

**Props:**
```typescript
interface CreateReservationFormProps {
  onSubmit?: (data: any) => void | Promise<void>
  onSuccess?: () => void
  onCancel?: () => void
  initialData?: Partial<ReservationFormData>
  isPromotingFromQueue?: boolean
}
```

**Key Features:**
- ☑️ Menu package toggle
- ☑️ Package selection dropdown
- ☑️ Live price preview
- ☑️ Auto-fill prices from package
- ☑️ Manual pricing fallback
- ☑️ Validation (package XOR manual prices)
- ☑️ Toddlers support (3 age groups)

**Sekcja Menu w formularzu:**
```tsx
<div className="space-y-4 border-t pt-4">
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-2">
      <UtensilsCrossed className="w-5 h-5 text-primary-600" />
      <label>Pakiet Menu</label>
    </div>
    <input
      type="checkbox"
      {...register('useMenuPackage')}
    />
  </div>

  {useMenuPackage && (
    <SelectSimple
      label="Wybierz pakiet"
      options={menuPackageOptions}
      {...register('menuPackageId')}
    />
  )}

  {selectedPackage && (
    <div className="p-4 bg-white rounded-lg">
      <h4>{selectedPackage.name}</h4>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <p>Dorosły</p>
          <p>{formatCurrency(parseFloat(selectedPackage.pricePerAdult))}</p>
        </div>
        {/* ... */}
      </div>
    </div>
  )}
</div>
```

---

## 🧪 Testowanie

### Manual Testing Checklist

#### ✅ Test 1: Rezerwacja z pakietem menu
1. Otwórz formularz nowej rezerwacji
2. Wypełnij: sala, klient, typ wydarzenia, daty
3. Wprowadź liczby gości: adults=50, children=10, toddlers=5
4. Włącz toggle "Użyj gotowego pakietu"
5. Wybierz pakiet z listy
6. **Sprawdź:** Ceny automatycznie się wypełniły
7. **Sprawdź:** Całkowita cena = (50*priceAdult + 10*priceChild + 5*priceToddler)
8. Utwórz rezerwację
9. **Sprawdź:** Rezerwacja zapisana z menuSnapshot

#### ✅ Test 2: Rezerwacja bez pakietu (manual pricing)
1. Otwórz formularz nowej rezerwacji
2. Wypełnij: sala, klient, typ wydarzenia, daty
3. Wprowadź liczby gości: adults=30, children=5, toddlers=2
4. **NIE** włączaj toggle pakietu
5. Ręcznie wprowadź ceny: 120/60/30 PLN
6. **Sprawdź:** Całkowita cena się przelicza
7. Utwórz rezerwację
8. **Sprawdź:** Rezerwacja zapisana BEZ menuSnapshot

#### ✅ Test 3: Walidacja - brak cen
1. Otwórz formularz nowej rezerwacji
2. Wypełnij pola ale:
   - **NIE** wybierz pakietu
   - **NIE** wpisz cen ręcznych
3. Spróbuj wysłać formularz
4. **Sprawdź:** Błąd walidacji: "Cena za dorosłego jest wymagana gdy nie wybrano pakietu menu"

#### ✅ Test 4: Zmiana pakietu
1. Otwórz formularz
2. Włącz toggle pakietu
3. Wybierz "Pakiet Standard" (np. 100 PLN/osoba)
4. **Sprawdź:** Ceny się wypełniły
5. Zmień na "Pakiet Premium" (np. 150 PLN/osoba)
6. **Sprawdź:** Ceny zaktualizowały się do nowego pakietu

#### ✅ Test 5: Toggle pakietu OFF
1. Otwórz formularz
2. Włącz toggle pakietu i wybierz pakiet
3. **Sprawdź:** Ceny wypełnione z pakietu
4. Wyłącz toggle pakietu
5. **Sprawdź:** Ceny nadal są wypełnione (nie resetują się)
6. Można je teraz ręcznie edytować

### Automated Tests (TODO)

```typescript
// Example test
describe('CreateReservationForm - Menu Integration', () => {
  it('should auto-fill prices when menu package selected', async () => {
    const { getByLabelText, getByRole } = render(<CreateReservationForm />)
    
    // Toggle menu package
    const toggle = getByLabelText('Użyj gotowego pakietu')
    fireEvent.click(toggle)
    
    // Select package
    const packageSelect = getByLabelText('Wybierz pakiet')
    fireEvent.change(packageSelect, { target: { value: 'package-1' } })
    
    // Check prices auto-filled
    const priceAdult = getByLabelText('Cena za dorosłego (PLN)')
    expect(priceAdult.value).toBe('150')
  })
})
```

---

## 🐛 Known Issues

### Issue #1: Ceny nie aktualizują się po zmianie pakietu
**Status:** ✅ FIXED  
**Fix:** useEffect z zależnościami `[useMenuPackage, selectedPackage, setValue]`

### Issue #2: Walidacja nie działa dla toddlers
**Status:** ✅ FIXED  
**Fix:** Dodano `toddlers` do schema validation

---

## 📚 Zasoby

- [Backend Menu Integration PR](#)
- [API Documentation](/docs/api/menu.md)
- [Figma Design](https://figma.com/...)
- [User Stories](/docs/user-stories/menu-selection.md)

---

## 👥 Contributors

- [@kamil-gol](https://github.com/kamil-gol) - Implementation
- Perplexity AI - Code assistance

---

## 📝 Changelog

### v1.0.0 (2026-02-11)
- ✅ Initial implementation
- ✅ Menu package selection in reservation form
- ✅ Auto-fill prices from package
- ✅ MenuSnapshot creation on backend
- ✅ Support for 3 age groups (adults, children, toddlers)

### Future (TODO)
- ⏳ Edit menu in existing reservation
- ⏳ Display menu snapshot in reservation details
- ⏳ Select additional options (extras)
- ⏳ Filter packages by event type

---

**Last updated:** 2026-02-11  
**Version:** 1.0.0
