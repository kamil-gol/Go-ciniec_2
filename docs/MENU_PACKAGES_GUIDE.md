# Menu Packages with Category Settings - Complete Guide

## 📋 Spis treści

1. [Architektura systemu](#architektura-systemu)
2. [Backend API](#backend-api)
3. [Frontend](#frontend)
4. [Jak używać](#jak-używać)
5. [Przykłady](#przykłady)
6. [Troubleshooting](#troubleshooting)

---

## 🏗️ Architektura systemu

### Struktura danych

```
MenuTemplate (Szablon menu)
  └── MenuPackage[] (Pakiety - np. "Standard", "Premium")
        ├── CategorySettings[] (Kategorie dań w pakiecie)
        │     ├── categoryId
        │     ├── minSelect (dziesiętne: 0.5, 1, 1.5, 2...)
        │     ├── maxSelect (dziesiętne: 0.5, 1, 1.5, 2...)
        │     ├── isRequired
        │     ├── customLabel
        │     └── displayOrder
        └── MenuOptions[] (Opcje dodatków)

DishCategory (Kategorie dań - globalne)
  └── Dish[] (Dania w kategorii)
```

### Schemat bazy danych

```prisma
model MenuPackage {
  id                String   @id @default(uuid())
  menuTemplateId    String
  name              String
  pricePerAdult     Decimal
  pricePerChild     Decimal
  pricePerToddler   Decimal  @default(0)
  categorySettings  PackageCategorySettings[]
  // ...
}

model PackageCategorySettings {
  id           String   @id @default(uuid())
  packageId    String
  categoryId   String
  minSelect    Decimal  @default(1)  // Dziesiętne!
  maxSelect    Decimal  @default(1)  // Dziesiętne!
  isRequired   Boolean  @default(true)
  isEnabled    Boolean  @default(true)
  displayOrder Int      @default(0)
  customLabel  String?
  
  package      MenuPackage   @relation(fields: [packageId], references: [id])
  category     DishCategory  @relation(fields: [categoryId], references: [id])
  
  @@unique([packageId, categoryId])
}

model DishCategory {
  id            String   @id @default(uuid())
  slug          String   @unique
  name          String
  icon          String?
  color         String?
  displayOrder  Int
  isActive      Boolean  @default(true)
  dishes        Dish[]
}
```

---

## 🔌 Backend API

### Base URL
```
http://localhost:3001/api
```

### Endpoints

#### 1. Lista pakietów
```http
GET /api/menu-packages?menuTemplateId=xxx
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "pkg-123",
      "name": "Pakiet Standard",
      "pricePerAdult": 150,
      "categorySettings": [...]
    }
  ]
}
```

#### 2. Szczegóły pakietu
```http
GET /api/menu-packages/:id
```

#### 3. Tworzenie pakietu
```http
POST /api/menu-packages
Content-Type: application/json

{
  "menuTemplateId": "tpl-123",
  "name": "Pakiet Premium",
  "pricePerAdult": 200,
  "pricePerChild": 100,
  "pricePerToddler": 0,
  "categorySettings": [
    {
      "categoryId": "cat-soups",
      "minSelect": 1,
      "maxSelect": 2,
      "isRequired": true,
      "isEnabled": true,
      "displayOrder": 0,
      "customLabel": "Wybierz zupy"
    }
  ]
}
```

#### 4. Aktualizacja pakietu
```http
PUT /api/menu-packages/:id
```

#### 5. Usunięcie pakietu
```http
DELETE /api/menu-packages/:id
```

#### 6. Pobranie kategorii pakietu
```http
GET /api/menu-packages/:packageId/categories
```

**Response:**
```json
{
  "success": true,
  "data": {
    "packageId": "pkg-123",
    "packageName": "Pakiet Standard",
    "categories": [
      {
        "id": "setting-1",
        "categoryId": "cat-soups",
        "categoryName": "Zupy",
        "minSelect": 1,
        "maxSelect": 2,
        "isRequired": true,
        "customLabel": "Wybierz zupy",
        "dishes": [
          {
            "id": "dish-1",
            "name": "Rosół",
            "allergens": ["gluten"]
          }
        ]
      }
    ]
  }
}
```

#### 7. **Bulk update kategorii pakietu (NAJWAŻNIEJSZY!)**
```http
PUT /api/menu-packages/:packageId/categories
Content-Type: application/json

{
  "settings": [
    {
      "categoryId": "cat-soups",
      "minSelect": 1,
      "maxSelect": 2,
      "isRequired": true,
      "isEnabled": true,
      "displayOrder": 0,
      "customLabel": "Wybierz zupy"
    },
    {
      "categoryId": "cat-mains",
      "minSelect": 1.5,
      "maxSelect": 2,
      "isRequired": true,
      "isEnabled": true,
      "displayOrder": 1,
      "customLabel": "Dania główne"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": [...],
  "message": "Updated 2 category settings"
}
```

#### 8. Lista kategorii dań (globalne)
```http
GET /api/dish-categories
```

---

## 🎨 Frontend

### Struktura plików

```
apps/frontend/
├── types/
│   └── menu.ts                           # TypeScript types
├── lib/
│   └── api/
│       ├── client.ts                     # HTTP client
│       └── menu-packages.ts              # API service
├── components/
│   └── menu/
│       ├── PackageForm.tsx               # Główny formularz
│       └── CategorySettingsSection.tsx   # Sekcja kategorii
└── app/
    └── dashboard/
        └── menu/
            └── packages/
                ├── page.tsx              # Lista pakietów
                ├── new/
                │   └── page.tsx          # Nowy pakiet
                └── [id]/
                    └── page.tsx          # Edycja pakietu
```

### Komponenty

#### `<PackageForm />`
Główny formularz pakietu zawierający:
- Podstawowe informacje (nazwa, opis, ceny)
- `<CategorySettingsSection />` - wybór kategorii dań
- Opcje wyświetlania (isPopular, isRecommended)
- Przyciski akcji (Zapisz/Anuluj)

#### `<CategorySettingsSection />`
**Najważniejszy komponent!** Pozwala na:
- ✅ Wybór kategorii dań (checkboxy)
- 🔢 Ustawienie minSelect i maxSelect (dziesiętne: 0.5, 1, 1.5...)
- ✓ Określenie czy kategoria jest wymagana
- 📝 Dodanie własnej etykiety
- 📊 Podsumowanie wyborów

---

## 🚀 Jak używać

### 1. Uruchom aplikację

```bash
cd /home/kamil/rezerwacje
git pull origin main
docker compose restart backend
docker compose restart frontend
```

### 2. Przejdź do formularza pakietów

```
http://localhost:3000/dashboard/menu/packages?templateId=YOUR_TEMPLATE_ID
```

### 3. Kliknij "+ Dodaj pakiet"

### 4. Wypełnij formularz:

**Krok 1: Podstawowe informacje**
- Nazwa pakietu (np. "Pakiet Standard")
- Krótki opis
- Pełny opis

**Krok 2: Ceny**
- Dorośli: np. 150 zł
- Dzieci (4-12 lat): np. 75 zł
- Maluchy (0-3 lata): np. 0 zł

**Krok 3: 🍽️ Kategorie dań w pakiecie**

Dla każdej kategorii:
1. ✓ Zaznacz checkbox aby włączyć kategorię
2. Ustaw **Min wybory** (np. 1)
3. Ustaw **Max wybory** (np. 2)
4. ✓ Zaznacz "Wymagana" jeśli gość MUSI wybrać z tej kategorii
5. Opcjonalnie: dodaj własną etykietę

**Przykład:**
```
✓ 🍲 Zupy
  Min wybory: 1
  Max wybory: 2
  ✓ Wymagana
  Własna etykieta: "Wybierz zupy (1-2)"

✓ 🥩 Dania główne
  Min wybory: 1.5
  Max wybory: 2
  ✓ Wymagana
  Własna etykieta: "Dania główne"

✓ 🍰 Desery
  Min wybory: 0.5
  Max wybory: 1
  □ Wymagana (opcjonalne)
  Własna etykieta: ""
```

**Krok 4: Opcje wyświetlania**
- ✓ Popularny
- ✓ Polecany
- Kolor: #3B82F6
- Tekst odznaki: "BESTSELLER"

**Krok 5: Zapisz**
- Kliknij "Utwórz pakiet"

---

## 📚 Przykłady

### Przykład 1: Pakiet Standard (Wesele)

```typescript
{
  name: "Pakiet Standard",
  pricePerAdult: 150,
  pricePerChild: 75,
  categorySettings: [
    {
      categoryId: "cat-appetizers",
      minSelect: 2,
      maxSelect: 3,
      isRequired: true,
      customLabel: "Przystawki (wybierz 2-3)"
    },
    {
      categoryId: "cat-soups",
      minSelect: 1,
      maxSelect: 1,
      isRequired: true,
      customLabel: "Zupa"
    },
    {
      categoryId: "cat-mains",
      minSelect: 2,
      maxSelect: 2,
      isRequired: true,
      customLabel: "Dania główne (2 rodzaje mięsa)"
    },
    {
      categoryId: "cat-sides",
      minSelect: 2,
      maxSelect: 3,
      isRequired: true,
      customLabel: "Dodatki"
    },
    {
      categoryId: "cat-desserts",
      minSelect: 1,
      maxSelect: 2,
      isRequired: false,
      customLabel: "Desery (opcjonalnie)"
    }
  ]
}
```

### Przykład 2: Pakiet Premium (Dziesiętne wartości)

```typescript
{
  name: "Pakiet Premium",
  pricePerAdult: 250,
  pricePerChild: 125,
  categorySettings: [
    {
      categoryId: "cat-appetizers",
      minSelect: 3,
      maxSelect: 4,
      isRequired: true
    },
    {
      categoryId: "cat-soups",
      minSelect: 1.5,     // 1.5 porcji!
      maxSelect: 2,
      isRequired: true
    },
    {
      categoryId: "cat-mains",
      minSelect: 2.5,     // 2.5 porcji!
      maxSelect: 3,
      isRequired: true
    },
    {
      categoryId: "cat-seafood",
      minSelect: 0.5,     // 0.5 porcji!
      maxSelect: 1,
      isRequired: false,
      customLabel: "Owoce morza (opcjonalnie)"
    }
  ]
}
```

---

## 🔧 Troubleshooting

### Problem: Nie widzę listy kategorii w formularzu

**Przyczyna:** Brak kategorii dań w bazie danych.

**Rozwiązanie:**
```sql
-- Dodaj przykładowe kategorie
INSERT INTO "DishCategory" (id, slug, name, icon, display_order, is_active)
VALUES
  (uuid_generate_v4(), 'appetizers', 'Przystawki', '🥗', 0, true),
  (uuid_generate_v4(), 'soups', 'Zupy', '🍲', 1, true),
  (uuid_generate_v4(), 'mains', 'Dania główne', '🥩', 2, true),
  (uuid_generate_v4(), 'sides', 'Dodatki', '🥔', 3, true),
  (uuid_generate_v4(), 'desserts', 'Desery', '🍰', 4, true);
```

### Problem: Backend zwraca 501 Not Implemented

**Przyczyna:** Stary kod controllera.

**Rozwiązanie:**
```bash
git pull origin main
docker compose restart backend
```

### Problem: Frontend nie zapisuje kategorii

**Przyczyna:** Brak wywołania `updatePackageCategories`.

**Rozwiązanie:** Sprawdź czy `PackageForm` przekazuje `categorySettings` w payload:
```typescript
const packageData = {
  ...formData,
  categorySettings,  // <-- MUSI być!
};
```

### Problem: TypeScript errors

**Rozwiązanie:**
```bash
cd apps/frontend
npm install
npm run build
```

---

## 🎯 Kluczowe punkty

### ✅ Co działa:

1. **Backend API** - pełny CRUD dla pakietów i kategorii
2. **Bulk update** - synchronizacja wszystkich kategorii jednym requestem
3. **Frontend formularz** - intuicyjny wybór kategorii z kontrolami
4. **Dziesiętne wartości** - minSelect/maxSelect obsługują 0.5, 1.5, 2.5 itp.
5. **Walidacja** - sprawdzanie poprawności danych
6. **TypeScript** - pełne typowanie

### 🔑 Kluczowe endpointy:

```
PUT /api/menu-packages/:packageId/categories  <-- BULK UPDATE!
GET /api/menu-packages/:packageId/categories  <-- POBIERZ KATEGORIE
GET /api/dish-categories                      <-- LISTA KATEGORII
```

### 📝 Kluczowe komponenty:

```tsx
<PackageForm />                    // Główny formularz
<CategorySettingsSection />        // Sekcja wyboru kategorii ⭐
```

---

## 🚀 Quick Start

```bash
# 1. Pull latest changes
git pull origin main

# 2. Restart services
docker compose restart backend frontend

# 3. Open browser
http://localhost:3000/dashboard/menu/packages

# 4. Create your first package!
```

---

## 📞 Support

W razie problemów sprawdź:
1. Logi backendu: `docker compose logs backend`
2. Logi frontendu: `docker compose logs frontend`
3. Console w przeglądarce (F12)
4. Network tab w DevTools

---

**System gotowy do użycia!** 🎉
