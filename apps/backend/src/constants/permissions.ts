/**
 * Permission constants — module labels and action labels
 * Used by the permissions service and frontend for display.
 */

/**
 * Human-readable labels for permission modules
 */
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

/**
 * Human-readable labels for permission actions
 */
export const ACTION_LABELS: Record<string, string> = {
  read: 'Przeglądanie',
  create: 'Tworzenie',
  update: 'Edycja',
  delete: 'Usuwanie',
  export_pdf: 'Eksport PDF',
  manage_discount: 'Zarządzanie rabatami',
  manage_templates: 'Zarządzanie szablonami menu',
  manage_packages: 'Zarządzanie pakietami menu',
  manage_dishes: 'Zarządzanie daniami',
  manage_categories: 'Zarządzanie kategoriami dań',
  manage_addon_groups: 'Zarządzanie grupami dodatków',
  mark_paid: 'Oznaczanie jako opłacone',
  manage_users: 'Zarządzanie użytkownikami',
  manage_roles: 'Zarządzanie rolami',
  manage_company: 'Ustawienia firmy',
  manage: 'Zarządzanie',
};

/**
 * Default permission slugs that every role should typically have.
 * Useful for the seed script / UI defaults.
 */
export const DEFAULT_EMPLOYEE_PERMISSIONS = [
  'dashboard:read',
  'reservations:read',
  'reservations:create',
  'reservations:update',
  'reservations:export_pdf',
  'clients:read',
  'clients:create',
  'clients:update',
  'halls:read',
  'menu:read',
  'queue:read',
  'deposits:read',
  'deposits:create',
  'deposits:mark_paid',
  'event_types:read',
  'attachments:read',
  'attachments:upload',
];
