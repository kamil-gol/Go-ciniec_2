# Go-Ciniec Reservation System

> System rezerwacji i zarządzania menu dla restauracji/event venue

## 🚀 Funkcjonalności

### ✅ Gotowe

- **Rezerwacje** - system kolejek i zarządzanie rezerwacjami
  - Tworzenie i edycja rezerwacji
  - Podział gości (dorośli, dzieci 4-12, maluchy 0-3)
  - **🆕 Menu Integration** - wybór pakietu menu podczas rezerwacji
  - **PDF Generator** - szczegółowe potwierdzenia z menu i cenami
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

### 🆕 Menu Integration (NEW!)

**Teraz przy tworzeniu rezerwacji:**
- ✅ **Liczba osób ZAWSZE wymagana** (adults, children, toddlers)
- ✅ **Wybór pakietu menu opcjonalny** - ceny pobierane automatycznie z pakietu
- ✅ **Dodawanie opcji dodatkowych** do pakietu (MenuOptions)
- ✅ **Ceny ręczne** gdy nie wybrano pakietu
- ✅ **Edycja menu** w istniejącej rezerwacji (`PUT /api/reservations/:id/menu`)
- ✅ **MenuSnapshot** - automatyczny zapis danych menu
- ✅ **Walidacja** min/max guests dla pakietu
- ✅ **Historia zmian** - tracking zmian menu

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

**Frontend:**
- Next.js 14 (App Router)
- React 18
- TypeScript
- Tailwind CSS
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
GET    /api/reservations/:id/menu          # Pobierz menu
PUT    /api/reservations/:id/menu          # Aktualizuj menu
DELETE /api/reservations/:id/menu          # Usuń menu
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
```

## 📚 Dokumentacja

### Menu & Reservations
- **[Menu Integration Guide](./docs/MENU_INTEGRATION.md)** - kompletna dokumentacja integracji menu 🆕
- **[PDF Enhancement Session](./docs/PDF_ENHANCEMENT_SESSION_2026-02-11.md)** - szczegóły PDF generator
- **[Menu Packages Guide](./docs/MENU_PACKAGES_GUIDE.md)** - kompletna dokumentacja
- **[Quick Start](./docs/MENU_PACKAGES_QUICKSTART.md)** - szybki start (30 sekund)
- **[Queue System](./apps/frontend/README_QUEUE.md)** - system kolejek

### Development & Deployment
- **[API Documentation](./docs/API_DOCUMENTATION.md)** - pełna dokumentacja API
- **[Architecture](./docs/ARCHITECTURE.md)** - architektura systemu
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
```

## 📊 Struktura Projektu

```
Go-ciniec_2/
├── apps/
│   ├── backend/          # Node.js + Express API
│   │   ├── src/
│   │   │   ├── controllers/
│   │   │   │   ├── reservation.controller.ts         🔄 Updated
│   │   │   │   └── reservation-menu.controller.ts   🔄 Updated
│   │   │   ├── routes/
│   │   │   ├── services/
│   │   │   │   ├── reservation.service.ts           🔄 Updated
│   │   │   │   └── pdf.service.ts
│   │   │   ├── types/
│   │   │   │   └── reservation.types.ts             🔄 Updated
│   │   │   └── ...
│   │   └── prisma/schema.prisma
│   │
│   └── frontend/         # Next.js 14
│       ├── app/
│       │   └── dashboard/
│       │       ├── reservations/
│       │       └── menu/
│       │           └── packages/
│       ├── components/
│       │   └── menu/
│       ├── lib/
│       │   └── api/
│       └── types/
│
├── docs/                # 📚 Dokumentacja
│   ├── MENU_INTEGRATION.md                          🆕 NEW!
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

## 👥 Contributors

- Kamil Gołębiowski ([@kamil-gol](https://github.com/kamil-gol))

## 📝 License

Private project

---

**Ostatnia aktualizacja:** 11.02.2026, 22:33 CET - Dodano Menu Integration 🚀
