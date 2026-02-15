# Audit Log - Dokumentacja Implementacji

## 📋 Przegląd

Implementacja systemu logowania audytu (Audit Trail) dla aplikacji Gościniec - pełna historia wszystkich zmian w systemie.

**Branch:** `feat/audit-log-frontend`  
**Data:** 15 lutego 2026  
**Status:** ⚠️ W trakcie debugowania - problem z routingiem

---

## ✅ Co Zostało Zaimplementowane

### Backend

#### 1. Routes (`apps/backend/src/routes/audit-log.routes.ts`)
- `GET /api/audit-log` - lista logów z filtrami i paginacją
- `GET /api/audit-log/recent` - ostatnie N logów
- `GET /api/audit-log/statistics` - statystyki
- `GET /api/audit-log/meta/entity-types` - dostępne typy encji
- `GET /api/audit-log/meta/actions` - dostępne akcje
- `GET /api/audit-log/entity/:entityType/:entityId` - logi dla konkretnej encji

#### 2. Controller (`apps/backend/src/controllers/audit-log.controller.ts`)
Obsługuje wszystkie endpointy API z odpowiednią walidacją i obsługą błędów.

#### 3. Service (`apps/backend/src/services/audit-log.service.ts`)
Logika biznesowa:
- Filtrowanie logów (entityType, action, userId, entityId, dateRange)
- Paginacja (page, pageSize)
- Agregacja statystyk
- Pobieranie metadanych (dostępne typy i akcje)

#### 4. Rejestracja w `server.ts`
```typescript
import auditLogRoutes from '@/routes/audit-log.routes';
app.use('/api/audit-log', auditLogRoutes);
```

✅ **Backend działa poprawnie** - potwierdzone logami:
```
[2026-02-15T20:00:12.000Z] INFO - GET /api/audit-log/recent
[2026-02-15T20:00:12.000Z] INFO - GET /api/audit-log/meta/entity-types
[2026-02-15T20:00:12.000Z] INFO - GET /api/audit-log/meta/actions
```

### Frontend

#### 1. Strona (`apps/frontend/src/app/dashboard/audit-log/page.tsx`)
Główny komponent strony z:
- Nagłówkiem
- Statystykami
- Filtrami
- Tabelą z paginacją

#### 2. Komponenty (`apps/frontend/src/components/audit-log/`)
- `AuditLogStats.tsx` - statystyki (liczniki, wykresy)
- `AuditLogFilters.tsx` - filtry (akcja, typ, daty)
- `AuditLogTable.tsx` - tabela z logami

#### 3. Hooks (`apps/frontend/src/hooks/use-audit-log.ts`)
React Query hooks do pobierania danych:
- `useAuditLogs(filters)` - główna lista
- `useRecentAuditLogs(limit)` - ostatnie logi
- `useAuditLogStatistics()` - statystyki
- `useEntityTypes()` - typy encji
- `useActions()` - akcje
- `useEntityAuditLogs(type, id)` - logi encji

#### 4. Typy (`apps/frontend/src/types/audit-log.types.ts`)
TypeScript definitions dla audit log.

---

## 🐛 Znalezione Problemy

### Problem #1: Podwójny `/api/` w URL

**Symptom:**
```
404 Not Found: GET /api/api/audit-log/meta/actions
404 Not Found: GET /api/api/audit-log/statistics
```

**Przyczyna:**  
Hooks w `use-audit-log.ts` używały pełnych ścieżek z `/api/` prefix:
```typescript
// ❌ Błędnie
const response = await api.get('/api/audit-log/statistics');
```

Ale `api` client już miał base URL z `/api/`, więc URL się dublował.

**Rozwiązanie:**  
Commit: [`99ebf99`](https://github.com/kamil-gol/Go-ciniec_2/commit/99ebf990e526fbbb1e61ac56130a5779e6d632b5)

Usunięto `/api/` prefix ze wszystkich endpointów:
```typescript
// ✅ Poprawnie
const response = await api.get('/audit-log/statistics');
const response = await api.get('/audit-log/meta/actions');
const response = await api.get('/audit-log/recent?limit=${limit}');
```

**Status:** ✅ Naprawione w kodzie (wymaga pull + restart na serwerze)

---

## 🚀 Deploy

### Kroki do zastosowania fix'a:

```bash
cd /home/kamil/rezerwacje

# Pull najnowszych zmian
git pull origin feat/audit-log-frontend

# Zrestartuj frontend
docker-compose restart frontend

# Sprawdź logi
docker-compose logs -f frontend
```

### Weryfikacja:

1. Otwórz: `https://gosciniec.duckdns.org/dashboard/audit-log`
2. Sprawdź Console (F12) - powinny być requesty:
   - `GET /api/audit-log/recent` ✅
   - `GET /api/audit-log/statistics` ✅
   - `GET /api/audit-log/meta/actions` ✅
   - `GET /api/audit-log/meta/entity-types` ✅

---

## 📊 Struktura Bazy Danych

### Tabela `ActivityLog`

```prisma
model ActivityLog {
  id          String    @id @default(uuid())
  userId      String?
  action      String    // CREATE, UPDATE, DELETE, etc.
  entityType  String?   // CLIENT, RESERVATION, MENU, etc.
  entityId    String?
  details     Json?
  ipAddress   String?
  userAgent   String?
  createdAt   DateTime  @default(now())
  user        User?     @relation(fields: [userId], references: [id])
}
```

**Statusy:**
- ✅ Tabela istnieje w bazie
- ✅ Backend queries działają
- ⚠️ Brak testowych danych (tabela może być pusta)

---

## 🔍 Debugging

### Sprawdzenie logów backendu:
```bash
docker-compose logs backend --tail=100 | grep audit-log
```

### Sprawdzenie danych w bazie:
```sql
-- W psql
SELECT COUNT(*) FROM "ActivityLog";
SELECT * FROM "ActivityLog" ORDER BY "createdAt" DESC LIMIT 10;
```

### Test API bezpośrednio:
```bash
# Zaloguj się
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@gosciniecrodzinny.pl","password":"Admin123!@#"}'

# Użyj tokena
curl -H "Authorization: Bearer <TOKEN>" \
  http://localhost:3001/api/audit-log/meta/actions
```

---

## 📝 TODO

- [ ] Pull + restart frontend na serwerze produkcyjnym
- [ ] Zweryfikować działanie w przeglądarce
- [ ] Dodać testowe dane do `ActivityLog` jeśli pusta
- [ ] Przetestować wszystkie filtry
- [ ] Dodać testy jednostkowe
- [ ] Merge do `main` po weryfikacji

---

## 🎯 Funkcjonalności

### Filtry
- ✅ Typ akcji (CREATE, UPDATE, DELETE, etc.)
- ✅ Typ encji (CLIENT, RESERVATION, MENU, etc.)
- ✅ Zakres dat (od-do)
- ✅ Paginacja (strona + rozmiar)

### Statystyki
- ✅ Łączna liczba logów
- ✅ Podział po typie encji
- ✅ Podział po akcjach
- ✅ Top 10 użytkowników po aktywności

### Widoki
- ✅ Tabela z pełną historią
- ✅ Widget z ostatnimi logami (dla dashboard)
- ✅ Historia zmian dla konkretnej encji

---

## 📚 Powiązane Pliki

### Backend
- `apps/backend/src/routes/audit-log.routes.ts`
- `apps/backend/src/controllers/audit-log.controller.ts`
- `apps/backend/src/services/audit-log.service.ts`
- `apps/backend/src/server.ts` (rejestracja routes)

### Frontend
- `apps/frontend/src/app/dashboard/audit-log/page.tsx`
- `apps/frontend/src/hooks/use-audit-log.ts`
- `apps/frontend/src/components/audit-log/*.tsx`
- `apps/frontend/src/types/audit-log.types.ts`

---

## ⚠️ Znane Problemy

1. **Route Not Found (404)** - wymaga pull + restart na serwerze
2. **Brak danych testowych** - tabela może być pusta
3. **CORS warnings** - do sprawdzenia po deploy

---

## 📞 Kontakt

W razie problemów:
1. Sprawdź logi: `docker-compose logs backend frontend`
2. Sprawdź Console w przeglądarce (F12)
3. Sprawdź czy backend odpowiada: `curl http://localhost:3001/api/audit-log/meta/actions`
