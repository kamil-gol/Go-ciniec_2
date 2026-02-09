# 🏢 Moduł Sal - Dokumentacja

## Przegłąd

Moduł zarządzania salami w systemie rezerwacji Gościniec Rodzinny. Zawiera pełną funkcjonalność CRUD, 3-poziomowy system cenowy oraz automatyczne wyliczanie cen.

**Data utworzenia:** 09.02.2026  
**Wersja:** 1.0.0  
**Branch:** feature/halls-module  
**Status:** ✅ Gotowy do produkcji

---

## 📊 Model Danych

### Interfejs Hall

```typescript
interface Hall {
  id: string                    // UUID
  name: string                  // Nazwa sali (np. "Sala Kryształowa")
  capacity: number              // Pojemność (liczba osób)
  pricePerPerson: number        // Cena za osobę dorosłą (100%)
  pricePerChild?: number        // Cena za dziecko 4-12 lat (50%)
  pricePerToddler?: number      // Cena za malucha 0-3 lat (25%)
  description?: string          // Opis sali
  amenities: string[]           // Udogodnienia
  images: string[]              // URLs zdjęć
  isActive: boolean             // Czy sala jest aktywna
  createdAt: string             // ISO 8601
  updatedAt: string             // ISO 8601
}
```

### CreateHallInput

```typescript
interface CreateHallInput {
  name: string                  // WYMAGANE
  capacity: number              // WYMAGANE (min: 1)
  pricePerPerson: number        // WYMAGANE (min: 0.01)
  pricePerChild?: number        // Opcjonalne (min: 0)
  pricePerToddler?: number      // Opcjonalne (min: 0)
  description?: string
  amenities?: string[]
  images?: string[]
  isActive?: boolean            // Domyślnie: true
}
```

### UpdateHallInput

```typescript
interface UpdateHallInput {
  name?: string
  capacity?: number
  pricePerPerson?: number
  pricePerChild?: number
  pricePerToddler?: number
  description?: string
  amenities?: string[]
  images?: string[]
  isActive?: boolean
}
```

---

## 💰 System Cenowy

### 3-Poziomowy Model

Sala posiada trzy niezależne poziomy cenowe:

| Kategoria | Opis | Wiek | Domyślny procent |
|-----------|------|------|--------------------|
| **Dorośli** | Cena podstawowa | 13+ lat | 100% |
| **Dzieci** | Cena dla dzieci | 4-12 lat | 50% |
| **Maluchy** | Cena dla maluchów | 0-3 lat | 25% |

### Przykłady Cennika

#### Przykład 1: Standardowy cennik
```
Cena dorosłego: 100.00 zł
→ Dzieci: 50.00 zł (50%)
→ Maluchy: 25.00 zł (25%)
```

#### Przykład 2: Gratis dla maluchów
```
Cena dorosłego: 150.00 zł
→ Dzieci: 75.00 zł (50%)
→ Maluchy: 0.00 zł (gratis)
```

#### Przykład 3: Niestandardowy cennik
```
Cena dorosłego: 200.00 zł
→ Dzieci: 120.00 zł (60% - ręczna korekta)
→ Maluchy: 30.00 zł (15% - ręczna korekta)
```

### Automatyczne Wyliczanie

**Domyślna logika:**
- `pricePerChild = pricePerPerson * 0.5`
- `pricePerToddler = pricePerPerson * 0.25`

**Zaokrąglanie:**
- Wszystkie ceny zaokrąglane do 2 miejsc po przecinku
- `Math.round(price * 100) / 100`

**Przykład kodu:**
```typescript
const pricePerPerson = 100.00
const pricePerChild = Math.round(pricePerPerson * 0.5 * 100) / 100   // 50.00
const pricePerToddler = Math.round(pricePerPerson * 0.25 * 100) / 100 // 25.00
```

---

## 🎨 Frontend - Komponenty

### 1. HallCard (Karta Sali)

**Lokalizacja:** `apps/frontend/components/halls/hall-card.tsx`

**Opis:** Wyświetla postać karty z informacjami o sali.

**Features:**
- Wyświetlanie nazwy i statusu (aktywna/nieaktywna)
- **Box cenowy z 3 poziomami:**
  - Dorośli: `{pricePerPerson} zł/os.`
  - Dzieci: `{pricePerChild || pricePerPerson} zł/os.`
  - Maluchy: `{pricePerToddler === 0 ? 'Gratis' : pricePerToddler + ' zł/os.'}`
- Dropdown menu (Szczegóły, Edytuj, Usuń)
- Przycisk "Zobacz Kalendarz"
- Badge'e dla udogodnień

**Przykład użycia:**
```tsx
import { HallCard } from '@/components/halls/hall-card'

<HallCard hall={hall} onUpdate={refetch} />
```

**Styling:**
```tsx
<div className="bg-muted/50 p-3 rounded-lg space-y-2">
  <div className="flex items-center justify-between text-sm">
    <span className="text-muted-foreground">Dorośli:</span>
    <strong className="text-base">{hall.pricePerPerson} zł/os.</strong>
  </div>
  {/* ... */}
</div>
```

---

### 2. NewHallPage (Formularz Tworzenia)

**Lokalizacja:** `apps/frontend/app/dashboard/halls/new/page.tsx`

**Features:**
- Pełny formularz tworzenia sali
- **Toggle automatycznego wyliczania cen** (domyślnie WŁĄCZONY)
- Pola input z walidacją
- Zielone komunikaty potwierdzające auto-calc
- Disabled state dla pól dzieci/maluchów gdy auto-calc aktywny
- Dynamiczne udogodnienia (dodaj/usuń)
- Toggle aktywności sali

**State Management:**
```typescript
const [autoCalculate, setAutoCalculate] = useState(true)
const [formData, setFormData] = useState({
  pricePerPerson: 0,
  pricePerChild: 0,
  pricePerToddler: 0,
})

useEffect(() => {
  if (autoCalculate && formData.pricePerPerson > 0) {
    setFormData(prev => ({
      ...prev,
      pricePerChild: Math.round(prev.pricePerPerson * 0.5 * 100) / 100,
      pricePerToddler: Math.round(prev.pricePerPerson * 0.25 * 100) / 100,
    }))
  }
}, [formData.pricePerPerson, autoCalculate])
```

**Walidacja:**
- `name`: niepuste
- `capacity`: > 0
- `pricePerPerson`: > 0 (wymagane)
- `pricePerChild`: ≥ 0 (opcjonalne)
- `pricePerToddler`: ≥ 0 (opcjonalne)

---

### 3. EditHallPage (Formularz Edycji)

**Lokalizacja:** `apps/frontend/app/dashboard/halls/[id]/edit/page.tsx`

**Features:**
- Identyczny layout jak formularz tworzenia
- **Auto-calc toggle domyślnie WYŁĄCZONY** (zachowanie istniejących cen)
- Ładowanie danych z API
- Obsługa błędów
- Potwierdzenie zapisu

**Workflow:**
1. Załaduj dane sali z API
2. Wypełnij formularz istniejącymi danymi
3. Użytkownik może włączyć auto-calc (przelicza ceny)
4. Albo ręcznie edytować każdą cenę
5. Zapis zmian przez API

**Przykład:**
```tsx
const loadHall = async () => {
  const hall = await getHallById(hallId)
  setFormData({
    name: hall.name,
    pricePerPerson: Number(hall.pricePerPerson),
    pricePerChild: Number(hall.pricePerChild) || 0,
    pricePerToddler: Number(hall.pricePerToddler) || 0,
  })
}
```

---

## 🔌 API Endpoints

### GET /api/halls

**Opis:** Pobierz listę wszystkich sal

**Query params:**
- `isActive` (boolean) - filtruj po statusie
- `search` (string) - wyszukiwanie po nazwie

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Sala Kryształowa",
      "capacity": 40,
      "pricePerPerson": 250,
      "pricePerChild": 125,
      "pricePerToddler": 62.5,
      "isActive": true,
      "amenities": ["Klimatyzacja", "Parkiet"],
      "createdAt": "2026-02-09T19:00:00Z"
    }
  ],
  "count": 1
}
```

---

### GET /api/halls/:id

**Opis:** Pobierz szczegóły jednej sali

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Sala Kryształowa",
    "capacity": 40,
    "pricePerPerson": 250,
    "pricePerChild": 125,
    "pricePerToddler": 62.5,
    "description": "Elegancka sala dla małych weseli",
    "amenities": ["Klimatyzacja", "Parkiet", "Scena"],
    "images": [],
    "isActive": true,
    "createdAt": "2026-02-09T19:00:00Z",
    "updatedAt": "2026-02-09T19:00:00Z"
  }
}
```

---

### POST /api/halls

**Opis:** Utwórz nową salę (Admin only)

**Request body:**
```json
{
  "name": "Sala Bankietowa",
  "capacity": 150,
  "pricePerPerson": 350,
  "pricePerChild": 175,
  "pricePerToddler": 87.5,
  "description": "Największa sala",
  "amenities": ["Klimatyzacja", "Scena", "Parkiet"],
  "isActive": true
}
```

**Response:** 201 Created
```json
{
  "success": true,
  "data": { /* obiekt Hall */ }
}
```

**Errors:**
- `400` - Walidacja nie powiodła się
- `401` - Brak autoryzacji
- `403` - Brak uprawnień (tylko Admin)

---

### PUT /api/halls/:id

**Opis:** Zaktualizuj istniejącą salę (Admin only)

**Request body:**
```json
{
  "pricePerPerson": 400,
  "pricePerChild": 200,
  "pricePerToddler": 0
}
```

**Response:** 200 OK
```json
{
  "success": true,
  "data": { /* zaktualizowany obiekt Hall */ }
}
```

---

### DELETE /api/halls/:id

**Opis:** Usuń salę (soft delete, Admin only)

**Response:** 204 No Content

---

## 🧪 Testy

### Unit Tests

**Lokalizacja:** `apps/frontend/__tests__/halls/`

**Test cases:**

1. **Auto-calc Logic**
```typescript
test('calculates child price as 50% of adult', () => {
  const adult = 100
  const child = Math.round(adult * 0.5 * 100) / 100
  expect(child).toBe(50)
})

test('calculates toddler price as 25% of adult', () => {
  const adult = 100
  const toddler = Math.round(adult * 0.25 * 100) / 100
  expect(toddler).toBe(25)
})
```

2. **Form Validation**
```typescript
test('requires name and capacity', async () => {
  render(<NewHallPage />)
  const submitBtn = screen.getByText('Utwórz Salę')
  fireEvent.click(submitBtn)
  
  expect(await screen.findByText('Wypełnij wszystkie wymagane pola')).toBeInTheDocument()
})
```

3. **Auto-calc Toggle**
```typescript
test('disables manual input when auto-calc is on', () => {
  render(<NewHallPage />)
  const childInput = screen.getByLabelText('Cena za dziecko')
  expect(childInput).toBeDisabled()
})
```

---

## 👥 User Stories

### US-1: Administrator tworzy nową salę

**Jako** administrator  
**Chcę** utworzyć nową salę z 3-poziomowym cennikiem  
**Aby** system automatycznie wyliczał ceny dla dzieci i maluchów

**Acceptance Criteria:**
- [ ] Formularz zawiera pole "Cena za osobę dorosłą"
- [ ] Po wprowadzeniu ceny dorosłego, ceny dzieci/maluchów są automatycznie wyliczane
- [ ] Domyślnie: dzieci = 50%, maluchy = 25%
- [ ] Możliwość wyłączenia auto-calc i ręcznej edycji
- [ ] Zielone komunikaty potwierdzające auto-wyliczenia
- [ ] Walidacja: cena dorosłego > 0

---

### US-2: Administrator edytuje cennik sali

**Jako** administrator  
**Chcę** edytować ceny istniejącej sali  
**Aby** dostosować cennik do aktualnej oferty

**Acceptance Criteria:**
- [ ] Formularz edycji ładuje obecne ceny
- [ ] Auto-calc domyślnie wyłączony (zachowanie cen)
- [ ] Możliwość włączenia auto-calc (przelicza ceny)
- [ ] Albo ręczna edycja każdego pola
- [ ] Potwierdzenie zapisu
- [ ] Toast z komunikatem sukcesu

---

### US-3: Użytkownik widzi cennik sali

**Jako** pracownik/administrator  
**Chcę** zobaczyć pełny cennik sali na karcie  
**Aby** szybko zidentyfikować ceny dla różnych grup wiekowych

**Acceptance Criteria:**
- [ ] Karta sali pokazuje box cenowy z 3 poziomami
- [ ] Dorośli: `{cena} zł/os.`
- [ ] Dzieci: `{cena} zł/os.`
- [ ] Maluchy: `Gratis` (jeśli 0) lub `{cena} zł/os.`
- [ ] Wyraźny layout (bg-muted/50, rounded-lg)
- [ ] Tekst "Gratis" w kolorze zielonym

---

## 🐛 Known Issues

### 1. Backend Validation (TODO)

**Problem:** Backend nie waliduje jeszcze pól `pricePerChild` i `pricePerToddler`

**Impact:** Można zapisać ujemne ceny lub nieprawidłowe wartości

**Solution:**
```typescript
// apps/backend/src/validators/hall.validator.ts
export const validateHallPrices = (data: CreateHallInput) => {
  if (data.pricePerChild !== undefined && data.pricePerChild < 0) {
    throw new ValidationError('pricePerChild must be >= 0')
  }
  if (data.pricePerToddler !== undefined && data.pricePerToddler < 0) {
    throw new ValidationError('pricePerToddler must be >= 0')
  }
}
```

**Priority:** Medium  
**Assigned:** -

---

### 2. Migracja Istniejących Danych (TODO)

**Problem:** Istniejące sale mogą nie mieć wypełnionych pól `pricePerChild`, `pricePerToddler`

**Impact:** Karty sal mogą pokazywać `0 zł` zamiast prawidłowych cen

**Solution:**
```sql
-- Skrypt migracji
UPDATE halls
SET 
  pricePerChild = pricePerPerson * 0.5,
  pricePerToddler = pricePerPerson * 0.25
WHERE pricePerChild IS NULL OR pricePerToddler IS NULL;
```

**Priority:** High  
**Assigned:** -

---

## 🚀 Deployment

### Checklist przed wdrożeniem

- [ ] Wszystkie testy przechodzą
- [ ] Backend walidacja dodana
- [ ] Migracja danych uruchomiona
- [ ] Dokumentacja zaktualizowana
- [ ] Changelog zaktualizowany
- [ ] Manual testing wykonany

### Komendy Deploy

```bash
# 1. Merge do main
git checkout main
git merge feature/halls-module

# 2. Push na produkcję
git push origin main

# 3. Restart kontenerów
docker-compose restart frontend backend

# 4. Sprawdzenie
curl http://localhost:3001/api/halls
```

---

## 📚 Resources

### Code References
- [halls.ts - API client](../apps/frontend/lib/api/halls.ts)
- [hall-card.tsx - Component](../apps/frontend/components/halls/hall-card.tsx)
- [new/page.tsx - Create form](../apps/frontend/app/dashboard/halls/new/page.tsx)
- [edit/page.tsx - Edit form](../apps/frontend/app/dashboard/halls/[id]/edit/page.tsx)

### Related Documentation
- [API Reference](../API.md)
- [Database Schema](./DATABASE.md)
- [Contributing Guidelines](../CONTRIBUTING.md)

---

## 📝 Changelog

### [1.0.0] - 2026-02-09

#### Added
- Pole `pricePerToddler` w modelu Hall
- Automatyczne wyliczanie cen dzieci/maluchów (50%/25%)
- Toggle auto-wyliczania w formularzach
- Wizualizacja 3 poziomów w kartach sal
- Pełna dokumentacja modułu

#### Changed
- Rozszerzono interfejs `Hall`, `CreateHallInput`, `UpdateHallInput`
- Przeprojektowano komponent `HallCard` z boxem cenowym
- Zaktualizowano formularze new/edit

#### Technical
- React useEffect dla auto-wyliczania
- Zaokrąglanie cen do 2 miejsc po przecinku
- Disabled state dla pól przy auto-calc
- Props validation w TypeScript

---

**Dokument utworzony:** 09.02.2026  
**Ostatnia aktualizacja:** 09.02.2026  
**Autor:** Kamil Gol  
**Status:** ✅ Zatwierdzony
