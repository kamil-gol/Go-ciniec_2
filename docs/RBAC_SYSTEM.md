# 🔐 System RBAC — Role-Based Access Control

> **Status:** ✅ COMPLETED — Sprint 6 (16.02.2026, 21:22 CET)

## Architektura

### Modele bazodanowe

```
User ──→ Role ──→ RolePermission ──→ Permission
                  (many-to-many)
```

- **User** — użytkownik systemu, powiązany z jedną rolą (`roleId`)
- **Role** — nazwana rola (np. Administrator, Kierownik, Pracownik)
- **Permission** — granularne uprawnienie (np. `reservations:create`)
- **RolePermission** — tabela łącząca rolę z uprawnieniami (M:N)
- **CompanySettings** — singleton z danymi firmy

### Format uprawnień

```
moduł:akcja
```

Przykłady:
- `reservations:view` — podgląd rezerwacji
- `reservations:create` — tworzenie rezerwacji
- `menu:manage_templates` — zarządzanie szablonami menu
- `settings:manage_roles` — zarządzanie rolami i uprawnieniami

## Role systemowe

| Rola | Slug | Kolor | Uprawnień | Opis |
|------|------|-------|-----------|------|
| Administrator | `admin` | 🔴 #ef4444 | 42 | Pełny dostęp |
| Kierownik | `manager` | 🔵 #3b82f6 | 39 | Wszystko oprócz ról i systemu |
| Pracownik | `employee` | 🟢 #10b981 | 17 | Codzienna obsługa |
| Podgląd | `viewer` | ⚫ #6b7280 | 9 | Tylko odczyt |
| Koordynator | `koordynator` | 🟡 #f59e0b | 0 | Custom rola (do konfiguracji) |

Role systemowe (`isSystem: true`) nie mogą być usunięte. Można tworzyć dodatkowe role niestandardowe.

## Moduły i uprawnienia

### 13 modułów, 49 uprawnień

| Moduł | Uprawnienia |
|-------|------------|
| **Dashboard** (1) | `view` |
| **Rezerwacje** (8) | `view`, `create`, `update`, `delete`, `archive`, `export_pdf`, `manage_menu`, `view_financial` |
| **Archiwum** (2) | `view`, `restore` |
| **Klienci** (4) | `view`, `create`, `update`, `delete` |
| **Sale** (4) | `view`, `create`, `update`, `delete` |
| **Menu** (6) | `view`, `create`, `update`, `delete`, `manage_categories`, `manage_options` |
| **Kolejka** (3) | `view`, `manage`, `config` |
| **Zaliczki** (5) | `view`, `create`, `update`, `delete`, `mark_paid` |
| **Typy wydarzeń** (4) | `view`, `create`, `update`, `delete` |
| **Załączniki** (3) | `view`, `upload`, `delete` |
| **Dziennik audytu** (1) | `view` |
| **Raporty** (3) | `view`, `export_excel`, `export_pdf` |
| **Ustawienia** (5) | `view`, `manage_users`, `manage_roles`, `manage_company`, `manage_system` |

## Middleware

### `requirePermission(...permissions)`
Wymaga **wszystkich** podanych uprawnień:
```typescript
router.delete('/:id', authMiddleware, requirePermission('reservations:delete'), controller.delete);
```

### `requireAnyPermission(...permissions)`
Wymaga **co najmniej jednego** z podanych uprawnień:
```typescript
router.put('/:id', authMiddleware, requireAnyPermission('menu:manage_templates', 'menu:manage_packages'), controller.update);
```

### `attachPermissionCheck(...permissions)`
Nie blokuje — dołącza wynik sprawdzenia do `req.permissionResults`:
```typescript
router.get('/:id', authMiddleware, attachPermissionCheck('reservations:delete'), controller.get);
// W kontrolerze: req.permissionResults['reservations:delete'] === true/false
```

## Cache

Uprawnienia użytkownika są cachowane w pamięci (TTL: 5 min). Cache jest automatycznie invalidowany przy:
- Zmianie roli użytkownika
- Modyfikacji uprawnień roli
- Ręcznym wywołaniu `invalidatePermissionCache(userId)` lub `invalidateAllPermissionCaches()`

## Migracja z legacy

System zachowuje backward compatibility:
1. Pole `legacyRole` (mapowane na kolumnę `role` w DB) — istniejące dane
2. Nowe pole `roleId` — wskazuje na tabelę `Role`
3. Seed automatycznie migruje: `ADMIN` → admin, `EMPLOYEE` → employee
4. Middleware obsługuje oba systemy — jeśli `roleId` jest null, fallback na legacy

## API Endpoints

### Users
```http
GET    /api/settings/users                 # Lista użytkowników (filtrowanie, wyszukiwanie)
POST   /api/settings/users                 # Utwórz użytkownika
PUT    /api/settings/users/:id             # Edytuj użytkownika
PATCH  /api/settings/users/:id/password    # Zmień hasło
PATCH  /api/settings/users/:id/toggle-active  # Aktywuj/dezaktywuj
DELETE /api/settings/users/:id             # Usuń użytkownika (soft-delete)
```

### Roles
```http
GET    /api/settings/roles                 # Lista ról (z liczbą użytkowników)
POST   /api/settings/roles                 # Utwórz rolę
PUT    /api/settings/roles/:id             # Edytuj rolę
PUT    /api/settings/roles/:id/permissions # Zaktualizuj uprawnienia roli
DELETE /api/settings/roles/:id             # Usuń rolę (jeśli nie systemowa)
```

### Permissions
```http
GET    /api/settings/permissions           # Wszystkie uprawnienia (flat list)
GET    /api/settings/permissions/grouped   # Pogrupowane po modułach
```

### Company Settings
```http
GET    /api/settings/company               # Dane firmy
PUT    /api/settings/company               # Zaktualizuj dane firmy
```

## Struktura plików

### Backend
```
apps/backend/
├── prisma/
│   ├── schema.prisma              # Modele Role, Permission, RolePermission, CompanySettings
│   └── seeds/rbac.seed.ts         # Seed uprawnień i ról
├── src/
│   ├── constants/permissions.ts   # Stałe, definicje, mapy modułów
│   ├── middlewares/permissions.ts  # requirePermission(), requireAnyPermission()
│   ├── types/settings.types.ts    # Typy TS dla RBAC
│   ├── controllers/
│   │   ├── users.controller.ts
│   │   ├── roles.controller.ts
│   │   ├── permissions.controller.ts
│   │   └── company-settings.controller.ts
│   ├── services/
│   │   ├── users.service.ts
│   │   ├── roles.service.ts
│   │   ├── permissions.service.ts
│   │   └── company-settings.service.ts
│   └── routes/
│       └── settings.routes.ts         # Wszystkie endpointy /api/settings/*
```

### Frontend
```
apps/frontend/
├── app/dashboard/settings/page.tsx    # Strona Ustawienia (3 taby)
├── components/settings/
│   ├── UsersTab.tsx                   # Tab użytkowników
│   ├── UserFormDialog.tsx             # Dialog dodawania/edycji użytkownika
│   ├── ChangePasswordDialog.tsx       # Dialog zmiany hasła
│   ├── RolesTab.tsx                   # Tab ról (z macierzą uprawnień)
│   ├── RoleFormDialog.tsx             # Dialog dodawania/edycji roli
│   └── CompanyTab.tsx                 # Tab danych firmy
└── lib/api/settings.ts                # API client (users, roles, permissions, company)
```

## Frontend Features

### 1. Zarządzanie użytkownikami (UsersTab)
- ✅ Tabela z filtrowaniem i wyszukiwaniem
- ✅ Dodawanie nowego użytkownika (email, hasło, imię, nazwisko, rola)
- ✅ Edycja istniejącego użytkownika
- ✅ Zmiana hasła (przez admina lub własnego)
- ✅ Toggle aktywności (soft-delete)
- ✅ Usuwanie użytkowników (z potwierdzeniem)
- ✅ Badge z rolą (kolorowy)
- ✅ Data ostatniego logowania

### 2. Role i uprawnienia (RolesTab)
- ✅ Lista ról z liczbą użytkowników
- ✅ Rozwijana macierz uprawnień per rola
- ✅ Checkboxy dla każdego uprawnienia
- ✅ Bulk select/deselect per moduł
- ✅ Dodawanie custom roli
- ✅ Edycja nazwy/opisu/koloru
- ✅ Usuwanie ról niestandardowych
- ✅ Ochrona systemowych ról (nie można usunąć)

### 3. Dane firmy (CompanyTab)
- ✅ Formularz z danymi firmy
  - Nazwa, NIP, REGON
  - Adres (ulica, kod, miasto)
  - Telefon, email, strona www
  - Waluta i strefa czasowa
  - Prefixy faktur i paragonów
- ✅ Walidacja NIP/REGON
- ✅ Zapis z potwierdzeniem

## Przykłady użycia

### Backend: walidacja uprawnień

```typescript
import { requirePermission, requireAnyPermission } from '@middlewares/permissions'
import { authMiddleware } from '@middlewares/auth'

// Wymaga konkretnego uprawnienia
router.post('/reservations', 
  authMiddleware, 
  requirePermission('reservations:create'), 
  controller.create
)

// Wymaga jednego z uprawnień
router.get('/menu', 
  authMiddleware,
  requireAnyPermission('menu:view', 'menu:manage_templates'),
  controller.list
)

// Sprawdza uprawnienie bez blokowania
router.get('/reservations/:id',
  authMiddleware,
  attachPermissionCheck('reservations:delete', 'reservations:archive'),
  controller.get
)
```

### Frontend: tworzenie użytkownika

```typescript
import { settingsApi } from '@/lib/api/settings'

const createUser = async () => {
  const newUser = await settingsApi.createUser({
    email: 'nowak@example.com',
    password: 'SecurePass123!',
    firstName: 'Jan',
    lastName: 'Nowak',
    roleId: 'employee-role-uuid'
  })
  
  console.log(newUser.role) // { id, name, slug, color }
}
```

### Frontend: aktualizacja uprawnień roli

```typescript
import { settingsApi } from '@/lib/api/settings'

const updateRolePermissions = async (roleId: string) => {
  const permissions = await settingsApi.getPermissions()
  
  // Wybierz uprawnienia dla pracownika
  const employeePerms = permissions.filter(p => 
    p.slug.startsWith('reservations:view') ||
    p.slug.startsWith('clients:view') ||
    p.slug.startsWith('menu:view')
  )
  
  const updated = await settingsApi.updateRolePermissions(
    roleId, 
    employeePerms.map(p => p.id)
  )
  
  console.log(`Zaktualizowano ${updated.permissions.length} uprawnień`)
}
```

## Audit Log Integration

Wszystkie akcje RBAC są logowane w dzienniku audytu:
- `USER_CREATED`, `USER_UPDATED`, `USER_PASSWORD_CHANGED`, `USER_ACTIVATED`, `USER_DEACTIVATED`, `USER_DELETED`
- `ROLE_CREATED`, `ROLE_UPDATED`, `ROLE_DELETED`, `ROLE_PERMISSIONS_UPDATED`
- `COMPANY_SETTINGS_UPDATED`

Przykład wpisu:
```json
{
  "userId": "admin-uuid",
  "action": "USER_CREATED",
  "entityType": "User",
  "entityId": "new-user-uuid",
  "details": {
    "email": "nowak@example.com",
    "role": "Pracownik"
  },
  "ipAddress": "192.168.1.100",
  "userAgent": "Mozilla/5.0..."
}
```

## Security Best Practices

1. **Hasła:**
   - Minimalnie 8 znaków
   - Walidacja po stronie backendu (`validatePassword()` w `utils/password.ts`)
   - Hashowanie bcrypt (cost factor: 10)

2. **Tokeny JWT:**
   - TTL: 24h
   - Przechowywane w localStorage
   - Middleware `authMiddleware` weryfikuje przy każdym requeście

3. **Ochrona endpointów:**
   - Wszystkie `/api/settings/*` wymagają `authMiddleware`
   - Zarządzanie użytkownikami: `settings:manage_users`
   - Zarządzanie rolami: `settings:manage_roles`
   - Dane firmy: `settings:manage_company`

4. **Soft-delete:**
   - Użytkownicy nie są usuwani fizycznie
   - `isActive: false` zamiast `DELETE`
   - Możliwa reaktywacja

5. **Cache invalidation:**
   - Automatyczna po każdej zmianie uprawnień
   - Uniemożliwia stale uprawnienia

## Status implementacji

### ✅ COMPLETED (Sprint 6 - 16.02.2026)

**Backend:**
- ✅ Prisma schema (Role, Permission, RolePermission, CompanySettings)
- ✅ Seed script z 5 rolami i 49 uprawnieniami
- ✅ Middleware: `requirePermission()`, `requireAnyPermission()`, `attachPermissionCheck()`
- ✅ Cache z TTL 5min + invalidation
- ✅ Settings API:
  - Users CRUD + change password + toggle active
  - Roles CRUD + permissions update
  - Permissions list + grouped
  - Company settings CRUD
- ✅ Audit log integration

**Frontend:**
- ✅ Strona `/dashboard/settings` z 3 tabami
- ✅ UsersTab:
  - Tabela z filtrowaniem
  - Dialog dodawania/edycji
  - Dialog zmiany hasła
  - Toggle aktywności
  - Usuwanie z potwierdzeniem
- ✅ RolesTab:
  - Lista ról
  - Rozwijana macierz uprawnień
  - Bulk select/deselect per moduł
  - Dialog dodawania/edycji
  - Usuwanie niestandardowych
- ✅ CompanyTab:
  - Formularz z wszystkimi polami
  - Walidacja NIP/REGON
  - Zapis z potwierdzeniem
- ✅ API client (`lib/api/settings.ts`)
- ✅ TypeScript types matching backend

### Następne kroki (opcjonalne rozszerzenia)

- [ ] Migracja istniejących routes na `requirePermission()`
- [ ] Frontend: PermissionGate component (ukrywanie elementów UI)
- [ ] Sidebar filtering na podstawie uprawnień użytkownika
- [ ] Multi-role per user (zaawansowane)
- [ ] Permission inheritance (hierarchia ról)
- [ ] Audit log dla zmian uprawnień z diff (old/new permissions)

---

**Dokumentacja zaktualizowana:** 16.02.2026, 21:30 CET
