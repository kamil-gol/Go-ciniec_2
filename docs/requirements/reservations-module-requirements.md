# Wymagania Funkcjonalne - Moduł Rezerwacji

## 📋 Spis treści

1. [Ogólny opis modułu](#ogólny-opis-modułu)
2. [Model danych](#model-danych)
3. [Funkcjonalności](#funkcjonalności)
4. [Walidacje](#walidacje)
5. [Reguły biznesowe](#regułyy-biznesowe)
6. [Interfejs użytkownika](#interfejs-użytkownika)
7. [Historia zmian](#historia-zmian)

---

## 1. Ogólny opis modułu

### 1.1 Cel modułu
System zarządzania rezerwacjami sal weselnych i okolicznościowych, umożliwiający:
- Tworzenie i edycję rezerwacji
- Zarządzanie statusami rezerwacji
- Śledzenie historii zmian
- Obsługę zaliczek
- Automatyczne kalkulacje cenowe
- Zarządzanie klientami

### 1.2 Użytkownicy systemu
- **ADMIN** - pełny dostęp do wszystkich funkcji
- **EMPLOYEE** - dostęp do zarządzania rezerwacjami
- **CLIENT** - dostęp tylko do swoich rezerwacji (tylko odczyt)

---

## 2. Model danych

### 2.1 Rezerwacja (Reservation)

#### Pola podstawowe
| Pole | Typ | Wymagane | Opis |
|------|-----|----------|------|
| id | UUID | Tak | Unikalny identyfikator |
| hallId | UUID | Tak | Odniesienie do sali |
| clientId | UUID | Tak | Odniesienie do klienta (niezmienialne po utworzeniu) |
| eventTypeId | UUID | Tak | Typ wydarzenia |
| createdById | UUID | Tak | Użytkownik tworzący |
| status | Enum | Tak | Status rezerwacji |

#### Pola czasowe
| Pole | Typ | Wymagane | Opis |
|------|-----|----------|------|
| startDateTime | DateTime | Tak | Data i czas rozpoczęcia |
| endDateTime | DateTime | Tak | Data i czas zakończenia |
| confirmationDeadline | Date | Nie | Termin potwierdzenia (min 1 dzień przed wydarzeniem) |
| date | String | Nie | Legacy - data (dla wstecznej kompatybilności) |
| startTime | String | Nie | Legacy - czas rozpoczęcia |
| endTime | String | Nie | Legacy - czas zakończenia |

#### Pola dotyczące gości
| Pole | Typ | Wymagane | Opis |
|------|-----|----------|------|
| adults | Int | Tak | Liczba dorosłych (>= 0) |
| children | Int | Tak | Liczba dzieci (>= 0) |
| guests | Int | Tak | Łączna liczba gości (adults + children) |

**Warunek:** `adults + children >= 1`

#### Pola cenowe
| Pole | Typ | Wymagane | Opis |
|------|-----|----------|------|
| pricePerAdult | Decimal | Tak | Cena za dorosłego |
| pricePerChild | Decimal | Tak | Cena za dziecko (domyślnie połowa ceny za dorosłego) |
| totalPrice | Decimal | Tak | Cena całkowita (adults × pricePerAdult + children × pricePerChild) |

#### Pola szczegółowe wydarzenia
| Pole | Typ | Wymagane | Opis |
|------|-----|----------|------|
| customEventType | String | Nie | Własny typ wydarzenia (gdy eventType = "Inne") |
| birthdayAge | Int | Nie | Które urodziny (gdy eventType = "Urodziny") |
| anniversaryYear | Int | Nie | Która rocznica (gdy eventType = "Rocznica") |
| anniversaryOccasion | String | Nie | Jaka okazja (gdy eventType = "Rocznica") |

#### Pozostałe pola
| Pole | Typ | Wymagane | Opis |
|------|-----|----------|------|
| notes | Text | Nie | Notatki (auto-generowane przy dodatkowych godzinach) |
| attachments | JSON | Nie | Załączniki |
| archivedAt | DateTime | Nie | Data archiwizacji |
| createdAt | DateTime | Tak | Data utworzenia |
| updatedAt | DateTime | Tak | Data ostatniej modyfikacji |

### 2.2 Statusy rezerwacji

```typescript
enum ReservationStatus {
  PENDING     // Oczekująca - nowa rezerwacja
  CONFIRMED   // Potwierdzona - klient potwierdził
  COMPLETED   // Zakończona - wydarzenie się odbyło
  CANCELLED   // Anulowana - rezerwacja anulowana
}
```

### 2.3 Historia rezerwacji (ReservationHistory)

| Pole | Typ | Wymagane | Opis |
|------|-----|----------|------|
| id | UUID | Tak | Unikalny identyfikator |
| reservationId | UUID | Tak | Odniesienie do rezerwacji |
| changedByUserId | UUID | Tak | Użytkownik wprowadzający zmianę |
| changeType | Enum | Tak | Typ zmiany |
| fieldName | String | Nie | Nazwa zmienionego pola |
| oldValue | String | Nie | Stara wartość |
| newValue | String | Nie | Nowa wartość |
| reason | Text | Tak | Powód zmiany (min 10 znaków dla UPDATE) |
| createdAt | DateTime | Tak | Data zmiany |

```typescript
enum ChangeType {
  CREATED          // Utworzenie rezerwacji
  UPDATED          // Edycja danych
  STATUS_CHANGED   // Zmiana statusu
  CANCELLED        // Anulowanie
}
```

### 2.4 Zaliczka (Deposit)

| Pole | Typ | Wymagane | Opis |
|------|-----|----------|------|
| id | UUID | Tak | Unikalny identyfikator |
| reservationId | UUID | Tak | Odniesienie do rezerwacji |
| amount | Decimal | Tak | Kwota zaliczki |
| dueDate | Date | Tak | Termin płatności |
| status | Enum | Tak | Status zaliczki |
| paid | Boolean | Tak | Czy opłacona (deprecated) |
| paidDate | DateTime | Nie | Data opłacenia |
| paymentMethod | String | Nie | Metoda płatności |
| createdAt | DateTime | Tak | Data utworzenia |
| updatedAt | DateTime | Tak | Data modyfikacji |

```typescript
enum DepositStatus {
  PENDING  // Do zapłaty
  PAID     // Zapłacona
}
```

### 2.5 Klient (Client)

| Pole | Typ | Wymagane | Opis |
|------|-----|----------|------|
| id | UUID | Tak | Unikalny identyfikator |
| firstName | String | Tak | Imię |
| lastName | String | Tak | Nazwisko |
| email | String | **NIE** | Email (opcjonalny) |
| phone | String | Tak | Telefon (min 9 cyfr) |
| address | String | Nie | Adres |
| notes | Text | Nie | Notatki |
| createdAt | DateTime | Tak | Data utworzenia |
| updatedAt | DateTime | Tak | Data modyfikacji |

**Unikalność:** Kombinacja `firstName + lastName + phone` musi być unikalna

### 2.6 Sala (Hall)

| Pole | Typ | Wymagane | Opis |
|------|-----|----------|------|
| id | UUID | Tak | Unikalny identyfikator |
| name | String | Tak | Nazwa sali |
| capacity | Int | Tak | Maksymalna pojemność |
| pricePerPerson | Decimal | Tak | Cena za osobę dorosłą |
| pricePerChild | Decimal | Nie | Cena za dziecko (domyślnie = pricePerPerson) |
| description | Text | Nie | Opis sali |
| isActive | Boolean | Tak | Czy sala jest aktywna |

### 2.7 Typ wydarzenia (EventType)

| Pole | Typ | Wymagane | Opis |
|------|-----|----------|------|
| id | UUID | Tak | Unikalny identyfikator |
| name | String | Tak | Nazwa typu (np. "Wesele", "Urodziny", "Rocznica", "Inne") |
| createdAt | DateTime | Tak | Data utworzenia |

---

## 3. Funkcjonalności

### 3.1 Tworzenie rezerwacji

#### REQ-RES-001: Formularz tworzenia rezerwacji
**Priorytet:** Wysoki  
**Opis:** System umożliwia utworzenie nowej rezerwacji

**Kryteria akceptacji:**
- ✅ Formularz zawiera wszystkie wymagane pola
- ✅ Domyślny status: `PENDING`
- ✅ Walidacja działa przed zapisem
- ✅ Po zapisie użytkownik jest przekierowany do listy rezerwacji
- ✅ Wpis w historii: `CREATED`
- ✅ Toast: "Rezerwacja utworzona pomyślnie"

#### REQ-RES-002: Auto-uzupełnianie czasu zakończenia
**Priorytet:** Średni  
**Opis:** Po wybraniu czasu rozpoczęcia, czas zakończenia automatycznie ustawia się na +6 godzin

**Kryteria akceptacji:**
- ✅ Auto-uzupełnienie działa tylko gdy pole końca jest puste
- ✅ Użytkownik może zmienić auto-uzupełnioną wartość
- ✅ Działa zarówno w tworzeniu jak i edycji

#### REQ-RES-003: Auto-kalkulacja cen
**Priorytet:** Wysoki  
**Opis:** System automatycznie kalkuluje cenę całkowitą

**Formuła:**
```
totalPrice = (adults × pricePerAdult) + (children × pricePerChild)
```

**Kryteria akceptacji:**
- ✅ Kalkulacja w czasie rzeczywistym
- ✅ Widoczna w formularzu przed zapisem
- ✅ Rozpisanie: dorośli + dzieci + suma

#### REQ-RES-004: Auto-uzupełnianie cen z sali
**Priorytet:** Średni  
**Opis:** Po wybraniu sali, ceny automatycznie się uzupełniają

**Kryteria akceptacji:**
- ✅ `pricePerAdult` = `hall.pricePerPerson`
- ✅ `pricePerChild` = `hall.pricePerChild` (jeśli istnieje) lub `hall.pricePerPerson`
- ✅ Auto-uzupełnienie tylko gdy pole jest puste

#### REQ-RES-005: Cena za dziecko = połowa ceny za dorosłego
**Priorytet:** Wysoki  
**Opis:** Pole ceny za dziecko jest zablokowane dopóki nie wypełniono liczby i ceny za dorosłych. Domyślna wartość to połowa ceny za dorosłego.

**Kryteria akceptacji:**
- ❌ Pole "Cena za dziecko" `disabled` gdy:
  - `adults === 0` LUB
  - `pricePerAdult === 0`
- ✅ Po wypełnieniu warunków:
  - Pole staje się `enabled`
  - Auto-wartość = `Math.round(pricePerAdult / 2)`
- ✅ Użytkownik może zmienić wartość po odblokowaniu
- ✅ Tooltip: "Najpierw uzupełnij liczbę i cenę za dorosłych (domyślnie połowa ceny za dorosłego)"

#### REQ-RES-006: Dodatkowe godziny
**Priorytet:** Średni  
**Opis:** Jeśli wydarzenie trwa dłużej niż 6 godzin, system automatycznie dodaje notatkę o dopłacie

**Formuła:**
```
extraHours = Math.ceil(duration - 6)
extraCost = extraHours × 500 PLN
```

**Kryteria akceptacji:**
- ⏰ Ostrzeżenie w formularzu: "Czas trwania: 8h (2h ponad standard - 1000 PLN dopłaty)"
- ✅ Auto-notatka: "⏰ Dodatkowe godziny: 2h × 500 PLN = 1000 PLN"
- ✅ Notatka dodawana automatycznie do pola `notes`
- ✅ Notatka usuwana gdy czas <= 6h

#### REQ-RES-007: Tworzenie klienta w trakcie rezerwacji
**Priorytet:** Wysoki  
**Opis:** Użytkownik może dodać nowego klienta bez opuszczania formularza rezerwacji

**Kryteria akceptacji:**
- ✅ Przycisk "+" obok pola wyboru klienta
- ✅ Modal z formularzem klienta
- ✅ Email jest **opcjonalny**
- ✅ Po zapisie modal się zamyka
- ✅ Nowy klient **automatycznie wybierany** w dropdownie
- ✅ Lista klientów odświeżona (query invalidation)

#### REQ-RES-008: Dodawanie zaliczki
**Priorytet:** Średni  
**Opis:** Opcjonalne dodanie zaliczki do rezerwacji

**Kryteria akceptacji:**
- ✅ Checkbox "Dodaj zaliczkę"
- ✅ Pola: kwota + termin płatności
- ✅ Domyślny status: `PENDING`
- ✅ Walidacja: kwota > 0, termin w przyszłości

### 3.2 Edycja rezerwacji

#### REQ-RES-101: Formularz edycji
**Priorytet:** Wysoki  
**Opis:** System umożliwia edycję istniejącej rezerwacji

**Kryteria akceptacji:**
- ✅ Formularz wstępnie wypełniony aktualnymi danymi
- ✅ Wszystkie pola edytowalne **OPRÓCZ** `clientId`
- 🔒 Pole "Klient" zablokowane (`disabled`)
- ✅ Ikona kłódki przy polu klienta
- ✅ Tooltip: "Klient nie może być zmieniony po utworzeniu rezerwacji"
- ✅ Wymóg powodu zmiany (min 10 znaków)
- ✅ Wpis w historii z powodem

#### REQ-RES-102: Blokada edycji zakończonych/anulowanych
**Priorytet:** Wysoki  
**Opis:** Nie można edytować rezerwacji ze statusem `COMPLETED` lub `CANCELLED`

**Kryteria akceptacji:**
- ❌ Błąd: "Cannot update completed reservation"
- ❌ Błąd: "Cannot update cancelled reservation"
- ✅ Przycisk "Edytuj" ukryty/nieaktywny dla tych statusów

#### REQ-RES-103: Wymóg powodu zmiany
**Priorytet:** Wysoki  
**Opis:** Każda zmiana wymaga podania powodu

**Kryteria akceptacji:**
- ✅ Pole "Powód zmiany" w formularzu edycji
- ✅ Minimalna długość: 10 znaków
- ✅ Pole wymagane tylko gdy są zmiany
- ✅ Powód zapisywany w historii
- ❌ Błąd: "Powód musi mieć co najmniej 10 znaków"

#### REQ-RES-104: Detekcja zmian
**Priorytet:** Średni  
**Opis:** System wykrywa co się zmieniło i zapisuje szczegóły w historii

**Kryteria akceptacji:**
- ✅ Porównanie wszystkich pól przed i po edycji
- ✅ Lista zmian w formacie czytelnym dla człowieka
- ✅ Zapisanie w polu `reason` historii:
  ```
  Klient zwiększył liczbę gości
  
  Changes:
  - adults: 40 → 50
  - totalPrice: 4500 → 5500
  ```

### 3.3 Zmiana statusu

#### REQ-RES-201: Macierz przejść statusów
**Priorytet:** Wysoki  
**Opis:** Dozwolone przejścia między statusami

```
PENDING → CONFIRMED ✅
PENDING → CANCELLED ✅

CONFIRMED → COMPLETED ✅
CONFIRMED → CANCELLED ✅

COMPLETED → (brak) ❌
CANCELLED → (brak) ❌
```

**Kryteria akceptacji:**
- ✅ Walidacja po stronie backendu
- ❌ Błąd przy niedozwolonym przejściu: "Cannot change status from X to Y"
- ✅ Osobny endpoint: `PATCH /reservations/:id/status`
- ✅ Wpis w historii: `STATUS_CHANGED`

#### REQ-RES-202: Zmiana statusu w edycji
**Priorytet:** Wysoki  
**Opis:** Możliwość zmiany statusu w formularzu edycji

**Kryteria akceptacji:**
- ✅ Dropdown ze statusami
- ⚠️ Ostrzeżenie gdy status się zmienia: "Zmiana statusu: Oczekująca → Potwierdzona"
- ✅ Wysłanie oddzielnego requesta do `/status` po zapisie
- ✅ Dwa wpisy w historii: UPDATE + STATUS_CHANGED

### 3.4 Anulowanie rezerwacji

#### REQ-RES-301: Anulowanie z powodem
**Priorytet:** Wysoki  
**Opis:** Możliwość anulowania rezerwacji (soft delete)

**Kryteria akceptacji:**
- ✅ Przycisk "Anuluj rezerwację" w szczegółach
- ✅ Modal potwierdzenia z polem powodu
- ✅ Status zmienia się na `CANCELLED`
- ✅ Ustawienie `archivedAt` na obecną datę
- ✅ Wpis w historii: `CANCELLED`
- ✅ Rezerwacja znika z głównej listy (tylko aktywne)

#### REQ-RES-302: Blokada anulowania zakończonych
**Priorytet:** Wysoki  
**Opis:** Nie można anulować rezerwacji ze statusem `COMPLETED`

**Kryteria akceptacji:**
- ❌ Błąd: "Cannot cancel completed reservation"
- ✅ Przycisk "Anuluj" ukryty dla `COMPLETED`

### 3.5 Lista i filtrowanie

#### REQ-RES-401: Lista rezerwacji
**Priorytet:** Wysoki  
**Opis:** Wyświetlenie listy rezerwacji z podstawowymi informacjami

**Kolumny:**
- ID
- Data i czas
- Klient (format: "Jan Kowalski (123456789)")
- Sala
- Typ wydarzenia
- Liczba gości (dorośli + dzieci)
- Cena całkowita
- Status (z kolorowym badge)
- Akcje

**Kryteria akceptacji:**
- ✅ Domyślnie: tylko aktywne (bez `CANCELLED`)
- ✅ Sortowanie po dacie (najbliższe pierwsze)
- ✅ Paginacja (20 na stronę)
- ✅ Loading state podczas ładowania

#### REQ-RES-402: Filtrowanie
**Priorytet:** Średni  
**Opis:** Możliwość filtrowania rezerwacji

**Filtry:**
- Status (multi-select)
- Sala (dropdown)
- Klient (autocomplete)
- Typ wydarzenia (dropdown)
- Zakres dat (date range picker)
- Pokaż archiwalne (checkbox)

**Kryteria akceptacji:**
- ✅ Filtry działają łącznie (AND)
- ✅ URL params dla deep linking
- ✅ Przycisk "Wyczyść filtry"

#### REQ-RES-403: Wyszukiwanie
**Priorytet:** Średni  
**Opis:** Wyszukiwanie pełnotekstowe

**Przeszukiwane pola:**
- Imię i nazwisko klienta
- Telefon klienta
- Email klienta
- Nazwa sali
- Notatki

**Kryteria akceptacji:**
- ✅ Wyszukiwanie case-insensitive
- ✅ Debouncing (300ms)
- ✅ Minimalna długość: 2 znaki

### 3.6 Szczegóły rezerwacji

#### REQ-RES-501: Widok szczegółów
**Priorytet:** Wysoki  
**Opis:** Pełny widok rezerwacji

**Sekcje:**
1. **Nagłówek**
   - Status (badge)
   - ID
   - Data utworzenia
   - Przyciski akcji

2. **Informacje o wydarzeniu**
   - Typ wydarzenia (z dodatkowymi polami)
   - Data i czas (z czasem trwania)
   - Sala
   - Termin potwierdzenia (jeśli jest)

3. **Informacje o kliencie**
   - Imię i nazwisko
   - Telefon
   - Email (jeśli jest)
   - Adres (jeśli jest)

4. **Goście i ceny**
   - Dorośli: X osób × Y PLN = Z PLN
   - Dzieci: X osób × Y PLN = Z PLN
   - **Suma: XXX PLN**

5. **Zaliczki** (jeśli są)
   - Lista zaliczek ze statusami
   - Suma zapłaconych
   - Pozostało do zapłaty

6. **Notatki** (jeśli są)

7. **Historia zmian**
   - Timeline z wszystkimi zmianami
   - Użytkownik + data + opis

**Kryteria akceptacji:**
- ✅ Responsywny layout
- ✅ Lazy loading historii (tylko po otwarciu sekcji)
- ✅ Przyciski kontekstowe (Edytuj/Anuluj) zależne od statusu

### 3.7 Historia zmian

#### REQ-RES-601: Automatyczne logowanie
**Priorytet:** Wysoki  
**Opis:** Każda zmiana jest automatycznie zapisywana w historii

**Kryteria akceptacji:**
- ✅ Wpis przy utworzeniu (`CREATED`)
- ✅ Wpis przy każdej edycji (`UPDATED`) z listą zmian
- ✅ Wpis przy zmianie statusu (`STATUS_CHANGED`)
- ✅ Wpis przy anulowaniu (`CANCELLED`)
- ✅ Zapisanie `userId` użytkownika wykonującego akcję
- ✅ Walidacja istnienia `userId` przed zapisem

#### REQ-RES-602: Wyświetlanie historii
**Priorytet:** Średni  
**Opis:** Czytelne wyświetlenie historii w timeline

**Format wpisu:**
```
[Ikona] Typ zmiany
Jan Kowalski • 07.02.2026 12:00

Powód: Klient zwiększył liczbę gości

Zmiany:
- Liczba dorosłych: 40 → 50
- Cena całkowita: 4,500 PLN → 5,500 PLN
```

**Kryteria akceptacji:**
- ✅ Chronologicznie (najnowsze na górze)
- ✅ Ikony dla różnych typów zmian
- ✅ Kolorystyka (created: green, updated: blue, cancelled: red)
- ✅ Rozwijalne szczegóły (jeśli lista zmian długa)

---

## 4. Walidacje

### 4.1 Walidacje pól

#### Sala (hallId)
- ✅ Wymagane
- ✅ Musi istnieć w bazie
- ✅ Musi być aktywna (`isActive = true`)

#### Klient (clientId)
- ✅ Wymagane
- ✅ Musi istnieć w bazie
- 🔒 **Nie może być zmieniony po utworzeniu**

#### Typ wydarzenia (eventTypeId)
- ✅ Wymagane
- ✅ Musi istnieć w bazie

#### Data i czas
- ✅ `startDateTime` wymagane
- ✅ `endDateTime` wymagane
- ✅ Musi być w przyszłości
- ✅ `endDateTime` > `startDateTime`
- ✅ Minimalna długość: 1 godzina

#### Goście
- ✅ `adults` >= 0
- ✅ `children` >= 0
- ✅ `adults + children` >= 1
- ✅ `adults + children` <= `hall.capacity`

#### Ceny
- ✅ `pricePerAdult` >= 0
- ✅ `pricePerChild` >= 0
- ✅ `pricePerChild` disabled dopóki `adults > 0` AND `pricePerAdult > 0`

#### Termin potwierdzenia
- ✅ Opcjonalny
- ✅ Jeśli podany: min 1 dzień przed `startDateTime`

#### Pola szczegółowe wydarzenia
- ✅ `customEventType`: wymagane gdy `eventType.name = "Inne"`
- ✅ `birthdayAge`: opcjonalne gdy `eventType.name = "Urodziny"`
- ✅ `anniversaryYear` + `anniversaryOccasion`: opcjonalne gdy `eventType.name = "Rocznica"`

#### Powód zmiany (przy edycji)
- ✅ Wymagane gdy są zmiany
- ✅ Minimalna długość: 10 znaków

### 4.2 Walidacje klienta

#### Imię i nazwisko
- ✅ Wymagane
- ✅ Min 2 znaki każde

#### Email
- ❌ **NIE** wymagane (opcjonalny)
- ✅ Jeśli podany: poprawny format email

#### Telefon
- ✅ Wymagane
- ✅ Min 9 cyfr (bez znaków specjalnych)

#### Unikalność
- ✅ Kombinacja `firstName + lastName + phone` musi być unikalna
- ❌ Błąd: "Klient {firstName} {lastName} z numerem {phone} już istnieje"

### 4.3 Walidacje zaliczki

#### Kwota
- ✅ > 0
- ✅ <= `totalPrice`

#### Termin płatności
- ✅ W przyszłości
- ✅ Przed datą wydarzenia

---

## 5. Reguły biznesowe

### 5.1 Czas standardowy wydarzenia
- **Standard:** 6 godzin
- **Dopłata:** 500 PLN za każdą dodatkową godzinę
- **Zaokrąglenie:** W górę (ceiling)

### 5.2 Cennik
- **Cena za dorosłego:** Domyślnie z sali (`hall.pricePerPerson`)
- **Cena za dziecko:** 
  - Domyślnie: `Math.round(pricePerAdult / 2)`
  - Jeśli sala ma `pricePerChild`: użyj jej
  - Edytowalna ręcznie

### 5.3 Identyfikacja klientów
- **Klucz unikalności:** `firstName + lastName + phone`
- **Format wyświetlania:** "Jan Kowalski (123456789)"
- **Powód:** Możliwość obsługi klientów o tych samych imionach i nazwiskach

### 5.4 Statusy i uprawnienia

| Status | Edycja | Zmiana statusu | Anulowanie |
|--------|--------|----------------|------------|
| PENDING | ✅ | → CONFIRMED, CANCELLED | ✅ |
| CONFIRMED | ✅ | → COMPLETED, CANCELLED | ✅ |
| COMPLETED | ❌ | - | ❌ |
| CANCELLED | ❌ | - | - |

### 5.5 Archiwizacja
- **Warunek:** `archivedAt IS NOT NULL`
- **Domyślnie:** Ukryte w liście głównej
- **Dostęp:** Checkbox "Pokaż archiwalne" w filtrach
- **Akcje:** Tylko odczyt (brak edycji/anulowania)

---

## 6. Interfejs użytkownika

### 6.1 Kolory statusów

```css
PENDING: #FFA500 (pomarańczowy)
CONFIRMED: #10B981 (zielony)
COMPLETED: #3B82F6 (niebieski)
CANCELLED: #EF4444 (czerwony)
```

### 6.2 Ikony

- **Rezerwacja:** 📅
- **Klient:** 👤
- **Sala:** 🏛️
- **Wydarzenie:** 🎉
- **Goście:** 👥 / 👶
- **Cena:** 💰
- **Czas:** ⏰
- **Ostrzeżenie:** ⚠️
- **Sukces:** ✅
- **Błąd:** ❌
- **Zablokowane:** 🔒

### 6.3 Komunikaty toastów

**Sukces:**
- "Rezerwacja utworzona pomyślnie"
- "Rezerwacja zaktualizowana pomyślnie"
- "Rezerwacja anulowana"
- "Klient dodany pomyślnie"

**Błędy:**
- "Błąd podczas tworzenia rezerwacji"
- "Nie można edytować zakończonej rezerwacji"
- "Liczba gości przekracza pojemność sali"
- "Klient z tym numerem telefonu już istnieje"

### 6.4 Responsywność

**Breakpointy:**
- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

**Adaptacje:**
- Mobile: formularz single-column, uproszczone akcje
- Tablet: formularz two-column gdzie możliwe
- Desktop: pełna wersja z sidebarem

---

## 7. Historia zmian

### v1.3.0 (07.02.2026)
- ✨ Cena za dziecko domyślnie połowa ceny za dorosłego
- 🔒 Zablokowanie zmiany klienta w edycji rezerwacji
- ✅ Email opcjonalny dla klienta
- ✅ Auto-przypisanie nowo utworzonego klienta
- ✅ Identyfikacja klientów po telefonie
- ✅ Status zaliczki (PENDING/PAID)
- 🐛 Naprawa błędu foreign key w ReservationHistory

### v1.2.0 (06.02.2026)
- ✨ Podział gości na dorosłych i dzieci
- ✨ Osobne ceny dla dorosłych i dzieci
- ✨ Automatyczna kalkulacja dopłaty za dodatkowe godziny
- ✨ Walidacja pojemności sali w czasie rzeczywistym
- ✨ Termin potwierdzenia rezerwacji
- ✨ Pola szczegółowe dla typów wydarzeń (urodziny, rocznica, inne)

### v1.1.0 (05.02.2026)
- ✨ Historia zmian rezerwacji
- ✨ Wymóg podania powodu przy edycji
- ✨ Detekcja i logowanie zmian
- ✨ Walidacja przejść między statusami

### v1.0.0 (04.02.2026)
- ✨ Podstawowe CRUD rezerwacji
- ✨ Statusy rezerwacji
- ✨ Zarządzanie klientami
- ✨ Zaliczki
- ✨ Filtrowanie i wyszukiwanie

---

## 📚 Dokumenty powiązane

- [Plan testów E2E](../testing/e2e-test-plan.md)
- [API Documentation](../api/reservations-api.md)
- [Schemat bazy danych](../database/schema.md)

---

**Ostatnia aktualizacja:** 07.02.2026  
**Autor:** System AI  
**Status:** ✅ Aktualny
