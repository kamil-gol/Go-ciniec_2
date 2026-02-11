# Go-Ciniec Reservation System

> System rezerwacji i zarządzania menu dla restauracji/event venue

## 🚀 Funkcjonalności

### ✅ Gotowe

- **Rezerwacje** - system kolejek i zarządzanie rezerwacjami
  - Tworzenie i edycja rezerwacji
  - Podział gości (dorośli, dzieci 4-12, maluchy 0-3)
  - **PDF Generator** - szczegółowe potwierdzenia z menu i cenami 🆕
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

### 🆕 PDF Generator Features (NEW!)

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
- **PDFKit** - generowanie PDF 🆕

**Frontend:**
- Next.js 14 (App Router)
- React 18
- TypeScript
- Tailwind CSS
- Docker

## 📏 API Endpoints

### Reservations
```http
POST   /api/reservations
GET    /api/reservations
GET    /api/reservations/:id
PUT    /api/reservations/:id
DELETE /api/reservations/:id
GET    /api/reservations/:id/pdf  🆕 Pobierz PDF
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
- **[PDF Enhancement Session](./docs/PDF_ENHANCEMENT_SESSION_2026-02-11.md)** - szczegóły PDF generator 🆕
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

## 📝 Przykład użycia - PDF Download

```typescript
// Frontend - pobieranie PDF rezerwacji
const downloadPDF = async (reservationId: string) => {
  const response = await fetch(
    `http://localhost:3001/api/reservations/${reservationId}/pdf`,
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
  a.download = `rezerwacja_${reservationId}.pdf`;
  a.click();
};
```

## 📊 Struktura Projektu

```
Go-ciniec_2/
├── apps/
│   ├── backend/          # Node.js + Express API
│   │   ├── src/
│   │   │   ├── controllers/
│   │   │   ├── routes/
│   │   │   ├── services/
│   │   │   │   ├── reservation.service.ts
│   │   │   │   └── pdf.service.ts       🆕 PDF Generator
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
│   ├── PDF_ENHANCEMENT_SESSION_2026-02-11.md  🆕
│   ├── MENU_PACKAGES_GUIDE.md
│   ├── API_DOCUMENTATION.md
│   └── ...
│
├── docker-compose.yml
└── README.md            # Ten plik
```

## 👥 Contributors

- Kamil Gołębiowski ([@kamil-gol](https://github.com/kamil-gol))

## 📝 License

Private project

---

**Ostatnia aktualizacja:** 11.02.2026, 22:00 CET - Dodano PDF Generator z menu i cenami 🚀
