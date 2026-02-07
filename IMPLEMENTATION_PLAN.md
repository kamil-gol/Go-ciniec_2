# Plan Implementacji - Zaawansowany System Rezerwacji

## Podsumowanie Zmian

Implementacja rozszerzonych funkcji systemu rezerwacji zgodnie z wymaganiami:

### 1. ✅ **Data i Godzina Wydarzenia**
- **Status**: Częściowo zaimplementowane (typy zaktualizowane)
- **Zmiany**:
  - `startDateTime` - pełna data i godzina rozpoczęcia  
  - `endDateTime` - pełna data i godzina zakończenia
  - Automatyczne obliczanie czasu trwania
- **TODO**: 
  - [ ] Aktualizacja formularza create-reservation-form.tsx
  - [ ] Aktualizacja formularza edit-reservation-modal.tsx
  - [ ] Aktualizacja backendu (modele, walidacja)

### 2. ✅ **Typ Wydarzenia "Inne" - Pole Tekstowe**
- **Status**: Typy zaktualizowane
- **Zmiany**:
  - `customEventType?: string` - pole tekstowe dla własnego typu wydarzenia
- **TODO**:
  - [ ] Formularz - warunkowe pokazywanie pola tekstowego gdy wybrano "Inne"
  - [ ] Dodanie typu "Inne" do event-types w bazie
  - [ ] Backend - walidacja i zapis

### 3. ✅ **Konferencja → Rocznica**
- **Status**: Typy zaktualizowane
- **Zmiany**:
  - Zmiana nazwy typu wydarzenia
  - `anniversaryYear?: number` - która rocznica
  - `anniversaryOccasion?: string` - jaka okazja (np. "ślubu", "firmy")
- **TODO**:
  - [ ] Aktualizacja event-types w bazie danych
  - [ ] Formularz - warunkowe pola dla "Rocznica"
  - [ ] Backend - walidacja

### 4. ✅ **Data Potwierdzenia dla Statusu "Oczekująca"**
- **Status**: Typy zaktualizowane  
- **Zmiany**:
  - `confirmationDeadline?: string` - data do kiedy rezerwacja musi być potwierdzona
  - Walidacja: maksymalnie 1 dzień przed datą wydarzenia
- **TODO**:
  - [ ] Formularz - pole daty dla statusu PENDING
  - [ ] Walidacja w czasie rzeczywistym
  - [ ] Backend - automatyczne przypomnienia?
  - [ ] Alert gdy zbliża się deadline

### 5. ✅ **Podział Gości na Dorosłych i Dzieci**
- **Status**: Typy zaktualizowane
- **Zmiany**:
  - `adults: number` - liczba dorosłych
  - `children: number` - liczba dzieci  
  - `guests: number` - suma (adults + children)
- **TODO**:
  - [ ] Formularz - dwa osobne pola numeryczne
  - [ ] Automatyczne obliczanie sumy
  - [ ] Aktualizacja wyświetlania w liście
  - [ ] Backend - walidacja

### 6. ✅ **Różne Ceny dla Dorosłych i Dzieci**
- **Status**: Typy zaktualizowane
- **Zmiany**:
  - Hall: `pricePerChild?: number`
  - Reservation: `pricePerAdult: number`
  - Reservation: `pricePerChild: number`
  - Automatyczne obliczanie: `totalPrice = (adults × pricePerAdult) + (children × pricePerChild)`
- **TODO**:
  - [ ] Formularz - możliwość wprowadzenia obu cen
  - [ ] Pobieranie domyślnych cen z hall
  - [ ] Kalkulacja w czasie rzeczywistym
  - [ ] Backend - obliczenia

### 7. ⏳ **Automatyczne Notatki o Dopłacie za Dodatkowe Godziny**
- **Status**: Do implementacji
- **Logika**:
  ```typescript
  const defaultHours = 6
  const eventDuration = (endDateTime - startDateTime) / (1000 * 60 * 60) // in hours
  
  if (eventDuration > defaultHours) {
    const extraHours = eventDuration - defaultHours
    notes += `\n\n⏰ Uwaga: Wydarzenie trwa ${extraHours}h dłużej niż standardowe 6h. Klient musi dopłacić za ${extraHours} dodatkowych godzin.`
  }
  ```
- **TODO**:
  - [ ] Funkcja obliczająca czas trwania
  - [ ] Automatyczne dopisywanie do notatek
  - [ ] Wyświetlanie ostrzeżenia w formularzu

### 8. ⏳ **Podsumowanie Zmian Przy Edycji**
- **Status**: Do implementacji
- **Wymagania**:
  - Porównanie starych i nowych wartości
  - Wyświetlenie listy zmian przed zapisem
  - Wymagany powód zmiany (minimum 10 znaków)
  - Zatwierdzenie przez użytkownika
- **TODO**:
  - [ ] Komponent ChangesSummary
  - [ ] Funkcja detectChanges(oldData, newData)
  - [ ] Modal z podsumowaniem + pole reason
  - [ ] Walidacja długości powodu (min 10 znaków)

### 9. ⏳ **Brak Możliwości Zmiany Klienta Przy Edycji**
- **Status**: Do implementacji
- **Zmiany**:
  - Pole "Klient" ma być disabled w edit-reservation-modal
  - Tylko do odczytu, bez możliwości zmiany
- **TODO**:
  - [ ] Edit form - disabled select dla clientId
  - [ ] Komunikat: "Nie można zmienić klienta po utworzeniu rezerwacji"

---

## Kolejność Implementacji

### Faza 1: Backend (API + Database)
1. Migracja bazy danych - dodanie nowych pól
2. Aktualizacja modeli Prisma
3. Aktualizacja walidacji
4. Aktualizacja endpointów API
5. Aktualizacja event-types (dodanie "Inne", zmiana "Konferencja" → "Rocznica")

### Faza 2: Frontend - Formularze
1. Aktualizacja create-reservation-form.tsx:
   - DateTime pola zamiast date + time
   - Podział gości (adults/children)
   - Różne ceny
   - Warunkowe pola dla event types
   - Automatyczna kalkulacja
   - Notatki o dopłacie

2. Aktualizacja edit-reservation-modal.tsx:
   - Te same zmiany co wyżej
   - Disabled clientId field
   - **Nowa funkcja**: ChangesSummary component
   - **Nowa funkcja**: wymagany reason (min 10 znaków)

### Faza 3: Frontend - Wyświetlanie
1. Aktualizacja reservations-list.tsx - nowy format wyświetlania
2. Aktualizacja reservation-details-modal.tsx - wszystkie nowe pola
3. Aktualizacja utils - funkcje pomocnicze

### Faza 4: Testy i Dokumentacja
1. Testy jednostkowe - kalkulacje
2. Testy integracyjne - przepływ rezerwacji
3. Dokumentacja użytkownika

---

## Ryzyko i Uwagi

⚠️ **WAŻNE**: To są **breaking changes** - wymaga:
- Migracji istniejących danych
- Aktualizacji backendu
- Pełnych testów

⚠️ **Kompatybilność wsteczna**:
- Stare pola (date, startTime, endTime, guests) zachowane
- Backend musi obsługiwać oba formaty podczas okresu przejściowego

⚠️ **Priorytet**:
1. Najbardziej krytyczne: data/czas + podział gości + ceny
2. Ważne: warunkowe pola event types
3. Nice-to-have: automatyczne notatki, changes summary

---

## Następne Kroki

**Dzisiaj:**
- ✅ Typy TypeScript zaktualizowane
- ⏳ Aktualizacja formularza create-reservation
- ⏳ Aktualizacja formularza edit-reservation

**Wymaga współpracy z backendem:**
- Migracja bazy danych
- Aktualizacja API endpoints
- Testowanie integracji
