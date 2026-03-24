// apps/frontend/components/audit-log/audit-log.constants.ts
// Extracted from AuditLogTable.tsx — config objects for audit log display

// #217: System/auto actions — used for "hide system actions" filter
export const SYSTEM_ACTIONS = new Set([
  'AUTO_ARCHIVED', 'AUTO_CONFIRM', 'QUEUE_AUTO_CANCEL', 'QUEUE_REBUILD',
  'MENU_RECALCULATED', 'ATTACHMENT_DEDUP',
]);

export const actionColors: Record<string, string> = {
  CREATE: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800',
  UPDATE: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800',
  DELETE: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800',
  TOGGLE: 'bg-neutral-100 text-neutral-700 border-neutral-200 dark:bg-neutral-900/30 dark:text-neutral-300 dark:border-neutral-800',
  STATUS_CHANGE: 'bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-900/30 dark:text-violet-300 dark:border-violet-800',
  CANCEL: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800',
  ARCHIVE: 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800',
  UNARCHIVE: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800',
  RESTORE: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800',
  // Menu
  MENU_UPDATE: 'bg-lime-100 text-lime-700 border-lime-200 dark:bg-lime-900/30 dark:text-lime-300 dark:border-lime-800',
  MENU_UPDATED: 'bg-lime-100 text-lime-700 border-lime-200 dark:bg-lime-900/30 dark:text-lime-300 dark:border-lime-800',
  MENU_REMOVE: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800',
  MENU_REMOVED: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800',
  MENU_SELECTED: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800',
  MENU_RECALCULATED: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800',
  MENU_DIRECT_REMOVED: 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-800',
  // Payment & Deposits
  PAYMENT_UPDATE: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800',
  MARK_PAID: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800',
  DEPOSIT_CANCELLED: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800',
  // Discount
  DISCOUNT_APPLIED: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800',
  DISCOUNT_REMOVED: 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800',
  // Queue
  QUEUE_ADD: 'bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-900/30 dark:text-teal-300 dark:border-teal-800',
  QUEUE_UPDATE: 'bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-900/30 dark:text-teal-300 dark:border-teal-800',
  QUEUE_REMOVE: 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-800',
  QUEUE_SWAP: 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800',
  QUEUE_MOVE: 'bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800',
  QUEUE_REORDER: 'bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800',
  QUEUE_REBUILD: 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800',
  QUEUE_PROMOTE: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800',
  QUEUE_AUTO_CANCEL: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800',
  // Attachments
  ATTACHMENT_UPLOAD: 'bg-cyan-100 text-cyan-700 border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-300 dark:border-cyan-800',
  ATTACHMENT_ADD: 'bg-cyan-100 text-cyan-700 border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-300 dark:border-cyan-800',
  ATTACHMENT_UPDATE: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800',
  ATTACHMENT_ARCHIVE: 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800',
  ATTACHMENT_DELETE: 'bg-pink-100 text-pink-700 border-pink-200 dark:bg-pink-900/30 dark:text-pink-300 dark:border-pink-800',
  // Category extras
  CATEGORY_EXTRAS_UPDATED: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800',
  CATEGORY_EXTRAS_REMOVED: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800',
  // Extras
  BULK_ASSIGN: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800',
  // Deposits
  DEPOSIT_CREATED: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800',
  DEPOSIT_DELETED: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800',
  DEPOSIT_PAID: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800',
  MARK_UNPAID: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800',
  // Auto actions
  AUTO_ARCHIVED: 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800',
  AUTO_CONFIRM: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800',
  SOFT_DELETE: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800',
  TOGGLE_ACTIVE: 'bg-neutral-100 text-neutral-700 border-neutral-200 dark:bg-neutral-900/30 dark:text-neutral-300 dark:border-neutral-800',
  REORDER: 'bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800',
  DUPLICATE: 'bg-cyan-100 text-cyan-700 border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-300 dark:border-cyan-800',
  ATTACHMENT_DEDUP: 'bg-neutral-100 text-neutral-700 border-neutral-200 dark:bg-neutral-900/30 dark:text-neutral-300 dark:border-neutral-800',
  // Auth & Users
  LOGIN: 'bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-900/30 dark:text-sky-300 dark:border-sky-800',
  LOGOUT: 'bg-neutral-100 text-neutral-700 border-neutral-200 dark:bg-neutral-900/30 dark:text-neutral-300 dark:border-neutral-800',
  REGISTER: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800',
  PASSWORD_CHANGED: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800',
  PASSWORD_RESET_REQUESTED: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800',
  PASSWORD_RESET_COMPLETED: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800',
  USER_CREATED: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800',
  USER_UPDATED: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800',
  USER_DELETED: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800',
  USER_PASSWORD_CHANGED: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800',
  // Roles
  ROLE_CREATED: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800',
  ROLE_UPDATED: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800',
  ROLE_DELETED: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800',
  ROLE_PERMISSIONS_UPDATED: 'bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-900/30 dark:text-violet-300 dark:border-violet-800',
  // Settings
  COMPANY_SETTINGS_UPDATED: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800',
};

export const actionLabels: Record<string, string> = {
  // Basic CRUD
  CREATE: 'Utworzenie',
  UPDATE: 'Aktualizacja',
  DELETE: 'Usunięcie',
  SOFT_DELETE: 'Usunięcie (miękkie)',
  TOGGLE: 'Przełączenie',
  TOGGLE_ACTIVE: 'Przełączenie aktywności',
  REORDER: 'Zmiana kolejności',
  DUPLICATE: 'Duplikacja',
  // Status
  STATUS_CHANGE: 'Zmiana statusu',
  CANCEL: 'Anulowanie',
  ARCHIVE: 'Archiwizacja',
  UNARCHIVE: 'Przywrócenie',
  RESTORE: 'Przywrócenie',
  AUTO_ARCHIVED: 'Auto-archiwizacja',
  AUTO_CONFIRM: 'Auto-potwierdzenie',
  // Menu
  MENU_UPDATE: 'Aktualizacja menu',
  MENU_UPDATED: 'Aktualizacja menu',
  MENU_REMOVE: 'Usunięcie menu',
  MENU_REMOVED: 'Usunięcie menu',
  MENU_SELECTED: 'Wybór menu',
  MENU_RECALCULATED: 'Przeliczenie menu',
  MENU_DIRECT_REMOVED: 'Bezpośrednie usunięcie menu',
  // Category extras (#216)
  CATEGORY_EXTRAS_UPDATED: 'Aktualizacja dodatkowo płatnych porcji',
  CATEGORY_EXTRAS_REMOVED: 'Usunięcie dodatkowo płatnych porcji',
  // Payment & Deposits
  PAYMENT_UPDATE: 'Aktualizacja płatności',
  MARK_PAID: 'Oznaczenie jako opłacone',
  MARK_UNPAID: 'Oznaczenie jako nieopłacone',
  DEPOSIT_CREATED: 'Dodanie zaliczki',
  DEPOSIT_DELETED: 'Usunięcie zaliczki',
  DEPOSIT_PAID: 'Opłacenie zaliczki',
  DEPOSIT_CANCELLED: 'Anulowanie zaliczki',
  // Discount
  DISCOUNT_APPLIED: 'Naliczenie rabatu',
  DISCOUNT_REMOVED: 'Usunięcie rabatu',
  // Extras
  BULK_ASSIGN: 'Zbiorcze przypisanie',
  // Queue
  QUEUE_ADD: 'Dodanie do kolejki',
  QUEUE_UPDATE: 'Aktualizacja w kolejce',
  QUEUE_REMOVE: 'Usunięcie z kolejki',
  QUEUE_SWAP: 'Zamiana pozycji',
  QUEUE_MOVE: 'Przeniesienie w kolejce',
  QUEUE_REORDER: 'Zmiana kolejności',
  QUEUE_REBUILD: 'Przebudowa kolejki',
  QUEUE_PROMOTE: 'Awans z kolejki',
  QUEUE_AUTO_CANCEL: 'Auto-anulowanie z kolejki',
  // Attachments
  ATTACHMENT_UPLOAD: 'Wgranie załącznika',
  ATTACHMENT_ADD: 'Dodanie załącznika',
  ATTACHMENT_UPDATE: 'Aktualizacja załącznika',
  ATTACHMENT_ARCHIVE: 'Archiwizacja załącznika',
  ATTACHMENT_DELETE: 'Usunięcie załącznika',
  ATTACHMENT_DEDUP: 'Deduplikacja załącznika',
  // Auth & Users
  LOGIN: 'Logowanie',
  LOGOUT: 'Wylogowanie',
  REGISTER: 'Rejestracja',
  PASSWORD_CHANGED: 'Zmiana hasła',
  PASSWORD_RESET_REQUESTED: 'Żądanie resetu hasła',
  PASSWORD_RESET_COMPLETED: 'Reset hasła',
  USER_CREATED: 'Utworzenie użytkownika',
  USER_UPDATED: 'Aktualizacja użytkownika',
  USER_DELETED: 'Usunięcie użytkownika',
  USER_PASSWORD_CHANGED: 'Zmiana hasła użytkownika',
  // Roles
  ROLE_CREATED: 'Utworzenie roli',
  ROLE_UPDATED: 'Aktualizacja roli',
  ROLE_DELETED: 'Usunięcie roli',
  ROLE_PERMISSIONS_UPDATED: 'Aktualizacja uprawnień roli',
  // Settings
  COMPANY_SETTINGS_UPDATED: 'Aktualizacja ustawień',
};

export const entityLabels: Record<string, string> = {
  RESERVATION: 'Rezerwacja',
  RESERVATION_EXTRA: 'Usługa dodatkowa',
  CLIENT: 'Klient',
  CLIENT_CONTACT: 'Kontakt klienta',
  ROOM: 'Sala',
  HALL: 'Sala',
  MENU: 'Menu',
  USER: 'Użytkownik',
  User: 'Użytkownik',
  DEPOSIT: 'Zaliczka',
  EVENT_TYPE: 'Typ wydarzenia',
  ATTACHMENT: 'Załącznik',
  QUEUE: 'Kolejka',
  DISH: 'Danie',
  MENU_TEMPLATE: 'Szablon menu',
  MENU_PACKAGE: 'Pakiet menu',
  PACKAGE: 'Pakiet',
  DOCUMENT_TEMPLATE: 'Szablon dokumentu',
  CATERING_ORDER: 'Zamówienie catering',
  SERVICE_CATEGORY: 'Kategoria usług',
  SERVICE_ITEM: 'Pozycja usługi',
  Role: 'Rola',
  CompanySettings: 'Ustawienia firmy',
  ServiceExtra: 'Usługa dodatkowa',
  ServiceCategory: 'Kategoria usług',
  ServiceItem: 'Pozycja usługi',
};
