/**
 * 🔐 RBAC Permission Constants
 * 
 * Format: "module:action"
 * Each permission maps to a specific operation in the system.
 * 
 * NAMING CONVENTION:
 * - module: lowercase, matches sidebar navigation (e.g. "reservations", "menu")
 * - action: lowercase verb (e.g. "read", "create", "update", "delete")
 * - slug: "module:action" (e.g. "reservations:create")
 */

// ─── Module names ───────────────────────────────────────────
export const MODULES = {
  DASHBOARD: 'dashboard',
  RESERVATIONS: 'reservations',
  ARCHIVE: 'archive',
  CLIENTS: 'clients',
  HALLS: 'halls',
  MENU: 'menu',
  QUEUE: 'queue',
  DEPOSITS: 'deposits',
  EVENT_TYPES: 'event_types',
  ATTACHMENTS: 'attachments',
  AUDIT_LOG: 'audit_log',
  REPORTS: 'reports',
  SETTINGS: 'settings',
} as const;

export type ModuleName = typeof MODULES[keyof typeof MODULES];

// ─── All permissions ────────────────────────────────────────
export const PERMISSIONS = {
  // Dashboard
  DASHBOARD_READ: 'dashboard:read',

  // Rezerwacje
  RESERVATIONS_READ: 'reservations:read',
  RESERVATIONS_CREATE: 'reservations:create',
  RESERVATIONS_UPDATE: 'reservations:update',
  RESERVATIONS_DELETE: 'reservations:delete',
  RESERVATIONS_ARCHIVE: 'reservations:archive',
  RESERVATIONS_EXPORT_PDF: 'reservations:export_pdf',
  RESERVATIONS_MANAGE_DISCOUNT: 'reservations:manage_discount',

  // Archiwum
  ARCHIVE_READ: 'archive:read',
  ARCHIVE_RESTORE: 'archive:restore',

  // Klienci
  CLIENTS_READ: 'clients:read',
  CLIENTS_CREATE: 'clients:create',
  CLIENTS_UPDATE: 'clients:update',
  CLIENTS_DELETE: 'clients:delete',

  // Sale
  HALLS_READ: 'halls:read',
  HALLS_CREATE: 'halls:create',
  HALLS_UPDATE: 'halls:update',
  HALLS_DELETE: 'halls:delete',

  // Menu
  MENU_READ: 'menu:read',
  MENU_MANAGE_TEMPLATES: 'menu:manage_templates',
  MENU_MANAGE_PACKAGES: 'menu:manage_packages',
  MENU_MANAGE_DISHES: 'menu:manage_dishes',
  MENU_MANAGE_CATEGORIES: 'menu:manage_categories',
  MENU_MANAGE_ADDONS: 'menu:manage_addons',

  // Kolejka
  QUEUE_READ: 'queue:read',
  QUEUE_MANAGE: 'queue:manage',
  QUEUE_CONFIG: 'queue:config',

  // Zaliczki
  DEPOSITS_READ: 'deposits:read',
  DEPOSITS_CREATE: 'deposits:create',
  DEPOSITS_UPDATE: 'deposits:update',
  DEPOSITS_DELETE: 'deposits:delete',
  DEPOSITS_MARK_PAID: 'deposits:mark_paid',

  // Typy wydarzeń
  EVENT_TYPES_READ: 'event_types:read',
  EVENT_TYPES_CREATE: 'event_types:create',
  EVENT_TYPES_UPDATE: 'event_types:update',
  EVENT_TYPES_DELETE: 'event_types:delete',

  // Załączniki
  ATTACHMENTS_READ: 'attachments:read',
  ATTACHMENTS_UPLOAD: 'attachments:upload',
  ATTACHMENTS_DELETE: 'attachments:delete',

  // Dziennik audytu
  AUDIT_LOG_READ: 'audit_log:read',

  // Raporty
  REPORTS_READ: 'reports:read',
  REPORTS_EXPORT_EXCEL: 'reports:export_excel',
  REPORTS_EXPORT_PDF: 'reports:export_pdf',

  // Ustawienia
  SETTINGS_READ: 'settings:read',
  SETTINGS_MANAGE_USERS: 'settings:manage_users',
  SETTINGS_MANAGE_ROLES: 'settings:manage_roles',
  SETTINGS_MANAGE_COMPANY: 'settings:manage_company',
  SETTINGS_MANAGE_SYSTEM: 'settings:manage_system',
} as const;

export type PermissionSlug = typeof PERMISSIONS[keyof typeof PERMISSIONS];

// ─── Permission definitions for seed ─────────────────────────
// Each entry: [slug, module, action, polish name, description]
export const PERMISSION_DEFINITIONS: Array<[string, string, string, string, string]> = [
  // Dashboard
  ['dashboard:read', 'dashboard', 'read', 'Podgląd dashboardu', 'Dostęp do strony głównej z podsumowaniem'],

  // Rezerwacje
  ['reservations:read', 'reservations', 'read', 'Podgląd rezerwacji', 'Przeglądanie listy i szczegółów rezerwacji'],
  ['reservations:create', 'reservations', 'create', 'Tworzenie rezerwacji', 'Dodawanie nowych rezerwacji'],
  ['reservations:update', 'reservations', 'update', 'Edycja rezerwacji', 'Modyfikowanie istniejących rezerwacji'],
  ['reservations:delete', 'reservations', 'delete', 'Usuwanie rezerwacji', 'Trwałe usuwanie rezerwacji'],
  ['reservations:archive', 'reservations', 'archive', 'Archiwizacja rezerwacji', 'Przenoszenie rezerwacji do archiwum'],
  ['reservations:export_pdf', 'reservations', 'export_pdf', 'Eksport PDF rezerwacji', 'Generowanie potwierdzeń PDF'],
  ['reservations:manage_discount', 'reservations', 'manage_discount', 'Zarządzanie rabatami', 'Nadawanie i edycja rabatów na rezerwacje'],

  // Archiwum
  ['archive:read', 'archive', 'read', 'Podgląd archiwum', 'Przeglądanie zarchiwizowanych rezerwacji'],
  ['archive:restore', 'archive', 'restore', 'Przywracanie z archiwum', 'Przywracanie rezerwacji z archiwum'],

  // Klienci
  ['clients:read', 'clients', 'read', 'Podgląd klientów', 'Przeglądanie bazy klientów'],
  ['clients:create', 'clients', 'create', 'Tworzenie klientów', 'Dodawanie nowych klientów'],
  ['clients:update', 'clients', 'update', 'Edycja klientów', 'Modyfikowanie danych klientów'],
  ['clients:delete', 'clients', 'delete', 'Usuwanie klientów', 'Usuwanie klientów z bazy'],

  // Sale
  ['halls:read', 'halls', 'read', 'Podgląd sal', 'Przeglądanie listy sal'],
  ['halls:create', 'halls', 'create', 'Tworzenie sal', 'Dodawanie nowych sal'],
  ['halls:update', 'halls', 'update', 'Edycja sal', 'Modyfikowanie konfiguracji sal'],
  ['halls:delete', 'halls', 'delete', 'Usuwanie sal', 'Usuwanie sal z systemu'],

  // Menu
  ['menu:read', 'menu', 'read', 'Podgląd menu', 'Przeglądanie szablonów i pakietów menu'],
  ['menu:manage_templates', 'menu', 'manage_templates', 'Zarządzanie szablonami', 'Tworzenie, edycja i usuwanie szablonów menu'],
  ['menu:manage_packages', 'menu', 'manage_packages', 'Zarządzanie pakietami', 'Tworzenie, edycja i usuwanie pakietów cenowych'],
  ['menu:manage_dishes', 'menu', 'manage_dishes', 'Zarządzanie daniami', 'Tworzenie, edycja i usuwanie dań z biblioteki'],
  ['menu:manage_categories', 'menu', 'manage_categories', 'Zarządzanie kategoriami dań', 'Tworzenie i edycja kategorii dań'],
  ['menu:manage_addons', 'menu', 'manage_addons', 'Zarządzanie dodatkami', 'Tworzenie i edycja grup dodatków'],

  // Kolejka
  ['queue:read', 'queue', 'read', 'Podgląd kolejki', 'Przeglądanie kolejki rezerwacji'],
  ['queue:manage', 'queue', 'manage', 'Zarządzanie kolejką', 'Zmienianie pozycji, przydzielanie sal z kolejki'],
  ['queue:config', 'queue', 'config', 'Konfiguracja kolejki', 'Ustawienia auto-cancel i reguł kolejki'],

  // Zaliczki
  ['deposits:read', 'deposits', 'read', 'Podgląd zaliczek', 'Przeglądanie listy zaliczek'],
  ['deposits:create', 'deposits', 'create', 'Tworzenie zaliczek', 'Dodawanie nowych zaliczek do rezerwacji'],
  ['deposits:update', 'deposits', 'update', 'Edycja zaliczek', 'Modyfikowanie kwot i terminów zaliczek'],
  ['deposits:delete', 'deposits', 'delete', 'Usuwanie zaliczek', 'Usuwanie zaliczek'],
  ['deposits:mark_paid', 'deposits', 'mark_paid', 'Oznaczanie wpłat', 'Rejestrowanie płatności zaliczek'],

  // Typy wydarzeń
  ['event_types:read', 'event_types', 'read', 'Podgląd typów wydarzeń', 'Przeglądanie typów wydarzeń'],
  ['event_types:create', 'event_types', 'create', 'Tworzenie typów wydarzeń', 'Dodawanie nowych typów'],
  ['event_types:update', 'event_types', 'update', 'Edycja typów wydarzeń', 'Modyfikowanie typów wydarzeń'],
  ['event_types:delete', 'event_types', 'delete', 'Usuwanie typów wydarzeń', 'Usuwanie typów wydarzeń'],

  // Załączniki
  ['attachments:read', 'attachments', 'read', 'Podgląd załączników', 'Pobieranie i podgląd plików'],
  ['attachments:upload', 'attachments', 'upload', 'Upload załączników', 'Przesyłanie nowych plików'],
  ['attachments:delete', 'attachments', 'delete', 'Usuwanie załączników', 'Usuwanie przesłanych plików'],

  // Dziennik audytu
  ['audit_log:read', 'audit_log', 'read', 'Podgląd dziennika audytu', 'Przeglądanie historii zmian w systemie'],

  // Raporty
  ['reports:read', 'reports', 'read', 'Podgląd raportów', 'Przeglądanie analityk i statystyk'],
  ['reports:export_excel', 'reports', 'export_excel', 'Eksport Excel', 'Eksportowanie raportów do Excel'],
  ['reports:export_pdf', 'reports', 'export_pdf', 'Eksport PDF raportów', 'Eksportowanie raportów do PDF'],

  // Ustawienia
  ['settings:read', 'settings', 'read', 'Podgląd ustawień', 'Dostęp do panelu ustawień'],
  ['settings:manage_users', 'settings', 'manage_users', 'Zarządzanie użytkownikami', 'Tworzenie, edycja i dezaktywacja kont'],
  ['settings:manage_roles', 'settings', 'manage_roles', 'Zarządzanie rolami', 'Tworzenie ról i przypisywanie uprawnień'],
  ['settings:manage_company', 'settings', 'manage_company', 'Dane firmy', 'Edycja danych firmowych i konfiguracji'],
  ['settings:manage_system', 'settings', 'manage_system', 'Ustawienia systemowe', 'Zaawansowana konfiguracja systemu'],
];

// ─── Role definitions for seed ──────────────────────────────
// Each role with its assigned permission slugs
export const ROLE_DEFINITIONS = {
  admin: {
    name: 'Administrator',
    slug: 'admin',
    description: 'Pełny dostęp do wszystkich funkcji systemu',
    color: '#dc2626',
    isSystem: true,
    permissions: 'ALL', // special marker — gets all permissions
  },
  manager: {
    name: 'Kierownik',
    slug: 'manager',
    description: 'Zarządzanie operacjami — bez konfiguracji systemu i ról',
    color: '#2563eb',
    isSystem: true,
    permissions: [
      // Dashboard
      'dashboard:read',
      // Rezerwacje — pełne
      'reservations:read', 'reservations:create', 'reservations:update',
      'reservations:delete', 'reservations:archive', 'reservations:export_pdf',
      'reservations:manage_discount',
      // Archiwum
      'archive:read', 'archive:restore',
      // Klienci — pełne
      'clients:read', 'clients:create', 'clients:update', 'clients:delete',
      // Sale — pełne
      'halls:read', 'halls:create', 'halls:update', 'halls:delete',
      // Menu — pełne
      'menu:read', 'menu:manage_templates', 'menu:manage_packages',
      'menu:manage_dishes', 'menu:manage_categories', 'menu:manage_addons',
      // Kolejka — pełne
      'queue:read', 'queue:manage', 'queue:config',
      // Zaliczki — pełne
      'deposits:read', 'deposits:create', 'deposits:update',
      'deposits:delete', 'deposits:mark_paid',
      // Typy wydarzeń — pełne
      'event_types:read', 'event_types:create', 'event_types:update', 'event_types:delete',
      // Załączniki — pełne
      'attachments:read', 'attachments:upload', 'attachments:delete',
      // Dziennik audytu
      'audit_log:read',
      // Raporty — pełne
      'reports:read', 'reports:export_excel', 'reports:export_pdf',
      // Ustawienia — podgląd + użytkownicy + firma
      'settings:read', 'settings:manage_users', 'settings:manage_company',
    ],
  },
  employee: {
    name: 'Pracownik',
    slug: 'employee',
    description: 'Codzienna obsługa rezerwacji i klientów',
    color: '#16a34a',
    isSystem: true,
    permissions: [
      // Dashboard
      'dashboard:read',
      // Rezerwacje — tworzenie i edycja, bez usuwania
      'reservations:read', 'reservations:create', 'reservations:update',
      'reservations:export_pdf',
      // Archiwum — tylko podgląd
      'archive:read',
      // Klienci — tworzenie i edycja
      'clients:read', 'clients:create', 'clients:update',
      // Sale — tylko podgląd
      'halls:read',
      // Menu — tylko podgląd
      'menu:read',
      // Kolejka — podgląd
      'queue:read',
      // Zaliczki — tworzenie i oznaczanie wpłat
      'deposits:read', 'deposits:create', 'deposits:mark_paid',
      // Typy wydarzeń — podgląd
      'event_types:read',
      // Załączniki — podgląd i upload
      'attachments:read', 'attachments:upload',
    ],
  },
  viewer: {
    name: 'Podgląd',
    slug: 'viewer',
    description: 'Tylko odczyt — do wglądu bez możliwości edycji',
    color: '#737373',
    isSystem: true,
    permissions: [
      'dashboard:read',
      'reservations:read',
      'archive:read',
      'clients:read',
      'halls:read',
      'menu:read',
      'queue:read',
      'deposits:read',
      'event_types:read',
      'attachments:read',
    ],
  },
} as const;

// ─── Helper: group permissions by module ─────────────────────
export function groupPermissionsByModule(
  permissions: Array<{ slug: string; module: string; action: string; name: string }>
): Record<string, Array<{ slug: string; action: string; name: string }>> {
  return permissions.reduce((acc, perm) => {
    if (!acc[perm.module]) acc[perm.module] = [];
    acc[perm.module].push({ slug: perm.slug, action: perm.action, name: perm.name });
    return acc;
  }, {} as Record<string, Array<{ slug: string; action: string; name: string }>>);
}

// ─── Module display names (Polish) ──────────────────────────
export const MODULE_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  reservations: 'Rezerwacje',
  archive: 'Archiwum',
  clients: 'Klienci',
  halls: 'Sale',
  menu: 'Menu',
  queue: 'Kolejka',
  deposits: 'Zaliczki',
  event_types: 'Typy wydarzeń',
  attachments: 'Załączniki',
  audit_log: 'Dziennik audytu',
  reports: 'Raporty',
  settings: 'Ustawienia',
};
