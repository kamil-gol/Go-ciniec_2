# Queue System - Frontend Documentation

## 📁 Struktura plików

```
apps/frontend/
├── app/
│   └── queue/
│       ├── layout.tsx          # Layout strony kolejki
│       └── page.tsx            # Główna strona zarządzania kolejką
├── components/
│   └── queue/
│       ├── queue-item-card.tsx       # Karta pojedynczego elementu kolejki
│       ├── add-to-queue-form.tsx     # Formularz dodawania do kolejki
│       └── promote-modal.tsx         # Modal awansowania do rezerwacji
├── lib/
│   └── api/
│       └── queue.ts            # API client dla queue endpoints
└── types/
    └── index.ts                # Typy TypeScript (zaktualizowane)
```

## 🎨 Komponenty

### 1. QueueItemCard
**Plik:** `components/queue/queue-item-card.tsx`

**Opis:** Wyświetla pojedynczy element kolejki z informacjami o kliencie

**Props:**
- `item: QueueItem` - dane elementu kolejki
- `isFirst: boolean` - czy jest pierwszym elementem (ukrywa strzałkę w górę)
- `isLast: boolean` - czy jest ostatnim elementem (ukrywa strzałkę w dół)
- `onMoveUp?: (id: string) => void` - callback przeniesienia w górę
- `onMoveDown?: (id: string) => void` - callback przeniesienia w dół
- `onPromote?: (id: string) => void` - callback awansowania do rezerwacji

**Features:**
- Badge z numerem pozycji
- Informacje o kliencie (imię, telefon, email)
- Data docelowa wydarzenia
- Liczba gości
- Notatki
- Przyciski akcji (awansuj, przesuń)

---

### 2. AddToQueueForm
**Plik:** `components/queue/add-to-queue-form.tsx`

**Opis:** Formularz dodawania nowej rezerwacji do kolejki

**Props:**
- `clients: Client[]` - lista klientów do wyboru
- `onSubmit: (data: CreateQueueReservationInput) => Promise<void>` - callback zapisu
- `onCancel?: () => void` - callback anulowania

**Pola:**
- Wybór klienta (dropdown)
- Data docelowa (date picker)
- Liczba dorosłych (input number)
- Liczba dzieci (input number)
- Notatki (textarea, opcjonalne)

**Walidacja:**
- Klient: wymagany
- Data: wymagana, nie może być w przeszłości
- Dorośli: min. 1
- Dzieci: min. 0

---

### 3. PromoteModal
**Plik:** `components/queue/promote-modal.tsx`

**Opis:** Modal do awansowania elementu kolejki do pełnej rezerwacji

**Props:**
- `open: boolean` - czy modal jest otwarty
- `onClose: () => void` - callback zamknięcia
- `queueItem: QueueItem | null` - element do awansowania
- `onPromote: (reservationId: string, data: any) => Promise<void>` - callback awansowania

**Features:**
- Wykorzystuje `CreateReservationForm` z pre-wypełnionymi danymi
- Pokazuje info o pozycji w kolejce
- Sugeruje datę z kolejki jako początkową datę rezerwacji

---

### 4. QueuePage
**Plik:** `app/queue/page.tsx`

**Opis:** Główna strona zarządzania kolejką

**Features:**

#### Statystyki
- Liczba elementów w kolejce
- Liczba różnych dat
- Najstarsza data w kolejce
- Liczba ręcznie zmienionych kolejności

#### Filtrowanie
- Tabs z datami
- "Wszystkie" - pokazuje wszystkie elementy
- Poszczególne daty - filtruje po dacie

#### Akcje
- **Dodaj do kolejki** - pokazuje formularz
- **Przesuń w górę/dół** - zmiana pozycji
- **Awansuj** - promowanie do rezerwacji

#### Funkcje
- Auto-refresh po każdej akcji
- Toast notifications
- Loading states
- Empty states

---

## 🔌 API Client

**Plik:** `lib/api/queue.ts`

### Dostępne metody:

```typescript
queueApi.getAll()                          // Pobierz wszystkie kolejki
queueApi.getByDate(date: string)           // Pobierz kolejkę dla daty
queueApi.getStats()                        // Pobierz statystyki
queueApi.addToQueue(input)                 // Dodaj do kolejki
queueApi.swapPositions(input)              // Zamień pozycje
queueApi.moveToPosition(id, position)      // Przenieś na pozycję
queueApi.promoteReservation(id, input)     // Awansuj do rezerwacji
queueApi.autoCancelExpired()               // Ręczne wywołanie auto-cancel
```

---

## 📝 Typy TypeScript

**Plik:** `types/index.ts`

### Dodane typy:

```typescript
// Status RESERVED dla kolejki
enum ReservationStatus {
  RESERVED = 'RESERVED',  // Nowy!
  // ... pozostałe
}

// Element kolejki
interface QueueItem {
  id: string
  position: number
  queueDate: string
  guests: number
  client: {
    id: string
    firstName: string
    lastName: string
    phone: string
    email?: string
  }
  isManualOrder: boolean
  notes?: string
  createdAt: string
  createdBy: {
    id: string
    firstName: string
    lastName: string
  }
}

// Statystyki kolejki
interface QueueStats {
  totalQueued: number
  queuesByDate: Array<{
    date: string
    count: number
  }>
  oldestQueueDate: string | null
  manualOrderCount: number
}

// Input: dodawanie do kolejki
interface CreateQueueReservationInput {
  clientId: string
  reservationQueueDate: string
  guests: number
  adults: number
  children?: number
  notes?: string
}

// Input: awansowanie do rezerwacji
interface PromoteQueueReservationInput {
  hallId: string
  eventTypeId: string
  customEventType?: string
  birthdayAge?: number
  anniversaryYear?: number
  anniversaryOccasion?: string
  startDateTime: string
  endDateTime: string
  adults: number
  children: number
  pricePerAdult: number
  pricePerChild: number
  status: 'PENDING' | 'CONFIRMED'
  confirmationDeadline?: string
  notes?: string
  deposit?: {
    amount: number
    dueDate: string
  }
}
```

---

## 🚀 Uruchomienie

### 1. Deploy na serwer

```bash
cd /home/kamil/rezerwacje
git pull origin feature/reservation-queue
cd apps/frontend
npm install
docker-compose restart frontend
```

### 2. Dostęp

Strona kolejki dostępna pod:
```
http://localhost:3000/queue
http://your-domain.com/queue
```

---

## 🎯 User Flow

### Dodawanie do kolejki
1. Użytkownik klika "Dodaj do kolejki"
2. Wypełnia formularz (klient, data, liczba gości)
3. System dodaje na koniec kolejki dla danej daty
4. Pozycja automatycznie przypisana

### Zarządzanie kolejnością
1. Użytkownik widzi listę elementów kolejki
2. Może przesuwać elementy w górę/dół
3. System aktualizuje pozycje wszystkich elementów
4. Zachowana kolejność dla każdej daty osobno

### Awansowanie do rezerwacji
1. Użytkownik klika "Awansuj" przy elemencie
2. Otwiera się modal z formularzem rezerwacji
3. Dane klienta i data są pre-wypełnione
4. Użytkownik wybiera salę, godziny, ceny
5. System tworzy rezerwację PENDING lub CONFIRMED
6. Element usuwany z kolejki

---

## 🔄 Integracja z istniejącym kodem

### Zmiany w Reservation
Dodano pola:
- `queuePosition?: number` - pozycja w kolejce
- `reservationQueueDate?: string` - data docelowa z kolejki

### Reużycie komponentów
- `PromoteModal` używa `CreateReservationForm`
- UI components z `@/components/ui` (shadcn/ui)
- API client pattern z `lib/api-client.ts`

---

## 📱 Responsive Design

Strona jest w pełni responsywna:
- Mobile: pojedyncza kolumna, kompaktowe karty
- Tablet: 2 kolumny grid dla stats
- Desktop: pełny layout z 3 kolumnami stats

---

## 🎨 UI/UX Features

### Visual Feedback
- Toast notifications dla wszystkich akcji
- Loading states podczas ładowania
- Disabled states dla przycisków
- Empty states gdy brak danych

### Ikony (Lucide React)
- Plus - dodaj do kolejki
- ArrowUp/ArrowDown - zmiana pozycji
- Check - awansuj
- Calendar - data
- Users - goście
- Phone/Mail - kontakt

### Kolory
- Badge pozycji: blue (info)
- Akcje: default/primary
- Muted text dla meta info

---

## 🐛 Error Handling

Wszystkie API calls mają:
- Try-catch blocks
- Toast error messages
- Console.error logging
- Graceful fallbacks

---

## 📊 Future Enhancements

### Możliwe rozszerzenia:
1. **Drag & Drop** - przeciąganie elementów do zmiany pozycji
2. **Bulk actions** - masowe operacje (usuń, awansuj)
3. **Filtering** - filtruj po liczbie gości, dacie dodania
4. **Export** - eksport kolejki do CSV/PDF
5. **Notifications** - powiadomienia email/SMS gdy zwolni się termin
6. **Priority levels** - poziomy priorytetu (VIP, standard)
7. **Waitlist matching** - auto-matching z wolnymi terminami

---

## ✅ Checklist wdrożenia

- [x] API service utworzony
- [x] TypeScript types dodane
- [x] QueueItemCard komponent
- [x] AddToQueueForm komponent
- [x] PromoteModal komponent
- [x] Queue page utworzona
- [x] Layout utworzony
- [ ] Link w nawigacji dodany
- [ ] Testy manualne wykonane
- [ ] Deploy na produkcję

---

## 🔗 Linki

- Backend API: [README_QUEUE_API.md](../backend/src/routes/README_QUEUE_API.md)
- Backend Service: [queue.service.ts](../backend/src/services/queue.service.ts)
- Backend Routes: [queue.routes.ts](../backend/src/routes/queue.routes.ts)
