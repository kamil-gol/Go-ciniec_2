# 📝 Postman Collection - Menu System API

**Created:** 2026-02-10  
**Version:** 1.0.0  
**Endpoints:** 22  

---

## 📦 Import do Postman

### Metoda 1: Import z URL (Najszybsza)

1. Otwórz Postman
2. Kliknij **Import** (góra lewy róg)
3. Wybierz zakładkę **Link**
4. Wklej URL:

```
https://raw.githubusercontent.com/kamil-gol/Go-ciniec_2/main/docs/postman/Menu_System_API.postman_collection.json
```

5. Kliknij **Continue** → **Import**

### Metoda 2: Import z Pliku

1. Pobierz plik: [Menu_System_API.postman_collection.json](./Menu_System_API.postman_collection.json)
2. W Postman: **Import** → **Upload Files**
3. Wybierz pobrany plik JSON
4. Kliknij **Import**

---

## ⚙️ Konfiguracja Zmiennych

Kolekcja zawiera predefiniowane zmienne z prawdziwymi ID z seed data:

### Zmienne Zawarte w Kolekcji

| Zmienna | Wartość | Opis |
|---------|--------|------|
| `baseUrl` | `http://localhost:3001` | Adres API |
| `templateId_wedding` | `21067150-841a-4659-9e97-11ce5a4105ac` | Menu Weselne Wiosna 2026 |
| `templateId_birthday` | `e64e0dfa-82ff-453b-867c-e1cf772ea832` | Menu Urodzinowe 2026 |
| `templateId_communion` | `15412c8e-ad65-422b-ac7f-659a73f503ae` | Menu Komunijne 2026 |
| `packageId_gold` | `621db29e-1ec3-4a04-ab64-656c4508b48a` | Pakiet Złoty (Wesele) |
| `packageId_silver` | `497c77e1-3f39-491b-8da8-e247d6ca2031` | Pakiet Srebrny (Wesele) |
| `optionId_openBar` | `7f11bd1e-f0f4-4e5c-b857-795b2038665d` | Bar Open |
| `eventTypeId_wedding` | `1b2f08c1-6c5c-4bb5-8a98-916118ff91b7` | Wesele |
| `eventTypeId_birthday` | `1b7bcb24-f159-4f53-b6ae-047d3fea8db2` | Urodziny |
| `reservationId` | `YOUR_RESERVATION_ID` | **Zmień na prawdziwe ID** |

### Zmiana Zmiennej `reservationId`

**UWAGA:** Przed testowaniem endpointów rezerwacji, zmień `reservationId`:

1. Kliknij na kolekcję **Menu System API**
2. Przejdź do zakładki **Variables**
3. Znajdź `reservationId`
4. W kolumnie **Current Value** wpisz prawdziwe ID rezerwacji
5. Kliknij **Save**

**Jak uzyskać reservation ID:**
```bash
curl http://localhost:3001/api/reservations | jq '.data[0].id'
```

---

## 🚀 Quick Start

### 1. Sprawdź czy API działa

```
GET {{baseUrl}}/api/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-02-10T00:00:00.000Z",
  "uptime": 123.456
}
```

### 2. Pobierz wszystkie menu

```
GET {{baseUrl}}/api/menu-templates
```

**Response:** 3 templates (Wesele, Urodziny, Komunia)

### 3. Pobierz opcje menu

```
GET {{baseUrl}}/api/menu-options
```

**Response:** 32 opcje w 8 kategoriach

---

## 📚 Struktura Kolekcji

### 🏛️ Menu Templates (7 endpoints)

1. **List All Templates** - Wszystkie menu
2. **List Templates by Event Type** - Filtrowanie po typie
3. **List Active Templates** - Tylko aktywne
4. **Get Active Menu for Event Type** - Aktywne dla daty
5. **Get Single Template** - Jedno menu
6. **Create Template** 🔒 - Nowe menu (ADMIN)
7. **Update Template** 🔒 - Edycja (ADMIN)
8. **Duplicate Template** 🔒 - Kopiowanie (ADMIN)
9. **Delete Template** 🔒 - Usuwanie (ADMIN)

### 📦 Menu Packages (7 endpoints)

1. **List Packages by Template** - Pakiety dla menu
2. **Get Single Package** - Jeden pakiet
3. **Create Package** 🔒 - Nowy pakiet (ADMIN)
4. **Update Package** 🔒 - Edycja (ADMIN)
5. **Reorder Packages** 🔒 - Zmiana kolejności (ADMIN)
6. **Assign Options to Package** 🔒 - Przypisz opcje (ADMIN)
7. **Delete Package** 🔒 - Usuwanie (ADMIN)

### ✨ Menu Options (5 endpoints)

1. **List All Options** - Wszystkie opcje
2. **List Options by Category** - Filtrowanie
3. **Search Options** - Wyszukiwanie
4. **Get Single Option** - Jedna opcja
5. **Create Option** 🔒 - Nowa opcja (ADMIN)
6. **Update Option** 🔒 - Edycja (ADMIN)
7. **Delete Option** 🔒 - Usuwanie (ADMIN)

### 🍽️ Reservation Menu Selection (4 endpoints)

1. **Select Menu for Reservation** - Wybór menu
2. **Get Reservation Menu** - Podgląd wybranego menu
3. **Update Guest Counts** - Zmiana liczby gości
4. **Remove Menu Selection** - Usunięcie wyboru

🔒 = Wymaga autoryzacji ADMIN (do implementacji)

---

## 🧪 Testing Workflow

### Scenariusz 1: Przeglądanie Menu (Klient)

```
1. GET /api/menu-templates
   → Pobierz dostępne menu

2. GET /api/menu-templates/active/{eventTypeId}
   → Aktywne menu dla Wesela

3. GET /api/menu-packages/template/{templateId}
   → Pakiety dla wybranego menu

4. GET /api/menu-options?category=Alkohol
   → Opcje z kategorii
```

### Scenariusz 2: Wybór Menu dla Rezerwacji

```
1. GET /api/menu-templates/active/{eventTypeId}
   → Wybierz menu

2. POST /api/reservations/{id}/select-menu
   Body:
   {
     "packageId": "{{packageId_gold}}",
     "selectedOptions": [
       {"optionId": "{{optionId_openBar}}", "quantity": 1}
     ]
   }
   → Zapisz wybór

3. GET /api/reservations/{id}/menu
   → Sprawdź snapshot z cenami
```

### Scenariusz 3: Tworzenie Menu (Admin)

```
1. POST /api/menu-templates
   → Stwórz nowe menu

2. POST /api/menu-packages
   → Dodaj pakiety

3. POST /api/menu-packages/{id}/options
   → Przypisz opcje do pakietów

4. PUT /api/menu-packages/reorder
   → Ustaw kolejność wyświetlania
```

### Scenariusz 4: Aktualizacja Cen (Admin)

```
1. PUT /api/menu-packages/{id}
   Body:
   {
     "pricePerAdult": 350,
     "changeReason": "Sezonowa podwyżka"
   }
   → Cena zaktualizowana + log w historii

2. PUT /api/menu-options/{id}
   Body:
   {
     "priceAmount": 60,
     "changeReason": "Wzrost kosztów"
   }
   → Cena zaktualizowana + log w historii
```

---

## 🔍 Przykłady Requestów

### Filtrowanie Templateów

```http
GET {{baseUrl}}/api/menu-templates?eventTypeId={{eventTypeId_wedding}}&isActive=true
```

### Wyszukiwanie Opcji

```http
GET {{baseUrl}}/api/menu-options?category=Muzyka&search=DJ
```

### Tworzenie Pakietu

```http
POST {{baseUrl}}/api/menu-packages
Content-Type: application/json

{
  "menuTemplateId": "{{templateId_wedding}}",
  "name": "Pakiet VIP",
  "pricePerAdult": 400,
  "pricePerChild": 200,
  "pricePerToddler": 0,
  "includedItems": [
    "Menu 5-daniowe",
    "Wino premium"
  ],
  "isPopular": true,
  "color": "#FFD700",
  "icon": "star"
}
```

### Przypisywanie Opcji

```http
POST {{baseUrl}}/api/menu-packages/{{packageId_gold}}/options
Content-Type: application/json

{
  "options": [
    {
      "optionId": "{{optionId_openBar}}",
      "isRequired": false,
      "isDefault": true,
      "customPrice": 45
    }
  ]
}
```

---

## 📄 Response Format

### Success Response

```json
{
  "success": true,
  "data": { /* entity or array */ },
  "count": 3,  // dla list
  "message": "Optional success message"
}
```

### Error Response

```json
{
  "success": false,
  "error": "Error message",
  "details": [ /* validation errors (Zod) */ ]
}
```

### Menu Snapshot Response

```json
{
  "success": true,
  "data": {
    "snapshot": {
      "menuData": { /* immutable snapshot */ },
      "adultsCount": 100,
      "childrenCount": 20,
      "toddlersCount": 5
    },
    "priceBreakdown": {
      "packageCost": {
        "adults": { "count": 100, "priceEach": 300, "total": 30000 },
        "children": { "count": 20, "priceEach": 150, "total": 3000 },
        "toddlers": { "count": 5, "priceEach": 0, "total": 0 },
        "subtotal": 33000
      },
      "optionsCost": [
        {
          "option": "Bar Open",
          "priceType": "PER_PERSON",
          "priceEach": 50,
          "quantity": 125,
          "total": 6250
        }
      ],
      "optionsSubtotal": 6250,
      "totalMenuPrice": 39250
    }
  }
}
```

---

## ⚙️ Environment Variables (Opcjonalne)

Możesz stworzyć osobne environment dla różnych środowisk:

### Development
```json
{
  "name": "Menu API - Development",
  "values": [
    {"key": "baseUrl", "value": "http://localhost:3001"},
    {"key": "apiToken", "value": "dev-token-here"}
  ]
}
```

### Production
```json
{
  "name": "Menu API - Production",
  "values": [
    {"key": "baseUrl", "value": "https://api.gociniec.pl"},
    {"key": "apiToken", "value": "prod-token-here"}
  ]
}
```

---

## 🐛 Troubleshooting

### Problem: "404 Not Found"

**Rozwiązanie:**
```bash
# Sprawdź czy backend działa
curl http://localhost:3001/api/health

# Sprawdź czy routes są zarejestrowane
docker compose logs backend | grep "Menu System"
```

### Problem: "Internal Server Error" dla templates

**Rozwiązanie:**
```bash
# Sprawdź logi
docker compose logs backend --tail=50

# Powinno być naprawione (icon field)
git pull origin main
docker compose restart backend
```

### Problem: "Cannot find module"

**Rozwiązanie:**
```bash
# Rebuild backend
docker compose down
docker compose up -d --build backend
```

### Problem: Brak danych (puste [])

**Rozwiązanie:**
```bash
# Uruchom seed
docker compose exec backend npx tsx prisma/seeds/menu.seed.ts

# Sprawdź
curl http://localhost:3001/api/menu-templates
```

---

## 📊 Status Kodów HTTP

| Kod | Znaczenie | Kiedy |
|-----|-----------|-------|
| `200` | OK | Sukces (GET, PUT, DELETE) |
| `201` | Created | Sukces (POST) |
| `400` | Bad Request | Błędne dane (Zod validation) |
| `404` | Not Found | Nie znaleziono zasobu |
| `409` | Conflict | Konflikt (np. usuwanie używanego) |
| `500` | Server Error | Błąd serwera |

---

## 📚 Dokumentacja API

- **GitHub:** [Menu System Docs](https://github.com/kamil-gol/Go-ciniec_2/tree/main/docs)
- **Schema:** [Prisma Schema](../../prisma/schema.prisma)
- **Types:** [TypeScript Types](../../apps/backend/src/types/menu.types.ts)
- **Validation:** [Zod Schemas](../../apps/backend/src/validation/menu.validation.ts)

---

## 🚀 Next Steps

1. ✅ Zaimportuj kolekcję
2. ✅ Ustaw `reservationId`
3. ✅ Przetestuj wszystkie endpointy
4. 📘 Dodaj authorization header (gdy auth będzie gotowe)
5. 📘 Utwórz własne testy/scenariusze
6. 📘 Integruj z frontendem

---

**Created:** 2026-02-10  
**Author:** Menu System Team  
**Version:** 1.0.0  
