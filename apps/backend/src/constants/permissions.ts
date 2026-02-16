/**
 * Permission constants — single source of truth for RBAC
 *
 * Used by:
 *  - prisma/seeds/rbac.seed.ts (seeding DB)
 *  - services/permissions.service.ts (grouping for UI)
 *  - middlewares/permissions.ts (reference only)
 */

// ================================================================
//  MODULE & ACTION LABELS (used by permissions.service for UI)
// ================================================================

export const MODULE_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  reservations: 'Rezerwacje',
  clients: 'Klienci',
  halls: 'Sale',
  menu: 'Menu',
  queue: 'Kolejka',
  deposits: 'Zaliczki',
  event_types: 'Typy wydarzeń',
  attachments: 'Załączniki',
  reports: 'Raporty',
  audit_log: 'Dziennik audytu',
  settings: 'Ustawienia',
};

export const ACTION_LABELS: Record<string, string> = {
  read: 'Przeglądanie',
  create: 'Tworzenie',
  update: 'Edycja',
  delete: 'Usuwanie',
  export_pdf: 'Eksport PDF',
  export: 'Eksportowanie',
  upload: 'Przesyłanie',
  manage: 'Zarządzanie',
  manage_discount: 'Zarządzanie rabatami',
  manage_templates: 'Szablony menu',
  manage_packages: 'Pakiety menu',
  manage_dishes: 'Dania',
  manage_categories: 'Kategorie dań',
  manage_addon_groups: 'Grupy dodatków',
  mark_paid: 'Oznaczanie jako opłacone',
  manage_users: 'Zarządzanie użytkownikami',
  manage_roles: 'Zarządzanie rolami',
  manage_company: 'Ustawienia firmy',
};

// ================================================================
//  PERMISSION DEFINITIONS  —  [slug, module, action, name, description]
// ================================================================

export type PermissionTuple = [string, string, string, string, string];

export const PERMISSION_DEFINITIONS: PermissionTuple[] = [
  // ═══ Dashboard ═══
  ['dashboard:read', 'dashboard', 'read', 'Dashboard — podgląd', 'Dostęp do strony głównej i statystyk'],

  // ═══ Reservations ═══
  ['reservations:read',             'reservations', 'read',             'Rezerwacje — przeglądanie',   'Podgląd listy i szczegółów rezerwacji'],
  ['reservations:create',           'reservations', 'create',           'Rezerwacje — tworzenie',      'Tworzenie nowych rezerwacji'],
  ['reservations:update',           'reservations', 'update',           'Rezerwacje — edycja',         'Edycja istniejących rezerwacji'],
  ['reservations:delete',           'reservations', 'delete',           'Rezerwacje — usuwanie',       'Usuwanie rezerwacji'],
  ['reservations:export_pdf',       'reservations', 'export_pdf',       'Rezerwacje — eksport PDF',    'Generowanie PDF z rezerwacji'],
  ['reservations:manage_discount',  'reservations', 'manage_discount',  'Rezerwacje — rabaty',         'Nadawanie i edycja rabatów'],

  // ═══ Clients ═══
  ['clients:read',   'clients', 'read',   'Klienci — przeglądanie', 'Podgląd listy i danych klientów'],
  ['clients:create', 'clients', 'create', 'Klienci — tworzenie',    'Dodawanie nowych klientów'],
  ['clients:update', 'clients', 'update', 'Klienci — edycja',       'Edycja danych klientów'],
  ['clients:delete', 'clients', 'delete', 'Klienci — usuwanie',     'Usuwanie klientów'],

  // ═══ Halls ═══
  ['halls:read',   'halls', 'read',   'Sale — przeglądanie', 'Podgląd sal i ich konfiguracji'],
  ['halls:create', 'halls', 'create', 'Sale — tworzenie',    'Dodawanie nowych sal'],
  ['halls:update', 'halls', 'update', 'Sale — edycja',       'Edycja danych sal'],
  ['halls:delete', 'halls', 'delete', 'Sale — usuwanie',     'Usuwanie sal'],

  // ═══ Menu ═══
  ['menu:read',                'menu', 'read',                'Menu — przeglądanie',       'Podgląd szablonów, pakietów i dań'],
  ['menu:manage_templates',    'menu', 'manage_templates',    'Menu — szablony',           'Tworzenie i edycja szablonów menu'],
  ['menu:manage_packages',     'menu', 'manage_packages',     'Menu — pakiety',            'Tworzenie i edycja pakietów menu'],
  ['menu:manage_dishes',       'menu', 'manage_dishes',       'Menu — dania',              'Tworzenie i edycja dań'],
  ['menu:manage_categories',   'menu', 'manage_categories',   'Menu — kategorie dań',     'Zarządzanie kategoriami dań'],
  ['menu:manage_addon_groups', 'menu', 'manage_addon_groups', 'Menu — grupy dodatków',     'Zarządzanie grupami dodatków'],

  // ═══ Queue ═══
  ['queue:read',   'queue', 'read',   'Kolejka — przeglądanie',  'Podgląd kolejki rezerwacji'],
  ['queue:manage', 'queue', 'manage', 'Kolejka — zarządzanie',   'Potwierdzanie, odrzucanie rezerwacji w kolejce'],

  // ═══ Deposits ═══
  ['deposits:read',      'deposits', 'read',      'Zaliczki — przeglądanie',       'Podgląd zaliczek'],
  ['deposits:create',    'deposits', 'create',    'Zaliczki — tworzenie',          'Tworzenie nowych zaliczek'],
  ['deposits:update',    'deposits', 'update',    'Zaliczki — edycja',             'Edycja zaliczek'],
  ['deposits:delete',    'deposits', 'delete',    'Zaliczki — usuwanie',           'Usuwanie zaliczek'],
  ['deposits:mark_paid', 'deposits', 'mark_paid', 'Zaliczki — oznacz opłacone',    'Oznaczanie zaliczek jako opłacone'],

  // ═══ Event Types ═══
  ['event_types:read',   'event_types', 'read',   'Typy wydarzeń — przeglądanie', 'Podgląd typów wydarzeń'],
  ['event_types:create', 'event_types', 'create', 'Typy wydarzeń — tworzenie',    'Dodawanie nowych typów'],
  ['event_types:update', 'event_types', 'update', 'Typy wydarzeń — edycja',       'Edycja typów wydarzeń'],
  ['event_types:delete', 'event_types', 'delete', 'Typy wydarzeń — usuwanie',     'Usuwanie typów wydarzeń'],

  // ═══ Attachments ═══
  ['attachments:read',   'attachments', 'read',   'Załączniki — przeglądanie', 'Podgląd załączników'],
  ['attachments:upload', 'attachments', 'upload', 'Załączniki — przesyłanie',  'Przesyłanie nowych załączników'],
  ['attachments:delete', 'attachments', 'delete', 'Załączniki — usuwanie',     'Usuwanie załączników'],

  // ═══ Reports ═══
  ['reports:read',   'reports', 'read',   'Raporty — przeglądanie',    'Przeglądanie raportów'],
  ['reports:export', 'reports', 'export', 'Raporty — eksportowanie',   'Eksport raportów do CSV/Excel'],

  // ═══ Audit Log ═══
  ['audit_log:read', 'audit_log', 'read', 'Dziennik audytu — przeglądanie', 'Podgląd historii zmian w systemie'],

  // ═══ Settings ═══
  ['settings:read',            'settings', 'read',            'Ustawienia — przeglądanie',     'Podgląd ustawień systemu'],
  ['settings:manage_users',    'settings', 'manage_users',    'Ustawienia — użytkownicy',      'Zarządzanie kontami użytkowników'],
  ['settings:manage_roles',    'settings', 'manage_roles',    'Ustawienia — role i uprawnienia', 'Zarządzanie rolami i uprawnieniami'],
  ['settings:manage_company',  'settings', 'manage_company',  'Ustawienia — dane firmy',       'Edycja danych firmy i konfiguracji'],
];

// ================================================================
//  ROLE DEFINITIONS  —  used by rbac.seed.ts
// ================================================================

export interface RoleDefinition {
  name: string;
  slug: string;
  description: string;
  color: string;
  isSystem: boolean;
  permissions: string[] | 'ALL';
}

export const ROLE_DEFINITIONS: Record<string, RoleDefinition> = {
  admin: {
    name: 'Administrator',
    slug: 'admin',
    description: 'Pełny dostęp do wszystkich funkcji systemu',
    color: '#DC2626',  // red-600
    isSystem: true,
    permissions: 'ALL',
  },

  manager: {
    name: 'Kierownik',
    slug: 'manager',
    description: 'Zarządzanie operacjami bez dostępu do ustawień systemowych',
    color: '#2563EB',  // blue-600
    isSystem: true,
    permissions: [
      'dashboard:read',
      // Reservations — full
      'reservations:read', 'reservations:create', 'reservations:update',
      'reservations:delete', 'reservations:export_pdf', 'reservations:manage_discount',
      // Clients — full
      'clients:read', 'clients:create', 'clients:update', 'clients:delete',
      // Halls — full
      'halls:read', 'halls:create', 'halls:update', 'halls:delete',
      // Menu — full
      'menu:read', 'menu:manage_templates', 'menu:manage_packages',
      'menu:manage_dishes', 'menu:manage_categories', 'menu:manage_addon_groups',
      // Queue
      'queue:read', 'queue:manage',
      // Deposits — full
      'deposits:read', 'deposits:create', 'deposits:update',
      'deposits:delete', 'deposits:mark_paid',
      // Event types — full
      'event_types:read', 'event_types:create', 'event_types:update', 'event_types:delete',
      // Attachments — full
      'attachments:read', 'attachments:upload', 'attachments:delete',
      // Reports
      'reports:read', 'reports:export',
      // Audit log
      'audit_log:read',
      // Settings — read only
      'settings:read',
    ],
  },

  employee: {
    name: 'Pracownik',
    slug: 'employee',
    description: 'Obsługa rezerwacji i klientów, podgląd menu',
    color: '#059669',  // emerald-600
    isSystem: true,
    permissions: [
      'dashboard:read',
      // Reservations — CRUD without delete
      'reservations:read', 'reservations:create', 'reservations:update',
      'reservations:export_pdf',
      // Clients — CRUD without delete
      'clients:read', 'clients:create', 'clients:update',
      // Halls — read
      'halls:read',
      // Menu — read
      'menu:read',
      // Queue — read
      'queue:read',
      // Deposits — create + mark paid
      'deposits:read', 'deposits:create', 'deposits:mark_paid',
      // Event types — read
      'event_types:read',
      // Attachments — read + upload
      'attachments:read', 'attachments:upload',
    ],
  },

  viewer: {
    name: 'Podgląd',
    slug: 'viewer',
    description: 'Tylko podgląd — bez możliwości edycji',
    color: '#6B7280',  // gray-500
    isSystem: true,
    permissions: [
      'dashboard:read',
      'reservations:read',
      'clients:read',
      'halls:read',
      'menu:read',
      'queue:read',
      'deposits:read',
      'event_types:read',
      'attachments:read',
    ],
  },
};

// ================================================================
//  HELPER: Default employee permission slugs (for quick reference)
// ================================================================

export const DEFAULT_EMPLOYEE_PERMISSIONS = ROLE_DEFINITIONS.employee.permissions as string[];
