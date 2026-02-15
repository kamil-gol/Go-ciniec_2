# 📋 Moduł Dziennik Audytu (Audit Log)

**Data utworzenia:** 15.02.2026  
**Status:** ✅ Kompletny  
**Sprint:** 9 — Audit & Monitoring  

---

## 📌 Przegląd

Moduł Dziennik Audytu rejestruje i wyświetla historię wszystkich zmian w systemie. Każda operacja (utworzenie, edycja, usunięcie, zmiana statusu, archiwizacja) jest automatycznie logowana z informacjami o użytkowniku, typie obiektu i szczegółach zmiany.

### Kluczowe funkcje

- ✅ **Automatyczne logowanie** — każda zmiana w systemie tworzy wpis audit log
- ✅ **Paginacja** — wydajne ładowanie danych z backendu
- ✅ **Filtry** — filtrowanie po akcji, typie obiektu, dacie, użytkowniku
- ✅ **Statystyki** — podsumowanie: łączne wpisy, najczęstsza akcja, typ, aktywni użytkownicy
- ✅ **Szczegóły wpisu** — modal z pełnymi informacjami (opis, powód, dane techniczne)
- ✅ **Kolorowe badge** — wizualne rozróżnienie typów akcji
- ✅ **Dark mode** — pełne wsparcie trybu ciemnego
- ✅ **Design tokens** — spójny z resztą systemu (zinc/slate palette)

---

## 🏗️ Architektura

### Backend

```
apps/backend/src/
├── controllers/
│   └── audit-log.controller.ts    # Obsługa żądań HTTP
├── services/
│   └── audit-log.service.ts       # Logika biznesowa + Prisma queries
├── routes/
│   └── audit-log.routes.ts        # Definicje endpointów
└── middlewares/
    └── audit.ts                   # Middleware do auto-logowania
```

### Frontend

```
apps/frontend/
├── app/dashboard/audit-log/
│   └── page.tsx                   # Strona główna modułu
├── components/audit-log/
│   ├── AuditLogTable.tsx          # Tabela z wpisami
│   ├── AuditLogDetails.tsx        # Modal szczegółów wpisu
│   ├── AuditLogFilters.tsx        # Komponent filtrów
│   └── AuditLogStats.tsx          # Karty statystyk
├── hooks/
│   └── use-audit-log.ts           # React Query hooks
├── lib/api/
│   └── audit-log-api.ts           # Klient API
└── types/
    └── audit-log.types.ts         # TypeScript types
```

---

## 📡 API Endpoints

### Base URL

```
GET /api/audit-log
```

### Lista wpisów (z paginacją i filtrami)

```http
GET /api/audit-log?page=1&pageSize=20&action=STATUS_CHANGE&entityType=RESERVATION
```

**Query Parameters:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `page` | number | ❌ | Numer strony (domyślnie: 1) |
| `pageSize` | number | ❌ | Rozmiar strony (domyślnie: 20) |
| `action` | string | ❌ | Filtr po akcji |
| `entityType` | string | ❌ | Filtr po typie obiektu |
| `startDate` | ISO date | ❌ | Data od |
| `endDate` | ISO date | ❌ | Data do |

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "action": "STATUS_CHANGE",
      "entityType": "RESERVATION",
      "entityId": "uuid",
      "details": {
        "description": "Zmiana statusu rezerwacji: PENDING → CONFIRMED",
        "reason": "Klient potwierdził",
        "changes": { "status": { "old": "PENDING", "new": "CONFIRMED" } }
      },
      "ipAddress": "192.168.1.1",
      "userAgent": "Mozilla/5.0...",
      "createdAt": "2026-02-15T21:55:42.000Z",
      "user": {
        "id": "uuid",
        "firstName": "Admin",
        "lastName": "Główny",
        "email": "admin@gosciniecrodzinny.pl"
      }
    }
  ],
  "total": 42,
  "page": 1,
  "pageSize": 20,
  "totalPages": 3
}
```

### Statystyki

```http
GET /api/audit-log/statistics
```

**Response:**
```json
{
  "totalLogs": 42,
  "byAction": [
    { "action": "STATUS_CHANGE", "count": 15 },
    { "action": "ARCHIVE", "count": 10 }
  ],
  "byEntityType": [
    { "entityType": "RESERVATION", "count": 30 },
    { "entityType": "CLIENT", "count": 8 }
  ],
  "byUser": [
    { "userId": "uuid", "firstName": "Admin", "lastName": "Główny", "count": 35 }
  ]
}
```

### Dostępne akcje

```http
GET /api/audit-log/actions
```

**Response:** `["ARCHIVE", "UNARCHIVE", "CREATE", "UPDATE", "DELETE", "STATUS_CHANGE"]`

### Dostępne typy obiektów

```http
GET /api/audit-log/entity-types
```

**Response:** `["RESERVATION", "CLIENT", "HALL", "DEPOSIT", "EVENT_TYPE"]`

---

## 🎨 Frontend — Komponenty

### Strona główna (`page.tsx`)

- **PageHero** — nagłówek z gradientem zinc/slate
- **StatCard x4** — wszystkie wpisy, najczęstsza akcja, typ, aktywni użytkownicy
- **Rozwijane filtry** — toggle z przyciskiem "Filtry"
- **Tabela wpisów** — data, użytkownik, akcja (badge), typ, opis
- **Paginacja** — nawigacja między stronami

### Modal szczegółów (`AuditLogDetails.tsx`)

- **Gradient header** — zinc-800 z ikoną FileText i datą
- **Przycisk zamknięcia (X)** — w prawym górnym rogu headera
- **Info grid 2x2** — data/czas, użytkownik, akcja, typ obiektu
- **Sekcja szczegółów** — opis, powód, dane techniczne (JSON)
- **Informacje techniczne** — IP, przeglądarka, ID wpisu

### Tabela (`AuditLogTable.tsx`)

- Kliknięcie wiersza otwiera modal szczegółów
- Kolorowe badge dla akcji (np. zielony = przywrócenie, fioletowy = zmiana statusu)
- Responsywne — truncate na małych ekranach

### Filtry (`AuditLogFilters.tsx`)

- Select: akcja, typ obiektu
- DatePicker: zakres dat (od–do)
- Przycisk "Wyczyść filtry"

---

## 🏷️ Typy akcji

| Akcja | Label PL | Kolor Badge |
|-------|----------|-------------|
| `CREATE` | Utworzenie | 🔵 Niebieski |
| `UPDATE` | Aktualizacja | 🟡 Żółty |
| `DELETE` | Usunięcie | 🔴 Czerwony |
| `STATUS_CHANGE` | Zmiana statusu | 🟣 Fioletowy |
| `ARCHIVE` | Archiwizacja | 🟠 Pomarańczowy |
| `UNARCHIVE` | Przywrócenie | 🟢 Zielony |
| `RESTORE` | Przywrócenie | 🟢 Zielony |
| `LOGIN` | Logowanie | 🔷 Jasno-niebieski |
| `LOGOUT` | Wylogowanie | ⚪ Szary |

## 📊 Typy obiektów

| Typ | Label PL |
|-----|----------|
| `RESERVATION` | Rezerwacja |
| `CLIENT` | Klient |
| `HALL` / `ROOM` | Sala |
| `MENU` | Menu |
| `USER` | Użytkownik |
| `DEPOSIT` | Zaliczka |
| `EVENT_TYPE` | Typ wydarzenia |

---

## 🔗 Integracja z systemem

### Menu boczne

Link "Dziennik Audytu" w menu nawigacyjnym:
- Ikona: `FileText` (lucide-react)
- Route: `/dashboard/audit-log`
- Dostęp: Staff (ADMIN + EMPLOYEE)

### Automatyczne logowanie

Middleware `audit.ts` automatycznie tworzy wpisy dla:
- Tworzenie/edycja/usunięcie rezerwacji
- Zmiana statusu rezerwacji
- Archiwizacja/przywrócenie rezerwacji
- Operacje na klientach, salach, zaliczkach
- Logowanie/wylogowanie użytkowników

### Design Tokens

```typescript
// lib/design-tokens.ts
auditLog: {
  gradient: 'from-zinc-600 to-slate-600',
  gradientSubtle: 'from-zinc-50/50 to-slate-50/50',
  iconBg: 'from-zinc-600 to-slate-600',
  badge: 'bg-zinc-100',
  badgeText: 'text-zinc-700',
}
```

---

## 📝 Schemat bazy danych

```sql
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(100) NOT NULL,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at);
```

---

## 🐛 Naprawione bugi

### Bug: Modal bez przycisku zamknięcia (15.02.2026)

**Problem:** `AuditLogDetails` nie przekazywał `onClose` do `DialogContent`, więc nie renderował się przycisk X.  
**Fix:** Dodano `onClose={onClose}` + własny przycisk X w gradientowym headerze.  
**Plik:** `components/audit-log/AuditLogDetails.tsx`

### Bug: Brzydki wygląd modalu (15.02.2026)

**Problem:** Domyślny styl Dialog bez customizacji — brak gradientu, płaskie karty.  
**Fix:** Pełny redesign:
- Gradient header (zinc-800 → slate-700)
- Info cards z ikonami w kółkach
- Sekcja szczegółów z wydzielonym headerem
- Informacje techniczne w dashed border
- Dark mode support

---

## 📅 Historia zmian

| Data | Wersja | Zmiany |
|------|--------|--------|
| 15.02.2026 | 1.0 | Utworzenie modułu: backend + frontend |
| 15.02.2026 | 1.1 | Redesign z PageHero, StatCard, design tokens |
| 15.02.2026 | 1.2 | Fix: przycisk zamknięcia modalu + redesign |

---

**Ostatnia aktualizacja:** 15.02.2026  
**Autor:** System  
**Status:** ✅ Kompletny
