# Go-Ciniec Reservation System

> System rezerwacji i zarządzania menu dla restauracji/event venue

## 🚀 Funkcjonalności

### ✅ Gotowe

- **Rezerwacje** - system kolejek i zarządzanie rezerwacjami
  - Tworzenie i edycja rezerwacji
  - Podział gości (dorośli, dzieci 4-12, maluchy 0-3)
  - **🆕 Menu Integration** - wybór pakietu menu podczas rezerwacji
  - **PDF Generator** - szczegółowe potwierdzenia z menu i cenami
  - **🆕 Attachments Module** - załączniki do rezerwacji, klientów i zadatków 🎯
- **Menu Templates** - szablony menu dla różnych typów eventów
- **Menu Packages** - pakiety z kategoriami dań
  - Wybór kategorii dań dla pakietu
  - Ustawienia min/max wyborów (dziesiętne!)
  - Custom labels dla kategorii
  - Bulk update API
- **Dish Categories & Dishes** - kategorie i dania
- **Menu Calculator** - kalkulator kosztów menu
- **Queue System** - system kolejek z auto-cancel
- **Deposits** - zarządzanie zadatkami
- **Event Types** - typy eventów
- **Clients** - baza klientów
- **Halls** - zarządzanie salami
- **🆕 Audit Log** - dziennik audytu wszystkich zmian w systemie 📑

### 🆕 Audit Log Module (COMPLETED - 16.02.2026)

**Status: ✅ W pełni funkcjonalne**

**Funkcje:**
- ✅ **Historia zmian** - pełny tracking wszystkich akcji w systemie
- ✅ **30+ typów akcji** - CRUD, archiwizacja, menu, płatności, kolejka, załączniki
- ✅ **12 typów encji** - Rezerwacje, Klienci, Sale, Menu, Użytkownicy, etc.
- ✅ **Statystyki** - dashboard z 4 kartami (całkowite wpisy, najczęstsza akcja, typ, aktywni użytkownicy)
- ✅ **Filtry** - po akcji, typie encji, użytkowniku, zakresie dat
- ✅ **Paginacja** - strony po 20 wpisów
- ✅ **Szczegóły zmian** - modal z pełną historią (old/new values)
- ✅ **Akcje systemowe** - obsługa wpisów bez użytkownika (system actions)
- ✅ **Pełna polonizacja** - wszystkie etykiety po polsku
- ✅ **IP & User Agent** - tracking źródła akcji

**Typy akcji:**
```
# Basic CRUD
CREATE, UPDATE, DELETE, TOGGLE

# Status
STATUS_CHANGE, ARCHIVE, UNARCHIVE, RESTORE

# Menu
MENU_UPDATE, MENU_REMOVE, MENU_SELECTED, MENU_RECALCULATED, MENU_DIRECT_REMOVED

# Payment
PAYMENT_UPDATE, MARK_PAID

# Queue
QUEUE_ADD, QUEUE_UPDATE, QUEUE_REMOVE, QUEUE_SWAP, QUEUE_MOVE,
QUEUE_REORDER, QUEUE_REBUILD, QUEUE_PROMOTE, QUEUE_AUTO_CANCEL

# Attachments
ATTACHMENT_UPLOAD, ATTACHMENT_ADD, ATTACHMENT_UPDATE, ATTACHMENT_ARCHIVE, ATTACHMENT_DELETE

# Auth
LOGIN, LOGOUT
```

**Typy encji:**
```
RESERVATION, CLIENT, ROOM, HALL, MENU, USER, DEPOSIT, EVENT_TYPE,
ATTACHMENT, QUEUE, DISH, MENU_TEMPLATE
```

### 🆕 Attachments Module (COMPLETED - 15-16.02.2026)

**Status: ✅ W pełni funkcjonalne**

**Funkcje:**
- ✅ **Upload plików** - PDF, JPG, PNG, WEBP (max 10MB)
- ✅ **Kategorie** - RODO, Umowa, Faktura, Paragon, Inne (dynamiczne per entity)
- ✅ **Polymorphic architecture** - wspólny model dla CLIENT/RESERVATION/DEPOSIT
- ✅ **RODO redirect** - RODO zawsze do klienta (niezależnie od źródła uploadu)
- ✅ **Preview modal** - PDF iframe + image zoom
- ✅ **Drag & drop** - intuicyjny upload
- ✅ **Badges** - liczniki załączników w deposit-actions dropdown
- ✅ **Soft-delete** - archivization zamiast usuwania
- ✅ **Batch API** - sprawdzanie wielokrotne (hasRodo, hasContract)
- ✅ **TanStack Query** - cache + optimistic updates
- ✅ **38 unit tests** - pełne pokrycie service layer

**Dokumentacja:** **[Attachments Module Guide](./docs/ATTACHMENTS_MODULE_2026-02-15.md)** 📎

### 🆕 Menu Integration (COMPLETED - 12.02.2026)

**Status: ✅ W pełni funkcjonalne**

**Podczas tworzenia/edycji rezerwacji:**
- ✅ **Liczba osób ZAWSZE wymagana** (adults, children, toddlers)
- ✅ **Wybór pakietu menu opcjonalny** - ceny pobierane automatycznie z pakietu
- ✅ **Dodawanie opcji dodatkowych** do pakietu (MenuOptions)
- ✅ **Ceny ręczne** gdy nie wybrano pakietu
- ✅ **Edycja menu** w istniejącej rezerwacji (`PUT /api/reservations/:id/menu`)
- ✅ **MenuSnapshot** - automatyczny zapis danych menu z priceBreakdown
- ✅ **Walidacja** min/max guests dla pakietu
- ✅ **Historia zmian** - tracking zmian menu
- ✅ **Frontend wyświetlanie** - komponenty dla szczegółów menu i cennika

**Naprawione (12.02.2026, 00:27 CET):**
- 🐛 **Fix:** GET `/api/reservations/:id/menu` endpoint teraz zwraca zarówno `snapshot` jak i `priceBreakdown`
- 🐛 **Fix:** Frontend poprawnie wyświetla wybrane menu w szczegółach rezerwacji
- 🐛 **Fix:** Przywrócenie backupu po zmianach schema - dane menu zachowane

**Przykład użycia:**
```typescript
// Rezerwacja Z pakietem menu
POST /api/reservations
{
  adults: 50,
  children: 10,
  toddlers: 2,
  menuPackageId: "uuid",
  selectedOptions: [
    { optionId: "uuid", quantity: 1 }
  ]
  // Ceny pobrane automatycznie z pakietu!
}

// Rezerwacja BEZ pakietu (ceny ręczne)
POST /api/reservations
{
  adults: 50,
  children: 10,
  toddlers: 2,
  pricePerAdult: 150,
  pricePerChild: 75
}

// Pobieranie menu rezerwacji
GET /api/reservations/:id/menu
// Response:
{
  "success": true,
  "data": {
    "snapshot": { /* dane menu */ },
    "priceBreakdown": { /* szczegóły cenowe */ }
  }
}
```

### 🆕 PDF Generator Features

**Potwierdzenie rezerwacji zawiera:**
- ✅ Dane klienta (imię, nazwisko, telefon, email)
- ✅ Szczegóły rezerwacji (sala, data, godzina, goście)
- ✅ Status rezerwacji z kolorowymi badgami
- ✅ **Wybrane menu:**
  - Nazwa pakietu
  - Liczba osób (dorośli, dzieci, maluchy)
  - Wszystkie dania pogrupowane po kategoriach
  - Alergeny dla każdego dania
  - **Ceny:** pakiet + dodatki + suma menu
- ✅ Kalkulacja kosztów (goście x cena = total)
- ✅ Informacje o zaliczce (kwota, termin, status)
- ✅ Obsługa polskich znaków (DejaVu fonts)

### 🔧 Tech Stack

**Backend:**
- Node.js + Express + TypeScript
- Prisma ORM
- PostgreSQL
- Docker
- **PDFKit** - generowanie PDF
- **Multer** - file uploads 🆕

**Frontend:**
- Next.js 14 (App Router)
- React 18
- TypeScript
- Tailwind CSS
- Shadcn/ui components
- TanStack Query (React Query) 🆕
- Framer Motion 🆕
- Docker

## 📏 API Endpoints

### Reservations
```http
POST   /api/reservations                    # Teraz z menu integration! 🆕
GET    /api/reservations
GET    /api/reservations/:id
PUT    /api/reservations/:id
DELETE /api/reservations/:id
GET    /api/reservations/:id/pdf

# Menu Management 🆕
POST   /api/reservations/:id/menu          # Wybierz menu
GET    /api/reservations/:id/menu          # Pobierz menu (z priceBreakdown)
PUT    /api/reservations/:id/menu          # Aktualizuj menu
DELETE /api/reservations/:id/menu          # Usuń menu
```

### Attachments 🆕
```http
POST   /api/attachments                    # Upload (multipart/form-data)
GET    /api/attachments                    # List (z filtrami)
GET    /api/attachments/:id                # Get single
GET    /api/attachments/:id/download       # Download
DELETE /api/attachments/:id                # Soft delete
POST   /api/attachments/batch-check-rodo   # Batch check hasRodo
POST   /api/attachments/batch-check-contract  # Batch check hasContract
GET    /api/attachments/categories/:entityType  # Get categories for entity
```

### Audit Log 🆕
```http
GET    /api/audit-log                      # Get logs (with filters)
GET    /api/audit-log/recent               # Recent activity (last N logs)
GET    /api/audit-log/statistics           # Statistics dashboard
GET    /api/audit-log/meta/entity-types    # Available entity types
GET    /api/audit-log/meta/actions         # Available actions
GET    /api/audit-log/entity/:entityType/:entityId  # Entity-specific logs

# Query params for GET /api/audit-log:
# - entityType: string (optional) - RESERVATION, CLIENT, etc.
# - action: string (optional) - CREATE, UPDATE, DELETE, etc.
# - userId: string (optional)
# - entityId: string (optional)
# - dateFrom: ISO string (optional)
# - dateTo: ISO string (optional)
# - page: number (default: 1)
# - pageSize: number (default: 50)
```

### Menu Packages
```http
POST   /api/menu-packages
GET    /api/menu-packages
GET    /api/menu-packages/:id
PUT    /api/menu-packages/:id
DELETE /api/menu-packages/:id

GET    /api/menu-packages/:packageId/categories
PUT    /api/menu-packages/:packageId/categories   # Bulk update!
```

### Other
```http
GET    /api/dish-categories
GET    /api/dishes
POST   /api/clients
GET    /api/halls
GET    /api/event-types
```

## 📚 Dokumentacja

### Menu & Reservations
- **[Attachments Module Guide](./docs/ATTACHMENTS_MODULE_2026-02-15.md)** - kompletna dokumentacja załączników 🆕
- **[Menu Integration Guide](./docs/MENU_INTEGRATION.md)** - kompletna dokumentacja integracji menu
- **[PDF Enhancement Session](./docs/PDF_ENHANCEMENT_SESSION_2026-02-11.md)** - szczegóły PDF generator
- **[Menu Packages Guide](./docs/MENU_PACKAGES_GUIDE.md)** - kompletna dokumentacja
- **[Quick Start](./docs/MENU_PACKAGES_QUICKSTART.md)** - szybki start (30 sekund)
- **[Queue System](./apps/frontend/README_QUEUE.md)** - system kolejek

### Development & Deployment
- **[API Documentation](./docs/API_DOCUMENTATION.md)** - pełna dokumentacja API
- **[Architecture](./docs/ARCHITECTURE.md)** - architektura systemu
- **[Sprints Overview](./docs/SPRINTS.md)** - mapa sprintów 🆕
- **[Database Schema](./docs/DATABASE.md)** - schemat bazy danych
- **[Docker Commands](./docs/DOCKER_COMMANDS.md)** - komendy Docker
- **[Deployment](./docs/DEPLOYMENT.md)** - wdrożenie produkcyjne

## ⚡ Quick Start

```bash
# Clone repo
git clone https://github.com/kamil-gol/Go-ciniec_2.git
cd Go-ciniec_2

# Start services
docker compose up -d

# Run database migrations
docker-compose exec backend npx prisma migrate deploy

# Seed database (optional)
docker-compose exec backend npm run db:seed

# Access
Frontend: http://localhost:3000
Backend:  http://localhost:3001
```

## 📝 Przykład użycia - Rezerwacja z menu

```typescript
// Frontend - tworzenie rezerwacji z pakietem menu
const createReservation = async (data) => {
  const response = await fetch(
    'http://localhost:3001/api/reservations',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        hallId: 'uuid',
        clientId: 'uuid',
        eventTypeId: 'uuid',
        startDateTime: '2026-03-15T14:00:00Z',
        endDateTime: '2026-03-15T22:00:00Z',
        
        // Liczba osób - ZAWSZE WYMAGANE
        adults: 50,
        children: 10,
        toddlers: 2,
        
        // OPCJA 1: Z pakietem menu
        menuPackageId: 'package-uuid',
        selectedOptions: [
          { optionId: 'option-uuid', quantity: 1 }
        ]
        
        // LUB OPCJA 2: Ceny ręczne
        // pricePerAdult: 150,
        // pricePerChild: 75,
      })
    }
  );
  
  return response.json();
};

// Edycja menu w rezerwacji
const updateMenu = async (reservationId, menuData) => {
  const response = await fetch(
    `http://localhost:3001/api/reservations/${reservationId}/menu`,
    {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        packageId: 'new-package-uuid',
        selectedOptions: [...]
      })
    }
  );
  
  return response.json();
};

// Pobranie menu dla rezerwacji (z priceBreakdown)
const getMenu = async (reservationId) => {
  const response = await fetch(
    `http://localhost:3001/api/reservations/${reservationId}/menu`,
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );
  
  return response.json();
  // Returns: { success: true, data: { snapshot, priceBreakdown } }
};

// Pobieranie dziennika audytu
const getAuditLog = async (filters) => {
  const params = new URLSearchParams({
    entityType: filters.entityType || '',
    action: filters.action || '',
    page: String(filters.page || 1),
    pageSize: String(filters.pageSize || 50)
  });
  
  const response = await fetch(
    `http://localhost:3001/api/audit-log?${params}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );
  
  return response.json();
  // Returns: { data: [...], total, page, pageSize, totalPages }
};
```

## 📊 Struktura Projektu

```
Go-ciniec_2/
├── apps/
│   ├── backend/          # Node.js + Express API
│   │   ├── src/
│   │   │   ├── controllers/
│   │   │   │   ├── reservation.controller.ts         🔄 Updated
│   │   │   │   ├── reservation-menu.controller.ts   ✅ Fixed (12.02.2026)
│   │   │   │   ├── attachment.controller.ts         🆕 NEW (15.02.2026)
│   │   │   │   └── audit-log.controller.ts          🆕 NEW (16.02.2026)
│   │   │   ├── routes/
│   │   │   ├── services/
│   │   │   │   ├── reservation.service.ts           🔄 Updated
│   │   │   │   ├── pdf.service.ts
│   │   │   │   ├── attachment.service.ts            🆕 NEW (15.02.2026)
│   │   │   │   └── audit-log.service.ts             🆕 NEW (16.02.2026)
│   │   │   ├── types/
│   │   │   │   └── reservation.types.ts             🔄 Updated
│   │   │   ├── utils/
│   │   │   │   └── audit-logger.ts                  🆕 NEW (16.02.2026)
│   │   │   └── ...
│   │   └── prisma/schema.prisma
│   │
│   └── frontend/         # Next.js 14
│       ├── app/
│       │   └── dashboard/
│       │       ├── audit-log/                      🆕 NEW (16.02.2026)
│       │       │   └── page.tsx
│       │       ├── reservations/
│       │       └── menu/
│       │           └── packages/
│       ├── components/
│       │   ├── audit-log/                      🆕 NEW (16.02.2026)
│       │   │   ├── AuditLogTable.tsx
│       │   │   ├── AuditLogFilters.tsx
│       │   │   ├── AuditLogStats.tsx
│       │   │   └── AuditLogDetails.tsx
│       │   ├── menu/
│       │   ├── reservations/
│       │   │   └── ReservationMenuSection.tsx      ✅ Working
│       │   └── attachments/                        🆕 NEW (15.02.2026)
│       │       ├── attachment-panel.tsx
│       │       ├── attachment-upload-dialog.tsx
│       │       ├── attachment-preview.tsx
│       │       └── attachment-row.tsx
│       ├── lib/
│       │   └── api/
│       ├── hooks/
│       │   ├── use-menu.ts                         ✅ Working
│       │   ├── use-attachments.ts                  🆕 NEW (15.02.2026)
│       │   └── use-audit-log.ts                    🆕 NEW (16.02.2026)
│       └── types/
│           └── audit-log.types.ts                  🆕 NEW (16.02.2026)
│
├── docs/                # 📚 Dokumentacja
│   ├── ATTACHMENTS_MODULE_2026-02-15.md            🆕 NEW!
│   ├── MENU_INTEGRATION.md
│   ├── PDF_ENHANCEMENT_SESSION_2026-02-11.md
│   ├── MENU_PACKAGES_GUIDE.md
│   ├── API_DOCUMENTATION.md
│   └── ...
│
├── docker-compose.yml
└── README.md            # Ten plik
```

## 🔄 Breaking Changes

### v2.0.0 - Menu Integration

**⚠️ BREAKING CHANGES:**
1. **Liczba osób teraz WYMAGANA:**
   - `adults`, `children`, `toddlers` - wszystkie wymagane (mogą być 0)
   - Nie można już pominąć tych pól

2. **Ceny ręczne wymagane gdy brak pakietu:**
   - Jeśli nie podano `menuPackageId`, wymagane są `pricePerAdult` i `pricePerChild`

**✅ Zachowana kompatybilność:**
- Pole `guests` nadal istnieje (obliczane automatycznie)
- Legacy pola `date`, `startTime`, `endTime` działają
- Rezerwacje bez menu działają normalnie
- Istniejące endpointy bez zmian

## 🐛 Recent Fixes

### 16.02.2026 - Audit Log Null User Fix
- **Problem:** Crash przy wyświetlaniu wpisów gdzie `user: null` (akcje systemowe)
- **Błąd:** `TypeError: Cannot read properties of null (reading 'firstName')`
- **Rozwiązanie:** Dodano optional chaining `log.user?.firstName` + fallback "System"
- **Status:** ✅ Naprawione - obsługa akcji systemowych

### 12.02.2026 - Menu Display Fix
- **Problem:** Frontend wyświetlał "Brak wybranego menu" mimo że dane były w bazie
- **Przyczyna:** Endpoint `GET /api/reservations/:id/menu` zwracał tylko `snapshot` bez `priceBreakdown`
- **Rozwiązanie:** Dodano kalkulację `priceBreakdown` w endpoint response
- **Status:** ✅ Naprawione - menu wyświetla się poprawnie

## 👥 Contributors

- Kamil Gołębiowski ([@kamil-gol](https://github.com/kamil-gol))

## 📝 License

Private project

---

**Ostatnia aktualizacja:** 16.02.2026, 19:00 CET - Audit Log Module COMPLETED 📑
