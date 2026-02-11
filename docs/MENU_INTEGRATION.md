# 🍽️ MENU INTEGRATION - Dokumentacja

## Przegląd zmian

Integracja systemu menu z rezerwacjami, umożliwiająca:
- Wybór pakietu menu bezpośrednio przy tworzeniu rezerwacji
- Automatyczne pobieranie cen z wybranego pakietu
- Opcjonalne dodawanie dodatków do pakietu (MenuOptions)
- Edycję menu w istniejącej rezerwacji
- Ręczne wprowadzanie cen gdy pakiet nie jest wybrany

---

## Główne zmiany

### 1. Liczba osób ZAWSZE wymagana

**Przed:**
```typescript
// Liczba osób opcjonalna, można podać tylko cenę
{
  pricePerAdult: 150,
  pricePerChild: 75,
  guests: 50 // Obliczone ręcznie
}
```

**Teraz:**
```typescript
// Liczba osób w 3 grupach ZAWSZE wymagana
{
  adults: 40,      // REQUIRED
  children: 8,     // REQUIRED (może być 0)
  toddlers: 2,     // REQUIRED (może być 0)
  // guests obliczone automatycznie: 50
}
```

### 2. Wybór pakietu menu (OPCJONALNY)

**Scenariusz A: Z pakietem menu**
```typescript
{
  adults: 40,
  children: 8,
  toddlers: 2,
  menuPackageId: "uuid-pakietu",
  selectedOptions: [ // Opcjonalne dodatki
    { optionId: "uuid-opcji-1", quantity: 1 },
    { optionId: "uuid-opcji-2", quantity: 2 }
  ]
  // Ceny pobierane automatycznie z pakietu!
  // pricePerAdult, pricePerChild, pricePerToddler - NIE PODAJEMY
}
```

**Scenariusz B: Bez pakietu (ceny ręczne)**
```typescript
{
  adults: 40,
  children: 8,
  toddlers: 2,
  pricePerAdult: 150,   // REQUIRED gdy brak menuPackageId
  pricePerChild: 75,    // REQUIRED gdy brak menuPackageId
  pricePerToddler: 0    // Opcjonalne, domyślnie 0
}
```

---

## API Endpoints

### Tworzenie rezerwacji z menu

**POST /api/reservations**

```json
{
  "hallId": "uuid",
  "clientId": "uuid",
  "eventTypeId": "uuid",
  "startDateTime": "2026-03-15T14:00:00Z",
  "endDateTime": "2026-03-15T22:00:00Z",
  
  // ┌───────────────────────────────────────────────────────────
  // Liczba osób - ZAWSZE WYMAGANE
  // └───────────────────────────────────────────────────────────
  "adults": 50,
  "children": 10,
  "toddlers": 2,
  
  // ┌───────────────────────────────────────────────────────────
  // OPCJA 1: Z pakietem menu
  // └───────────────────────────────────────────────────────────
  "menuPackageId": "550e8400-e29b-41d4-a716-446655440001",
  "selectedOptions": [
    {
      "optionId": "550e8400-e29b-41d4-a716-446655440002",
      "quantity": 1
    }
  ],
  
  // ┌───────────────────────────────────────────────────────────
  // LUB OPCJA 2: Bez pakietu (ceny ręczne)
  // └───────────────────────────────────────────────────────────
  // "pricePerAdult": 150,
  // "pricePerChild": 75,
  // "pricePerToddler": 0,
  
  "notes": "Uwagi do rezerwacji"
}
```

**Odpowiedź:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "adults": 50,
    "children": 10,
    "toddlers": 2,
    "guests": 62,
    "pricePerAdult": 150.00,
    "pricePerChild": 75.00,
    "pricePerToddler": 0.00,
    "totalPrice": 8250.00,
    "menuSnapshot": { // Jeśli wybrano pakiet
      "packageName": "Pakiet Premium",
      "packagePrice": 8250.00,
      "optionsPrice": 0.00,
      "totalMenuPrice": 8250.00
    }
  },
  "message": "Reservation created successfully with menu package"
}
```

### Edycja menu w istniejącej rezerwacji

**PUT /api/reservations/:id/menu**

```json
{
  "packageId": "uuid-nowego-pakietu",
  "selectedOptions": [
    { "optionId": "uuid", "quantity": 1 }
  ],
  "adultsCount": 50,      // Opcjonalne - nadpisz liczbę z rezerwacji
  "childrenCount": 10,    // Opcjonalne
  "toddlersCount": 2      // Opcjonalne
}
```

**Usunięcie menu:**
```json
{
  "packageId": null  // Usuwa menu z rezerwacji
}
```

---

## Walidacje

### Backend (reservation.service.ts)

1. **Liczba osób:**
   - `adults`, `children`, `toddlers` - wszystkie wymagane (mogą być 0)
   - Suma musi być > 0 (przynajmniej 1 osoba)
   - Suma nie może przekroczyć pojemności sali

2. **Pakiet menu:**
   - Jeśli `menuPackageId` podany:
     - Pakiet musi istnieć w bazie
     - Liczba gości musi być w zakresie `minGuests` - `maxGuests` (jeśli zdefiniowane)
     - Ceny pobierane automatycznie z pakietu
   - Jeśli `menuPackageId` NIE podany:
     - `pricePerAdult` i `pricePerChild` są WYMAGANE
     - `pricePerToddler` opcjonalne (domyślnie 0)

3. **Opcje dodatkowe:**
   - Każda opcja musi należeć do wybranego pakietu
   - Walidacja `allowMultiple` i `maxQuantity`
   - Cena opcji może być nadpisana przez `customPrice` w relacji package-option

4. **Nie można:**
   - Podać jednocześnie `menuPackageId` i ręcznych cen
   - Edytować menu w rezerwacji COMPLETED lub CANCELLED

---

## Struktura danych

### CreateReservationDTO

```typescript
interface CreateReservationDTO {
  hallId: string;
  clientId: string;
  eventTypeId: string;
  startDateTime: string;
  endDateTime: string;
  
  // ZAWSZE WYMAGANE
  adults: number;
  children: number;
  toddlers: number;
  
  // MENU (opcjonalne)
  menuPackageId?: string;
  selectedOptions?: MenuOptionSelection[];
  
  // CENY (wymagane jeśli brak menuPackageId)
  pricePerAdult?: number;
  pricePerChild?: number;
  pricePerToddler?: number;
  
  // Reszta pól...
}
```

### MenuOptionSelection

```typescript
interface MenuOptionSelection {
  optionId: string;
  quantity?: number; // Domyślnie 1
}
```

### ReservationMenuSnapshot (automatycznie tworzony)

```typescript
interface ReservationMenuSnapshot {
  id: string;
  reservationId: string;
  menuTemplateId: string;
  packageId: string;
  
  menuData: Json; // Snapshot danych menu
  
  packagePrice: Decimal;      // Cena pakietu (adults + children + toddlers × ceny)
  optionsPrice: Decimal;      // Suma cen wybranych opcji
  totalMenuPrice: Decimal;    // packagePrice + optionsPrice
  
  adultsCount: number;
  childrenCount: number;
  toddlersCount: number;
  
  selectedAt: DateTime;
  updatedAt: DateTime;
}
```

---

## Przepływ danych

### Tworzenie rezerwacji Z pakietem

```
1. Frontend → POST /api/reservations
   {
     adults: 50, children: 10, toddlers: 2,
     menuPackageId: "uuid",
     selectedOptions: [...]
   }

2. Backend:
   a) Pobiera MenuPackage z bazy
   b) Waliduje min/max guests
   c) Pobiera ceny: pricePerAdult, pricePerChild, pricePerToddler
   d) Przetwarza selectedOptions (walidacja + oblicza optionsPrice)
   e) Oblicza totalPrice = packagePrice + optionsPrice
   f) Tworzy Reservation
   g) Tworzy ReservationMenuSnapshot (automatycznie!)

3. Response → Rezerwacja z pełnymi danymi menu
```

### Tworzenie rezerwacji BEZ pakietu

```
1. Frontend → POST /api/reservations
   {
     adults: 50, children: 10, toddlers: 2,
     pricePerAdult: 150,
     pricePerChild: 75
   }

2. Backend:
   a) Waliduje że podano ceny (bo brak menuPackageId)
   b) Oblicza totalPrice
   c) Tworzy Reservation
   d) NIE tworzy MenuSnapshot (bo nie wybrano pakietu)

3. Response → Rezerwacja z cenami ręcznymi
```

### Edycja menu w rezerwacji

```
1. Frontend → PUT /api/reservations/:id/menu
   { packageId: "new-uuid", selectedOptions: [...] }

2. Backend:
   a) Pobiera istniejącą rezerwację
   b) Waliduje status (nie COMPLETED/CANCELLED)
   c) Pobiera nowy pakiet
   d) Waliduje min/max guests
   e) Przetwarza opcje
   f) Aktualizuje/tworzy MenuSnapshot
   g) Aktualizuje ceny w Reservation
   h) Tworzy wpis w ReservationHistory

3. Response → Zaktualizowana rezerwacja z nowym menu
```

---

## Testy

### Scenariusze testowe

✅ **Test 1: Rezerwacja z pakietem menu**
- Podaj adults, children, toddlers, menuPackageId
- Sprawdź czy ceny pobrane z pakietu
- Sprawdź czy utworzono MenuSnapshot

✅ **Test 2: Rezerwacja bez pakietu**
- Podaj adults, children, toddlers, ceny ręczne
- Sprawdź czy totalPrice obliczone poprawnie
- Sprawdź czy NIE utworzono MenuSnapshot

✅ **Test 3: Walidacja liczby osób**
- Brak adults → błąd
- adults=0, children=0, toddlers=0 → błąd
- adults=100, capacity=50 → błąd

✅ **Test 4: Walidacja pakietu**
- menuPackageId + ceny ręczne → błąd
- Nieistniejący pakiet → błąd
- Liczba gości poza min/max → błąd

✅ **Test 5: Edycja menu**
- Zmiana pakietu → nowe ceny
- Usunięcie pakietu (null) → usuwa MenuSnapshot
- Edycja w COMPLETED → błąd

✅ **Test 6: Opcje dodatkowe**
- Opcja spoza pakietu → błąd
- Przekroczenie maxQuantity → błąd
- allowMultiple=false, quantity>1 → błąd

---

## Migracja istniejących danych

Dla starych rezerwacji bez podziału na grupy wiekowe:

```sql
-- Przenieś guests do adults
UPDATE "Reservation"
SET adults = guests, children = 0, toddlers = 0
WHERE adults = 0 AND children = 0 AND toddlers = 0 AND guests > 0;
```

---

## Kompatybilność wsteczna

✅ **Zachowana:**
- Pole `guests` nadal istnieje (obliczane automatycznie)
- Legacy pola `date`, `startTime`, `endTime` działają
- Rezerwacje bez menu działają normalnie
- Istniejące API endpoints bez zmian

⚠️ **Wymagane aktualizacje:**
- Frontend musi teraz wysyłać `adults`, `children`, `toddlers`
- Frontend może opcjonalnie dodać `menuPackageId`

---

## Frontend - propozycje zmian

### Formularz rezerwacji

```tsx
// 1. Sekcja liczby osób - ZAWSZE WIDOCZNA
<div>
  <h3>Liczba gości *</h3>
  <Input label="Dorośli" name="adults" type="number" required />
  <Input label="Dzieci (4-12 lat)" name="children" type="number" required />
  <Input label="Maluchy (0-3 lata)" name="toddlers" type="number" required />
  <p>Razem: {adults + children + toddlers} gości</p>
</div>

// 2. Sekcja menu - OPCJONALNA
<div>
  <h3>Menu (opcjonalne)</h3>
  <Toggle 
    label="Wybierz pakiet menu" 
    checked={useMenuPackage}
    onChange={setUseMenuPackage}
  />
  
  {useMenuPackage ? (
    <>
      <Select 
        label="Pakiet menu"
        options={menuPackages}
        value={menuPackageId}
        onChange={setMenuPackageId}
      />
      
      {selectedPackage && (
        <div className="price-preview">
          <p>Dorośli: {adults} × {selectedPackage.pricePerAdult} zł</p>
          <p>Dzieci: {children} × {selectedPackage.pricePerChild} zł</p>
          <p>Maluchy: {toddlers} × {selectedPackage.pricePerToddler} zł</p>
          <hr />
          <p><strong>Razem: {totalPrice} zł</strong></p>
        </div>
      )}
      
      {/* Opcjonalne dodatki */}
      <MenuOptionsSelector
        packageId={menuPackageId}
        selected={selectedOptions}
        onChange={setSelectedOptions}
      />
    </>
  ) : (
    <>
      <Input label="Cena za dorosłego *" name="pricePerAdult" type="number" required />
      <Input label="Cena za dziecko *" name="pricePerChild" type="number" required />
      <Input label="Cena za malucha" name="pricePerToddler" type="number" />
    </>
  )}
</div>
```

### Walidacja formularza

```typescript
const validate = (formData) => {
  // Liczba osób
  if (!formData.adults && !formData.children && !formData.toddlers) {
    return { error: 'Podaj liczbę gości' };
  }
  
  if (formData.adults === 0 && formData.children === 0 && formData.toddlers === 0) {
    return { error: 'Wymagany przynajmniej 1 gość' };
  }
  
  // Menu lub ceny
  if (!formData.menuPackageId) {
    if (!formData.pricePerAdult || !formData.pricePerChild) {
      return { error: 'Podaj ceny lub wybierz pakiet menu' };
    }
  }
  
  return { valid: true };
};
```

---

## Changelog

### [2.0.0] - 2026-02-11

#### Added
- ✅ Integracja menu z rezerwacjami
- ✅ Automatyczne pobieranie cen z pakietu menu
- ✅ Obsługa opcji dodatkowych (MenuOptions)
- ✅ Endpoint `PUT /api/reservations/:id/menu` do edycji menu
- ✅ Typ `UpdateReservationMenuDTO`
- ✅ Typ `MenuOptionSelection`
- ✅ Metoda `updateReservationMenu()` w reservation.service
- ✅ Automatyczne tworzenie `ReservationMenuSnapshot`

#### Changed
- ⚠️ **BREAKING:** `adults`, `children`, `toddlers` teraz WYMAGANE w `CreateReservationDTO`
- ⚠️ **BREAKING:** `pricePerAdult`, `pricePerChild` wymagane gdy brak `menuPackageId`
- ✅ Zaktualizowane walidacje w reservation.controller
- ✅ Zaktualizowane walidacje w reservation.service

#### Deprecated
- Pole `guests` - nadal działa, ale zaleca się używać `adults`, `children`, `toddlers`

---

## Pytania i odpowiedzi

**Q: Czy mogę utworzyć rezerwację bez menu?**
A: Tak! Wystarczy podać liczby osób i ceny ręczne (`pricePerAdult`, `pricePerChild`).

**Q: Czy mogę zmienić menu w istniejącej rezerwacji?**
A: Tak, użyj `PUT /api/reservations/:id/menu`.

**Q: Czy mogę usunąć menu z rezerwacji?**
A: Tak, wyślij `{ packageId: null }` do endpointu menu.

**Q: Co jeśli pakiet zostanie usunięty po utworzeniu rezerwacji?**
A: Rezerwacja zachowuje `ReservationMenuSnapshot` - niezmienny snapshot danych menu.

**Q: Czy liczba osób w menu musi być taka sama jak w rezerwacji?**
A: Domyślnie tak, ale można nadpisać przez `adultsCount`, `childrenCount`, `toddlersCount` w endpoincie menu.

**Q: Jak obliczane są ceny opcji dodatkowych?**
A: Zależy od `priceType`:
- `PER_PERSON`: cena × liczba gości × quantity
- `FIXED`: cena × quantity

---

## Kontakt

W razie pytań lub problemów, sprawdź kod w:
- `apps/backend/src/services/reservation.service.ts`
- `apps/backend/src/types/reservation.types.ts`
- `apps/backend/src/controllers/reservation.controller.ts`
