# Go-Ciniec Reservation System

> System rezerwacji i zarządzania menu dla restauracji/event venue

## 🚀 Funkcjonalności

### ✅ Gotowe

- **Rezerwacje** - system kolejek i zarządzanie rezerwacjami
- **Menu Templates** - szablony menu dla różnych typów eventów
- **Menu Packages** - pakiety z kategoriami dań (NEW!)
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

### 🔧 Tech Stack

**Backend:**
- Node.js + Express + TypeScript
- Prisma ORM
- PostgreSQL
- Docker

**Frontend:**
- Next.js 14 (App Router)
- React 18
- TypeScript
- Tailwind CSS
- Docker

## 📚 Dokumentacja

### Menu Packages System

- **[Pełny przewodnik](./docs/MENU_PACKAGES_GUIDE.md)** - kompletna dokumentacja
- **[Quick Start](./docs/MENU_PACKAGES_QUICKSTART.md)** - szybki start (30 sekund)

### Inne

- **[Queue System](./apps/frontend/README_QUEUE.md)** - system kolejek
- **[Drag & Drop](./apps/frontend/DRAG_AND_DROP_IMPLEMENTATION.md)** - drag & drop

## ⚡ Quick Start

```bash
# Clone repo
git clone https://github.com/kamil-gol/Go-ciniec_2.git
cd Go-ciniec_2

# Start services
docker compose up -d

# Access
Frontend: http://localhost:3000
Backend:  http://localhost:3001
```

## 📁 Struktura projektu

```
Go-ciniec_2/
├── apps/
│   ├── backend/          # Node.js + Express API
│   │   ├── src/
│   │   │   ├── controllers/
│   │   │   ├── routes/
│   │   │   ├── services/
│   │   │   └── ...
│   │   └── prisma/schema.prisma
│   │
│   └── frontend/         # Next.js 14
│       ├── app/
│       │   └── dashboard/
│       │       └── menu/
│       │           └── packages/    # ⭐ Menu Packages
│       ├── components/
│       │   └── menu/
│       │       ├── PackageForm.tsx
│       │       └── CategorySettingsSection.tsx
│       ├── lib/
│       │   └── api/
│       │       └── menu-packages.ts
│       └── types/
│           └── menu.ts
│
├── docs/                # 📚 Dokumentacja
│   ├── MENU_PACKAGES_GUIDE.md
│   └── MENU_PACKAGES_QUICKSTART.md
│
├── docker-compose.yml
└── README.md            # Ten plik
```

## 🔑 Key Features - Menu Packages

### Backend API

```http
POST   /api/menu-packages
GET    /api/menu-packages
GET    /api/menu-packages/:id
PUT    /api/menu-packages/:id
DELETE /api/menu-packages/:id

GET    /api/menu-packages/:packageId/categories
PUT    /api/menu-packages/:packageId/categories   # Bulk update!

GET    /api/dish-categories
```

### Frontend Pages

```
/dashboard/menu/packages              # Lista pakietów
/dashboard/menu/packages/new          # Nowy pakiet
/dashboard/menu/packages/[id]         # Edycja pakietu
```

### Komponenty

- `<PackageForm />` - główny formularz pakietu
- `<CategorySettingsSection />` - wybór kategorii dań ⭐

## 💡 Przykład użycia

### Tworzenie pakietu z kategoriami

```typescript
const packageData = {
  menuTemplateId: 'tpl-123',
  name: 'Pakiet Standard',
  pricePerAdult: 150,
  pricePerChild: 75,
  categorySettings: [
    {
      categoryId: 'cat-soups',
      minSelect: 1,
      maxSelect: 2,
      isRequired: true,
      isEnabled: true,
      customLabel: 'Wybierz zupy (1-2)'
    },
    {
      categoryId: 'cat-mains',
      minSelect: 1.5,  // Dziesiętne!
      maxSelect: 2,
      isRequired: true,
      isEnabled: true
    }
  ]
};

await createPackage(packageData);
```

## 👥 Contributors

- Kamil Gołębiowski ([@kamil-gol](https://github.com/kamil-gol))

## 📝 License

Private project

---

**Ostatnia aktualizacja:** 11.02.2026 - Dodano Menu Packages z Category Settings
