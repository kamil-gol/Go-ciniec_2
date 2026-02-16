# 🔐 System RBAC — Role-Based Access Control

> **Status:** Faza 1 (schemat + seed + middleware) — 16.02.2026

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
- `reservations:read` — podgląd rezerwacji
- `reservations:create` — tworzenie rezerwacji
- `menu:manage_templates` — zarządzanie szablonami menu
- `settings:manage_roles` — zarządzanie rolami i uprawnieniami

## Role systemowe

| Rola | Slug | Kolor | Uprawnień | Opis |
|------|------|-------|-----------|------|
| Administrator | `admin` | 🔴 | WSZYSTKIE | Pełny dostęp |
| Kierownik | `manager` | 🔵 | ~48 | Wszystko oprócz ról i systemu |
| Pracownik | `employee` | 🟢 | ~22 | Codzienna obsługa |
| Podgląd | `viewer` | ⚫ | ~10 | Tylko odczyt |

Role systemowe (`isSystem: true`) nie mogą być usunięte. Można tworzyć dodatkowe role niestandardowe.

## Moduły i uprawnienia

| Moduł | Uprawnienia |
|-------|------------|
| Dashboard | `read` |
| Rezerwacje | `read`, `create`, `update`, `delete`, `archive`, `export_pdf`, `manage_discount` |
| Archiwum | `read`, `restore` |
| Klienci | `read`, `create`, `update`, `delete` |
| Sale | `read`, `create`, `update`, `delete` |
| Menu | `read`, `manage_templates`, `manage_packages`, `manage_dishes`, `manage_categories`, `manage_addons` |
| Kolejka | `read`, `manage`, `config` |
| Zaliczki | `read`, `create`, `update`, `delete`, `mark_paid` |
| Typy wydarzeń | `read`, `create`, `update`, `delete` |
| Załączniki | `read`, `upload`, `delete` |
| Dziennik audytu | `read` |
| Raporty | `read`, `export_excel`, `export_pdf` |
| Ustawienia | `read`, `manage_users`, `manage_roles`, `manage_company`, `manage_system` |

**Łącznie: 55 uprawnień**

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

## Pliki

```
apps/backend/
├── prisma/
│   ├── schema.prisma              # Modele Role, Permission, RolePermission, CompanySettings
│   └── seeds/rbac.seed.ts         # Seed uprawnień i ról
├── src/
│   ├── constants/permissions.ts   # Stałe, definicje, mapy modułów
│   ├── middlewares/permissions.ts  # requirePermission(), requireAnyPermission()
│   └── types/settings.types.ts    # Typy TS dla RBAC
```

## Następne kroki (Faza 2+)

- [ ] Migracja istniejących routes na `requirePermission()`
- [ ] Backend: Users CRUD, Roles CRUD, Company Settings CRUD
- [ ] Frontend: Settings hub z zakładkami Users / Roles / Company
- [ ] Frontend: PermissionMatrix (interaktywna matryca checkboxów)
- [ ] Frontend: PermissionGate component (ukrywanie elementów UI)
- [ ] Sidebar filtering na podstawie uprawnień użytkownika
