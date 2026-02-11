# 🐛 Sesja Bugfix - 11.02.2026

## 📋 Przegląd

**Data:** 11 lutego 2026, 01:35 - 01:55 CET  
**Branch:** `feature/category-api`  
**Kontekst:** Przygotowanie środowiska E2E + naprawy API menu

---

## 🎯 Zidentyfikowane Problemy

### Bug #10: Database Seed - Błędne nazwy pól
**Priorytet:** 🔴 CRITICAL  
**Status:** ✅ FIXED

**Problem:**
```typescript
// e2e-test-data.seed.ts - błędne nazwy pól:
const reservation = await prisma.reservation.findUnique({
  select: {
    adultsCount: true,    // ❌ NIE ISTNIEJE w schema
    childrenCount: true,  // ❌ NIE ISTNIEJE
    toddlersCount: true   // ❌ NIE ISTNIEJE
  }
});
```

**Poprawka:**
```typescript
// Prawidłowe nazwy pól z Prisma schema:
const reservation = await prisma.reservation.findUnique({
  select: {
    adults: true,    // ✅ OK
    children: true,  // ✅ OK
    toddlers: true   // ✅ OK
  }
});
```

**Pliki:**
- `apps/backend/prisma/seeds/e2e-test-data.seed.ts` (line 37-39)
- `apps/backend/src/controllers/reservationMenu.controller.ts` (line 32-37, 61-63)

**Commit:** `7026e65a89f4461d6d3306faa00b5952261cbb92`

---

### Bug #11: E2E Seed - Brakujące pole pricePerPerson
**Priorytet:** 🔴 CRITICAL  
**Status:** ✅ FIXED

**Problem:**
```typescript
// Seed próbował utworzyć Hall bez wymaganego pola:
await prisma.hall.create({
  data: {
    name: "Sala Kryształowa",
    capacity: 200,
    description: "...",
    // ❌ Brak pricePerPerson - wymagane pole!
  }
});
```

**Error:**
```
Argument `pricePerPerson` is missing.
```

**Poprawka:**
```typescript
await prisma.hall.create({
  data: {
    name: "Sala Kryształowa",
    capacity: 200,
    pricePerPerson: 150,  // ✅ Dodane
    description: "..."
  }
});
```

**Commit:** `5d7943cd7742d00334c6570bce75e46c75446680`

---

### Bug #12: E2E Seed - Nieistniejące pole address w Client
**Priorytet:** 🔴 CRITICAL  
**Status:** ✅ FIXED

**Problem:**
```typescript
// Model Client nie ma pola 'address' w schema:
await prisma.client.create({
  data: {
    firstName: "Marek",
    lastName: "Kowalski",
    email: "marek@example.com",
    phone: "+48501234567",
    address: "ul. Słoneczna 10"  // ❌ NIE ISTNIEJE
  }
});
```

**Error:**
```
Unknown argument `address`. Available options are marked with ?.
```

**Poprawka:**
```typescript
// Usunięte pole address:
await prisma.client.create({
  data: {
    firstName: "Marek",
    lastName: "Kowalski",
    email: "marek@example.com",
    phone: "+48501234567",
    notes: "Stały klient"  // ✅ Notes zamiast address
  }
});
```

**Commit:** `6010e34139d6408368f9d366b94e3218d9947252`

---

### Bug #13: Frontend Menu API - Błędny klucz localStorage dla tokena
**Priorytet:** 🔴 CRITICAL  
**Status:** ✅ FIXED

**Problem:**
```typescript
// menu-api.ts używał innego klucza niż api-client.ts:
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');  // ❌ ZŁY KLUCZ
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
});
```

**Rezultat:**
```
GET /api/reservations/{id}/menu 401 (Unauthorized)
```

**Analiza:**
- `api-client.ts` używa: `token` lub `auth_token`
- `menu-api.ts` używał: `access_token` ❌
- Token zapisywany pod kluczem `token` nie był odczytywany

**Poprawka:**
```typescript
// Ujednolicenie z api-client.ts:
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token') || localStorage.getItem('auth_token');  // ✅ OK
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
});
```

**Pliki:**
- `apps/frontend/lib/api/menu-api.ts` (line 35)
- `apps/frontend/lib/api-client.ts` (line 17) - wzorzec

**Commit:** `3ddbd38a6149311a8bd0c6ac0b36d8f714faeac3`

---

## ✅ Rezultaty

### Database Seeds
```bash
🌱 Starting database seeding...
============================================================

🍽️ STEP 1: Seeding dishes...
✅ Created 110 dishes

📝 STEP 2: Seeding menu templates & packages...
✅ Menu Templates: 5
✅ Menu Packages: 8
✅ Category Settings: 43

🧪 STEP 3: Seeding E2E test data...
🏛️  Seeding Halls...
   ✅ Created 6 halls

👥 Seeding Users...
   ✅ Created 3 users

👤 Seeding Clients...
   ✅ Created 5 clients

📅 Seeding Reservations...
   ✅ Created 6 reservations

💰 Seeding Deposits...
   ✅ Created 5 deposits

✅ E2E test data seeding completed!

📊 Summary:
   🏛️  Halls: 6
   👥 Users: 3
   👤 Clients: 5
   📅 Reservations: 6
   💰 Deposits: 5
```

### API Testy
```bash
# Test auth:
POST /api/auth/login
✅ 200 OK - Token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Test menu API z poprawionym tokenem:
GET /api/reservations/{id}/menu
✅ 200 OK - Menu snapshot returned

# Test select-menu endpoint:
POST /api/reservations/{id}/select-menu
✅ 201 Created - Menu saved successfully
```

---

## 📊 E2E Test Data

### Halls (6)
```typescript
[
  { name: 'Sala Kryształowa', capacity: 200, pricePerPerson: 150 },
  { name: 'Sala Taneczna', capacity: 150, pricePerPerson: 130 },
  { name: 'Sala Złota', capacity: 100, pricePerPerson: 120 },
  { name: 'Cały obiekt', capacity: 500, pricePerPerson: 200 },
  { name: 'Strzecha 1', capacity: 80, pricePerPerson: 110 },
  { name: 'Strzecha 2', capacity: 80, pricePerPerson: 110 }
]
```

### Users (3)
```typescript
[
  {
    email: 'admin@gosciniecrodzinny.pl',
    password: 'Admin123!@#',
    role: 'ADMIN',
    firstName: 'Admin',
    lastName: 'Główny'
  },
  {
    email: 'pracownik1@gosciniecrodzinny.pl',
    password: 'Pracownik123!',
    role: 'EMPLOYEE'
  },
  {
    email: 'pracownik2@gosciniecrodzinny.pl',
    password: 'Pracownik123!',
    role: 'EMPLOYEE'
  }
]
```

### Clients (5)
```typescript
[
  { name: 'Marek Kowalski', phone: '+48501234567' },
  { name: 'Anna Nowak', phone: '+48502345678' },
  { name: 'Piotr Wiśniewski', phone: '+48503456789' },
  { name: 'Katarzyna Dąbrowska', phone: '+48504567890' },
  { name: 'Michał Lewandowski', phone: '+48505678901' }
]
```

### Reservations (6)
```typescript
[
  {
    client: 'Marek Kowalski',
    eventType: 'Wesele',
    date: '2026-06-20',
    guests: 140,
    status: 'RESERVED'
  },
  {
    client: 'Anna Nowak',
    eventType: 'Wesele',
    date: '2026-07-15',
    guests: 130,
    status: 'CONFIRMED'
  },
  {
    client: 'Piotr Wiśniewski',
    eventType: 'Komunia',
    date: '2026-05-10',
    guests: 90,
    status: 'RESERVED'
  },
  {
    client: 'Katarzyna Dąbrowska',
    eventType: 'Urodziny',
    date: '2026-04-25',
    guests: 60,
    status: 'RESERVED'
  },
  {
    client: 'Michał Lewandowski',
    eventType: 'Inne (Event firmowy)',
    date: '2026-03-15',
    guests: 80,
    status: 'CONFIRMED'
  },
  {
    client: 'Marek Kowalski',
    eventType: 'Wesele',
    date: '2026-02-20',
    guests: 105,
    status: 'COMPLETED'
  }
]
```

### Deposits (5)
```typescript
[
  { reservationId: 'wesele-1', amount: 5000, status: 'PAID' },
  { reservationId: 'wesele-2', amount: 3500, status: 'PAID' },
  { reservationId: 'komunia', amount: 2000, status: 'PAID' },
  { reservationId: 'event-firmowy', amount: 3000, status: 'PAID' },
  { reservationId: 'wesele-completed', amount: 3000, status: 'PAID' }
]
```

---

## 🔄 Deployment Steps

### 1. Pull Changes
```bash
cd /home/kamil/rezerwacje
git pull origin feature/category-api
```

### 2. Restart Backend
```bash
docker-compose restart backend
```

### 3. Run Seeds
```bash
docker-compose exec backend npm run db:seed
```

### 4. Restart Frontend
```bash
docker-compose restart frontend
```

### 5. Verify
```bash
# Test auth
curl -X POST "http://62.171.189.172:3001/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@gosciniecrodzinny.pl",
    "password": "Admin123!@#"
  }'

# Should return 200 with token
```

---

## 📝 Lessons Learned

### 1. Spójność Nazw Pól
- **Problem:** Backend używał różnych nazw pól w różnych miejscach
- **Rozwiązanie:** Zawsze odwołuj się do Prisma schema jako źródła prawdy
- **Best Practice:** Używaj TypeScript types generowanych przez Prisma

### 2. Ujednolicenie API Clients
- **Problem:** Każdy API client miał własną konfigurację interceptorów
- **Rozwiązanie:** Skonsolidować do jednego `api-client.ts`
- **Best Practice:** DRY - Don't Repeat Yourself dla axios config

### 3. Walidacja Seed Data
- **Problem:** Seedy nie były testowane przed commitowaniem
- **Rozwiązanie:** Uruchamiaj `npm run db:seed` lokalnie przed pushem
- **Best Practice:** Dodaj seed tests do CI/CD pipeline

### 4. Token Management
- **Problem:** Różne klucze localStorage w różnych plikach
- **Rozwiązanie:** Centralne zarządzanie tokenem przez auth context
- **Best Practice:** Single source of truth dla auth state

---

## 🎯 Kolejne Kroki

### Immediate (dzisiaj)
- [ ] Dodaj przycisk zamknięcia do dialogu wyboru menu
- [ ] Obsługa 404 dla brakującego menu (graceful fallback)
- [ ] Testy jednostkowe dla menu API

### Short-term (tydzień)
- [ ] Refactor: Konsolidacja wszystkich API clients
- [ ] Auth context dla centralnego zarządzania tokenem
- [ ] E2E testy dla flow wyboru menu
- [ ] Dokumentacja flow menu selection

### Mid-term (miesiąc)
- [ ] Token refresh mechanism
- [ ] Persistent auth state (refresh token)
- [ ] Error boundary dla menu components
- [ ] Monitoring & alerting dla 401/403 errors

---

## 📚 Związane Dokumenty

- [BUGFIX_SESSION_2026-02-07.md](./BUGFIX_SESSION_2026-02-07.md) - Bug #1-7
- [BUGFIX_SESSION_2026-02-09.md](./BUGFIX_SESSION_2026-02-09.md) - Bug #9 Batch Update
- [API.md](../API.md) - Dokumentacja REST API
- [DATABASE.md](./DATABASE.md) - Schema bazy danych

---

**Status:** ✅ Wszystkie bugi naprawione i zdeployowane  
**Data zakończenia:** 11.02.2026, 01:55 CET  
**Environment:** Production (62.171.189.172)  
**Branch:** feature/category-api → gotowy do merge
