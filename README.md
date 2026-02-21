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
- **🆕 Reports** - moduł raportowania i analityki 📊
- **🆕 RBAC & Settings** - system uprawnień i ustawień 🔐

### 🆕 RBAC & Settings Module (COMPLETED - 16.02.2026)

**Status: ✅ W pełni funkcjonalne**

**Funkcje:**
- ✅ **System uprawnień (RBAC)** - Role-Based Access Control
  - 5 systemowych ról: Administrator, Kierownik, Pracownik, Podgląd, Koordynator
  - 49 uprawnień pogrupowanych w 13 modułów
  - Permission middleware z cache (5min TTL)
  - Walidacja uprawnień per endpoint
- ✅ **Zarządzanie użytkownikami**
  - Tabela z filtrowaniem i wyszukiwaniem
  - CRUD: tworzenie, edycja, usuwanie użytkowników
  - Zmiana hasła (przez admina lub własnego)
  - Toggle aktywności (soft-delete)
  - Przypisywanie ról
- ✅ **Role i uprawnienia**
  - Tworzenie custom ról z dowolnymi uprawnieniami
  - Macierz uprawnień: checkboxy per moduł
  - Bulk select/deselect per moduł
  - Liczę użytkowników na rolę
  - Kolory ról (hex)
  - Ochrona systemowych ról
- ✅ **Dane firmy**
  - Formularz: nazwa, NIP, REGON, adres, kontakt
  - Singleton (jedna firma w systemie)
  - Ustawienia waluty i strefy czasowej
  - Logo URL (przygotowane pod upload)

**Moduły uprawnień:**
```
archive, attachments, audit_log, clients, dashboard, deposits,
event_types, halls, menu, queue, reports, reservations, settings
```

**Przykładowe uprawnienia:**
```typescript
// Rezerwacje
reservations:view, reservations:create, reservations:update,
reservations:delete, reservations:manage_menu, reservations:view_financial

// Menu
menu:view, menu:create, menu:update, menu:delete,
menu:manage_categories, menu:manage_options

// Ustawienia
settings:view, settings:manage_users, settings:manage_roles,
settings:manage_company
```

**Endpointy:**
```
GET    /api/settings/users
POST   /api/settings/users
PUT    /api/settings/users/:id
PATCH  /api/settings/users/:id/password
PATCH  /api/settings/users/:id/toggle-active
DELETE /api/settings/users/:id

GET    /api/settings/roles
POST   /api/settings/roles
PUT    /api/settings/roles/:id
PUT    /api/settings/roles/:id/permissions
DELETE /api/settings/roles/:id

GET    /api/settings/permissions
GET    /api/settings/permissions/grouped

GET    /api/settings/company
PUT    /api/settings/company
```

### 🆕 Reports Module (COMPLETED - 16.02.2026)

**Status: ✅ W pełni funkcjonalne**

**Funkcje:**
- ✅ **Raport przychodów** - analiza finansowa rezerwacji
  - Grupowanie po: dzień, tydzień, miesiąc, rok
  - Filtry: zakres dat, sala, typ wydarzenia
  - Metryki: łączny przychód, średnia/rezerwację, wzrost %, oczekujący przychód
  - Ranking sal i typów wydarzeń
  - Wykres breakdown po okresach
- ✅ **Raport zajętości** - analiza wykorzystania sal
  - Średnia zajętość, najpopularniejsza sala, najlepszy dzień tygodnia
  - Peak hours (popularne godziny)
  - Peak days (popularne dni tygodnia)
  - Ranking sal z progressbarami
- ✅ **Eksport Excel** - generowanie plików .xlsx z pełnymi danymi
- ✅ **Eksport PDF** - raporty w formacie PDF do druku
- ✅ **Presety dat** - Ten miesiąc, Poprzedni miesiąc, Ten rok, Poprzedni rok
- ✅ **Pełna polonizacja** - wszystkie etykiety i formaty w języku polskim

**Endpointy:**
```
GET    /api/reports/revenue
GET    /api/reports/revenue/excel
GET    /api/reports/revenue/pdf
GET    /api/reports/occupancy
GET    /api/reports/occupancy/excel
GET    /api/reports/occupancy/pdf
```

**Query params:**
```typescript
// Revenue
?dateFrom=2026-01-01&dateTo=2026-12-31&groupBy=month&hallId=uuid&eventTypeId=uuid

// Occupancy
?dateFrom=2026-01-01&dateTo=2026-12-31&hallId=uuid
```

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
- **ExcelJS** - generowanie Excel 🆕

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

### Settings & RBAC 🆕
```http
# Users
GET    /api/settings/users                 # Lista użytkowników
POST   /api/settings/users                 # Utwórz użytkownika
PUT    /api/settings/users/:id             # Edytuj użytkownika
PATCH  /api/settings/users/:id/password    # Zmień hasło
PATCH  /api/settings/users/:id/toggle-active  # Aktywuj/dezaktywuj
DELETE /api/settings/users/:id             # Usuń użytkownika

# Roles
GET    /api/settings/roles                 # Lista ról
POST   /api/settings/roles                 # Utwórz rolę
PUT    /api/settings/roles/:id             # Edytuj rolę
PUT    /api/settings/roles/:id/permissions # Zaktualizuj uprawnienia roli
DELETE /api/settings/roles/:id             # Usuń rolę

# Permissions
GET    /api/settings/permissions           # Wszystkie uprawnienia
GET    /api/settings/permissions/grouped   # Pogrupowane po modułach

# Company
GET    /api/settings/company               # Dane firmy
PUT    /api/settings/company               # Zaktualizuj dane firmy
```

### Reports 🆕
```http
GET    /api/reports/revenue                # Raport przychodów
GET    /api/reports/revenue/excel          # Export Excel przychodów
GET    /api/reports/revenue/pdf            # Export PDF przychodów
GET    /api/reports/occupancy              # Raport zajętości
GET    /api/reports/occupancy/excel        # Export Excel zajętości
GET    /api/reports/occupancy/pdf          # Export PDF zajętości
```

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

### RBAC & Settings
- **[RBAC System Guide](./docs/RBAC_SYSTEM.md)** - kompletna dokumentacja systemu uprawnień 🆕

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

# Seed database (with RBAC roles & permissions)
docker-compose exec backend npm run db:seed

# Access
Frontend: http://localhost:3000
Backend:  http://localhost:3001

# Login credentials (po seedzie):
Email: admin@gosciniecrodzinny.pl
Password: Admin123!@#
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

// Pobieranie raportów
const getRevenueReport = async (filters) => {
  const params = new URLSearchParams({
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo,
    groupBy: filters.groupBy || 'month',
    hallId: filters.hallId || '',
    eventTypeId: filters.eventTypeId || ''
  });
  
  const response = await fetch(
    `http://localhost:3001/api/reports/revenue?${params}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );
  
  return response.json();
};

// Eksport raportu do Excel
const exportRevenueExcel = async (filters) => {
  const params = new URLSearchParams({
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo,
    groupBy: filters.groupBy || 'month'
  });
  
  const response = await fetch(
    `http://localhost:3001/api/reports/revenue/excel?${params}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );
  
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `raport_przychody_${new Date().toISOString().split('T')[0]}.xlsx`;
  a.click();
};

// Zarządzanie użytkownikami
const getUsers = async () => {
  const response = await fetch(
    'http://localhost:3001/api/settings/users',
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );
  
  return response.json();
};

const createUser = async (userData) => {
  const response = await fetch(
    'http://localhost:3001/api/settings/users',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: userData.email,
        password: userData.password,
        firstName: userData.firstName,
        lastName: userData.lastName,
        roleId: userData.roleId
      })
    }
  );
  
  return response.json();
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
│   │   │   │   ├── audit-log.controller.ts          🆕 NEW (16.02.2026)
│   │   │   │   ├── reports.controller.ts            🆕 NEW (16.02.2026)
│   │   │   │   ├── users.controller.ts              🆕 NEW (16.02.2026)
│   │   │   │   ├── roles.controller.ts              🆕 NEW (16.02.2026)
│   │   │   │   ├── permissions.controller.ts        🆕 NEW (16.02.2026)
│   │   │   │   └── company-settings.controller.ts   🆕 NEW (16.02.2026)
│   │   │   ├── routes/
│   │   │   │   └── settings.routes.ts               🆕 NEW (16.02.2026)
│   │   │   ├── services/
│   │   │   │   ├── reservation.service.ts           🔄 Updated
│   │   │   │   ├── pdf.service.ts
│   │   │   │   ├── attachment.service.ts            🆕 NEW (15.02.2026)
│   │   │   │   ├── audit-log.service.ts             🆕 NEW (16.02.2026)
│   │   │   │   ├── reports.service.ts               🆕 NEW (16.02.2026)
│   │   │   │   ├── users.service.ts                 🆕 NEW (16.02.2026)
│   │   │   │   ├── roles.service.ts                 🆕 NEW (16.02.2026)
│   │   │   │   ├── permissions.service.ts           🆕 NEW (16.02.2026)
│   │   │   │   └── company-settings.service.ts      🆕 NEW (16.02.2026)
│   │   │   ├── middlewares/
│   │   │   │   └── permissions.ts                   🆕 NEW (16.02.2026)
│   │   │   ├── constants/
│   │   │   │   └── permissions.ts                   🆕 NEW (16.02.2026)
│   │   │   ├── types/
│   │   │   │   ├── reservation.types.ts             🔄 Updated
│   │   │   │   ├── reports.types.ts                 🆕 NEW (16.02.2026)
│   │   │   │   └── settings.types.ts                🆕 NEW (16.02.2026)
│   │   │   ├── utils/
│   │   │   │   └── audit-logger.ts                  🆕 NEW (16.02.2026)
│   │   │   └── ...
│   │   ├── prisma/
│   │   │   ├── schema.prisma                    🔄 Updated (Role, Permission, RolePermission)
│   │   │   └── seeds/
│   │   │       └── rbac.seed.ts                     🆕 NEW (16.02.2026)
│   │   └── ...
│   │
│   └── frontend/         # Next.js 14
│       ├── app/
│       │   └── dashboard/
│       │       ├── audit-log/                      🆕 NEW (16.02.2026)
│       │       │   └── page.tsx
│       │       ├── reports/                        🆕 NEW (16.02.2026)
│       │       │   └── page.tsx
│       │       ├── settings/                       🆕 NEW (16.02.2026)
│       │       │   └── page.tsx
│       │       ├── reservations/
│       │       └── menu/
│       │           └── packages/
│       ├── components/
│       │   ├── settings/                       🆕 NEW (16.02.2026)
│       │   │   ├── UsersTab.tsx
│       │   │   ├── UserFormDialog.tsx
│       │   │   ├── ChangePasswordDialog.tsx
│       │   │   ├── RolesTab.tsx
│       │   │   ├── RoleFormDialog.tsx
│       │   │   └── CompanyTab.tsx
│       │   ├── audit-log/                      🆕 NEW (16.02.2026)
│       │   │   ├── AuditLogTable.tsx
│       │   │   ├── AuditLogFilters.tsx
│       │   │   ├── AuditLogStats.tsx
│       │   │   └── AuditLogDetails.tsx
│       │   ├── menu/
│       │   ├── reservations/
│       │   │   └── ReservationMenuSection.tsx      ✅ Working
│       │   └── attachments/                    🆕 NEW (15.02.2026)
│       │       ├── attachment-panel.tsx
│       │       ├── attachment-upload-dialog.tsx
│       │       ├── attachment-preview.tsx
│       │       └── attachment-row.tsx
│       ├── lib/
│       │   └── api/
│       │       └── settings.ts                     🆕 NEW (16.02.2026)
│       ├── hooks/
│       │   ├── use-menu.ts                         ✅ Working
│       │   ├── use-attachments.ts                  🆕 NEW (15.02.2026)
│       │   ├── use-audit-log.ts                    🆕 NEW (16.02.2026)
│       │   └── use-reports.ts                      🆕 NEW (16.02.2026)
│       └── types/
│           ├── audit-log.types.ts                  🆕 NEW (16.02.2026)
│           └── reports.types.ts                    🆕 NEW (16.02.2026)
│
├── docs/                # 📚 Dokumentacja
│   ├── RBAC_SYSTEM.md                              🆕 NEW!
│   ├── REPORTS_MODULE_2026-02-16.md                🆕 NEW!
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

### 16.02.2026 21:19 CET - RBAC System Complete
- **Sprint 6:** System uprawnień + moduł Ustawienia
- **Backend:**
  - Prisma models: Role, Permission, RolePermission, CompanySettings
  - 5 systemowych ról z 49 uprawnieniami
  - Permission middleware z cache (5min)
  - Settings API: users, roles, permissions, company
  - Seed script dla ról i uprawnień
- **Frontend:**
  - Strona Ustawienia z 3 tabami
  - CRUD użytkowników, ról
  - Macierz uprawnień z checkboxami
  - Formularz danych firmy
- **Fixes:**
  - `logActivity` → `logChange` w backend services
  - Frontend typy dopasowane do API (companyName, usersCount, city, postalCode)
  - Usunięty podwójny prefix `/api/api/settings`
  - `user.roleId` → `user.role?.id`
- **Status:** ✅ Merged do main, działa produkcyjnie

### 16.02.2026 20:09 CET - Global Unicode Fix
- **Problem:** Unicode escape sequences (`\u0105`, `\u0119`, etc.) w całym frontendzie
- **Dotknięte moduły:** Reports, Audit Log, wszystkie pliki .tsx/.ts
- **Rozwiązanie:** Globalna zamiana przez `sed` - wszystkie `\uXXXX` → polskie znaki UTF-8
- **Status:** ✅ Naprawione - 19 polskich znaków we wszystkich plikach frontendowych
- **Lekcja:** GitHub API escapuje non-ASCII → używać `cat << 'ENDOFFILE'` + git push

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

**Ostatnia aktualizacja:** 16.02.2026, 21:22 CET - RBAC & Settings Module COMPLETED 🔐✅
