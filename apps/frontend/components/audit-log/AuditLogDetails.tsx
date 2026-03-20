// apps/frontend/components/audit-log/AuditLogDetails.tsx
'use client';

import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import {
  Calendar, User, Tag, FileText, Globe, Monitor, Hash,
  ArrowRight, Plus, Trash2, ToggleLeft, Repeat, ChevronDown, ChevronUp,
  Info, CreditCard, Package, Percent, ListOrdered, Layers, RefreshCw,
} from 'lucide-react';
import { useState } from 'react';
import type { AuditLogEntry } from '@/types/audit-log.types';

// ─── Polish labels ───────────────────────────────────────────────────────────

const actionLabels: Record<string, string> = {
  CREATE: 'Utworzenie',
  UPDATE: 'Aktualizacja',
  DELETE: 'Usunięcie',
  SOFT_DELETE: 'Usunięcie (miękkie)',
  TOGGLE: 'Przełączenie',
  TOGGLE_ACTIVE: 'Przełączenie aktywności',
  REORDER: 'Zmiana kolejności',
  DUPLICATE: 'Duplikacja',
  STATUS_CHANGE: 'Zmiana statusu',
  CANCEL: 'Anulowanie',
  ARCHIVE: 'Archiwizacja',
  UNARCHIVE: 'Przywrócenie',
  RESTORE: 'Przywrócenie',
  AUTO_ARCHIVED: 'Auto-archiwizacja',
  AUTO_CONFIRM: 'Auto-potwierdzenie',
  MENU_UPDATE: 'Aktualizacja menu',
  MENU_UPDATED: 'Aktualizacja menu',
  MENU_REMOVE: 'Usunięcie menu',
  MENU_REMOVED: 'Usunięcie menu',
  MENU_SELECTED: 'Wybór menu',
  MENU_RECALCULATED: 'Przeliczenie menu',
  MENU_DIRECT_REMOVED: 'Bezpośrednie usunięcie menu',
  CATEGORY_EXTRAS_UPDATED: 'Aktualizacja dodatkowo płatnych porcji',
  CATEGORY_EXTRAS_REMOVED: 'Usunięcie dodatkowo płatnych porcji',
  PAYMENT_UPDATE: 'Aktualizacja płatności',
  MARK_PAID: 'Oznaczenie jako opłacone',
  MARK_UNPAID: 'Oznaczenie jako nieopłacone',
  DEPOSIT_CREATED: 'Dodanie zaliczki',
  DEPOSIT_DELETED: 'Usunięcie zaliczki',
  DEPOSIT_PAID: 'Opłacenie zaliczki',
  DEPOSIT_CANCELLED: 'Anulowanie zaliczki',
  DISCOUNT_APPLIED: 'Naliczenie rabatu',
  DISCOUNT_REMOVED: 'Usunięcie rabatu',
  BULK_ASSIGN: 'Zbiorcze przypisanie',
  QUEUE_ADD: 'Dodanie do kolejki',
  QUEUE_UPDATE: 'Aktualizacja w kolejce',
  QUEUE_REMOVE: 'Usunięcie z kolejki',
  QUEUE_SWAP: 'Zamiana pozycji',
  QUEUE_MOVE: 'Przeniesienie w kolejce',
  QUEUE_REORDER: 'Zmiana kolejności',
  QUEUE_REBUILD: 'Przebudowa kolejki',
  QUEUE_PROMOTE: 'Awans z kolejki',
  QUEUE_AUTO_CANCEL: 'Auto-anulowanie z kolejki',
  ATTACHMENT_UPLOAD: 'Wgranie załącznika',
  ATTACHMENT_ADD: 'Dodanie załącznika',
  ATTACHMENT_UPDATE: 'Aktualizacja załącznika',
  ATTACHMENT_ARCHIVE: 'Archiwizacja załącznika',
  ATTACHMENT_DELETE: 'Usunięcie załącznika',
  ATTACHMENT_DEDUP: 'Deduplikacja załącznika',
  LOGIN: 'Logowanie',
  LOGOUT: 'Wylogowanie',
  NOTE_UPDATED: 'Aktualizacja notatki',
};

const actionColors: Record<string, string> = {
  ARCHIVE: 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800',
  UNARCHIVE: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800',
  RESTORE: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800',
  CREATE: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800',
  UPDATE: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800',
  DELETE: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800',
  SOFT_DELETE: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800',
  STATUS_CHANGE: 'bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-900/30 dark:text-violet-300 dark:border-violet-800',
  CANCEL: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800',
  LOGIN: 'bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-900/30 dark:text-sky-300 dark:border-sky-800',
  LOGOUT: 'bg-neutral-100 text-neutral-700 border-neutral-200 dark:bg-neutral-900/30 dark:text-neutral-300 dark:border-neutral-800',
  MARK_PAID: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800',
  DISCOUNT_APPLIED: 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800',
  DISCOUNT_REMOVED: 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800',
  TOGGLE_ACTIVE: 'bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-900/30 dark:text-teal-300 dark:border-teal-800',
  DUPLICATE: 'bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800',
};

const entityLabels: Record<string, string> = {
  RESERVATION: 'Rezerwacja',
  RESERVATION_EXTRA: 'Usługa dodatkowa',
  CLIENT: 'Klient',
  CLIENT_CONTACT: 'Kontakt klienta',
  ROOM: 'Sala',
  HALL: 'Sala',
  MENU: 'Menu',
  USER: 'Użytkownik',
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

// ─── Field name translations (technical → Polish) ───────────────────────────

const fieldLabels: Record<string, string> = {
  // Reservation fields
  status: 'Status',
  eventDate: 'Data wydarzenia',
  eventEndDate: 'Data zakończenia',
  startTime: 'Godzina rozpoczęcia',
  endTime: 'Godzina zakończenia',
  guestCount: 'Liczba gości',
  adultCount: 'Dorośli',
  childCount: 'Dzieci',
  adults: 'Dorośli',
  children: 'Dzieci',
  toddlers: 'Małe dzieci',
  notes: 'Notatki',
  internalNotes: 'Notatki wewnętrzne',
  totalPrice: 'Cena całkowita',
  pricePerPerson: 'Cena za osobę',
  advanceAmount: 'Kwota zaliczki',
  isArchived: 'Zarchiwizowana',
  confirmedAt: 'Data potwierdzenia',
  cancelledAt: 'Data anulowania',
  archivedAt: 'Data archiwizacji',
  // Client fields
  firstName: 'Imię',
  lastName: 'Nazwisko',
  email: 'Email',
  phone: 'Telefon',
  clientType: 'Typ klienta',
  companyName: 'Nazwa firmy',
  nip: 'NIP',
  address: 'Adres',
  city: 'Miasto',
  postalCode: 'Kod pocztowy',
  country: 'Kraj',
  // Menu fields
  name: 'Nazwa',
  description: 'Opis',
  price: 'Cena',
  basePrice: 'Cena bazowa',
  priceType: 'Typ ceny',
  isActive: 'Aktywny',
  // Relation / nested object fields
  hall: 'Sala',
  client: 'Klient',
  createdBy: 'Utworzony przez',
  eventType: 'Typ wydarzenia',
  menuSnapshot: 'Migawka menu',
  category: 'Kategoria',
  packages: 'Pakiety',
  contacts: 'Osoby kontaktowe',
  items: 'Pozycje',
  serviceItem: 'Pozycja usługi',
  amenities: 'Udogodnienia',
  images: 'Zdjęcia',
  // Hall / Room fields
  capacity: 'Pojemność',
  isWholeVenue: 'Cały obiekt',
  allowWithWholeVenue: 'Dostępna z całym obiektem',
  allowMultipleBookings: 'Wielokrotne rezerwacje',
  // Deposit fields
  amount: 'Kwota',
  dueDate: 'Termin płatności',
  paidAt: 'Data opłaty',
  paymentMethod: 'Metoda płatności',
  amountPaid: 'Kwota zapłacona',
  wasPaid: 'Była opłacona',
  // Status change fields
  oldStatus: 'Poprzedni status',
  newStatus: 'Nowy status',
  // Discount fields
  discountType: 'Typ rabatu',
  discountValue: 'Wartość rabatu',
  discountAmount: 'Kwota rabatu',
  reason: 'Powód',
  restoredPrice: 'Przywrócona cena',
  // Service fields
  slug: 'Identyfikator',
  isExclusive: 'Wyłączny',
  // Queue fields
  position: 'Pozycja',
  queuePosition: 'Pozycja w kolejce',
  // Attachment fields
  filename: 'Nazwa pliku',
  fileSize: 'Rozmiar pliku',
  mimeType: 'Typ pliku',
  // Event type fields
  eventTypeName: 'Nazwa typu wydarzenia',
  color: 'Kolor',
  standardHours: 'Standardowe godziny',
  extraHourRate: 'Stawka za dodatkową godzinę',
  // Menu package fields
  pricePerAdult: 'Cena za dorosłego',
  pricePerChild: 'Cena za dziecko',
  icon: 'Ikona',
  displayOrder: 'Kolejność wyświetlania',
  isPrimary: 'Kontakt główny',
  // Common
  reservationId: 'ID rezerwacji',
  clientId: 'ID klienta',
  sourceId: 'ID źródła',
  orderedIds: 'Kolejność elementów',
  role: 'Stanowisko',
  menu: 'Menu',
  type: 'Typ',
  value: 'Wartość',
};

// ─── Value formatting helpers ────────────────────────────────────────────────

const statusLabels: Record<string, string> = {
  PENDING: 'Oczekująca',
  CONFIRMED: 'Potwierdzona',
  CANCELLED: 'Anulowana',
  COMPLETED: 'Zakończona',
  DRAFT: 'Wersja robocza',
  TENTATIVE: 'Wstępna',
  PAID: 'Opłacona',
  UNPAID: 'Nieopłacona',
  PARTIAL: 'Częściowo opłacona',
  OVERDUE: 'Zaległa',
  ACTIVE: 'Aktywna',
  INACTIVE: 'Nieaktywna',
  ARCHIVED: 'Zarchiwizowana',
};

const paymentMethodLabels: Record<string, string> = {
  CASH: 'Gotówka',
  BANK_TRANSFER: 'Przelew bankowy',
  BLIK: 'BLIK',
  CARD: 'Karta',
  ONLINE: 'Online',
  OTHER: 'Inne',
};

const clientTypeLabels: Record<string, string> = {
  INDIVIDUAL: 'Osoba prywatna',
  COMPANY: 'Firma',
};

const discountTypeLabels: Record<string, string> = {
  PERCENTAGE: 'Procentowy',
  FIXED: 'Kwotowy',
};

const priceTypeLabels: Record<string, string> = {
  FLAT: 'Stała',
  PER_PERSON: 'Za osobę',
  PER_HOUR: 'Za godzinę',
};

/** Extract a meaningful human-readable label from an object */
function formatObjectSummary(obj: Record<string, any>): string {
  if (obj.name) return String(obj.name);
  if (obj.firstName && obj.lastName) return `${obj.firstName} ${obj.lastName}`;
  if (obj.firstName) return String(obj.firstName);
  if (obj.email) return String(obj.email);
  if (obj.title) return String(obj.title);

  // Fallback: show up to 3 most meaningful fields
  const skipKeys = new Set(['id', 'createdAt', 'updatedAt', '_count']);
  const entries = Object.entries(obj).filter(([k]) => !skipKeys.has(k));
  if (entries.length === 0) return 'Brak danych';

  const parts = entries.slice(0, 3).map(([k, v]) => {
    const label = getFieldLabel(k);
    if (v === null || v === undefined) return `${label}: —`;
    if (typeof v === 'boolean') return `${label}: ${v ? 'Tak' : 'Nie'}`;
    if (typeof v === 'object') return `${label}: ...`;
    return `${label}: ${String(v)}`;
  });
  return parts.join(', ');
}

/** Extract meaningful labels from an array of objects */
function formatArraySummary(arr: any[]): string {
  if (arr.length === 0) return 'Brak';
  if (typeof arr[0] !== 'object') return arr.join(', ');

  const names = arr.map((item) => {
    if (item.name) return item.name;
    if (item.firstName && item.lastName) return `${item.firstName} ${item.lastName}`;
    if (item.firstName) return item.firstName;
    if (item.email) return item.email;
    return '?';
  });

  if (names.length <= 3) return names.join(', ');
  return `${names.slice(0, 3).join(', ')} (+${names.length - 3})`;
}

function formatValue(value: any, fieldName?: string): string {
  if (value === null || value === undefined) return '—';
  if (value === true) return 'Tak';
  if (value === false) return 'Nie';

  const str = String(value);

  // Status values — translate any field ending in Status or named status
  if (statusLabels[str] && (fieldName === 'status' || fieldName === 'oldStatus' || fieldName === 'newStatus')) {
    return statusLabels[str];
  }
  if (fieldName === 'paymentMethod' && paymentMethodLabels[str]) return paymentMethodLabels[str];
  if (fieldName === 'clientType' && clientTypeLabels[str]) return clientTypeLabels[str];
  if (fieldName === 'discountType' && discountTypeLabels[str]) return discountTypeLabels[str];
  if (fieldName === 'priceType' && priceTypeLabels[str]) return priceTypeLabels[str];

  // Currency amounts (numeric fields with money-related names)
  if (typeof value === 'number' && /amount|price|totalPrice|pricePerPerson|advanceAmount|basePrice|restoredPrice|discountAmount|pricePerAdult|pricePerChild|extraHourRate/.test(fieldName || '')) {
    return `${value.toLocaleString('pl-PL')} zł`;
  }

  // Percentage
  if (typeof value === 'number' && fieldName === 'discountValue') {
    return `${value}%`;
  }

  // Date strings (ISO format)
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}(T|\s)/.test(value)) {
    try {
      return format(new Date(value), 'd MMMM yyyy, HH:mm', { locale: pl });
    } catch {
      return str;
    }
  }
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    try {
      return format(new Date(value + 'T00:00:00'), 'd MMMM yyyy', { locale: pl });
    } catch {
      return str;
    }
  }

  // Arrays
  if (Array.isArray(value)) {
    return formatArraySummary(value);
  }

  // Objects — extract meaningful data
  if (typeof value === 'object') {
    return formatObjectSummary(value);
  }

  return str;
}

function getFieldLabel(key: string): string {
  return fieldLabels[key] || key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase()).trim();
}

// ─── Detect if changes object uses {old, new} format (from diffObjects) ─────

function isDiffFormat(changes: Record<string, any>): boolean {
  const keys = Object.keys(changes);
  if (keys.length === 0) return false;
  return keys.slice(0, 3).every(
    (k) => changes[k] && typeof changes[k] === 'object' && !Array.isArray(changes[k]) && ('old' in changes[k] || 'new' in changes[k])
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

/** A single "old → new" change row */
function DiffChangeRow({ fieldName, oldVal, newVal }: { fieldName: string; oldVal: any; newVal: any }) {
  const label = getFieldLabel(fieldName);
  const oldStr = formatValue(oldVal, fieldName);
  const newStr = formatValue(newVal, fieldName);

  return (
    <div className="flex items-start gap-3 py-3 px-4 group">
      <div className="w-[140px] flex-shrink-0 pt-0.5">
        <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{label}</span>
      </div>
      <div className="flex-1 flex items-center gap-2 flex-wrap min-w-0">
        {/* Old value */}
        <div className="inline-flex items-center gap-1.5 max-w-[45%]">
          <span className="inline-block px-2.5 py-1 rounded-lg bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 text-sm border border-red-100 dark:border-red-900/50 break-words">
            {oldStr}
          </span>
        </div>
        {/* Arrow */}
        <ArrowRight className="h-3.5 w-3.5 text-zinc-400 dark:text-zinc-500 flex-shrink-0" />
        {/* New value */}
        <div className="inline-flex items-center gap-1.5 max-w-[45%]">
          <span className="inline-block px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 text-sm font-medium border border-emerald-100 dark:border-emerald-900/50 break-words">
            {newStr}
          </span>
        </div>
      </div>
    </div>
  );
}

/** Row for flat changes (just key: value without old/new) */
function FlatChangeRow({ fieldName, value }: { fieldName: string; value: any }) {
  const label = getFieldLabel(fieldName);
  const valueStr = formatValue(value, fieldName);

  return (
    <div className="flex items-start gap-3 py-2.5 px-4">
      <div className="w-[140px] flex-shrink-0 pt-0.5">
        <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{label}</span>
      </div>
      <div className="flex-1 min-w-0">
        <span className="text-sm text-zinc-800 dark:text-zinc-200 break-words">{valueStr}</span>
      </div>
    </div>
  );
}

/** Data card for CREATE operations — shows created entity data */
function CreatedDataCard({ data }: { data: Record<string, any> }) {
  return (
    <div className="rounded-xl border border-blue-200 dark:border-blue-800/50 overflow-hidden">
      <div className="px-4 py-2.5 bg-blue-50 dark:bg-blue-950/30 border-b border-blue-200 dark:border-blue-800/50 flex items-center gap-2">
        <Plus className="h-3.5 w-3.5 text-blue-500" />
        <span className="text-xs font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wider">Utworzone dane</span>
      </div>
      <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
        {Object.entries(data).map(([key, value]) => (
          <FlatChangeRow key={key} fieldName={key} value={value} />
        ))}
      </div>
    </div>
  );
}

/** Data card for DELETE operations — shows deleted entity data */
function DeletedDataCard({ data }: { data: Record<string, any> }) {
  return (
    <div className="rounded-xl border border-red-200 dark:border-red-800/50 overflow-hidden">
      <div className="px-4 py-2.5 bg-red-50 dark:bg-red-950/30 border-b border-red-200 dark:border-red-800/50 flex items-center gap-2">
        <Trash2 className="h-3.5 w-3.5 text-red-500" />
        <span className="text-xs font-semibold text-red-700 dark:text-red-300 uppercase tracking-wider">Usunięte dane</span>
      </div>
      <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
        {Object.entries(data).map(([key, value]) => (
          <FlatChangeRow key={key} fieldName={key} value={value} />
        ))}
      </div>
    </div>
  );
}

/** Toggle (oldValue/newValue at top level) visualization */
function ToggleCard({ oldValue, newValue, fieldName }: { oldValue: any; newValue: any; fieldName?: string }) {
  return (
    <div className="rounded-xl border border-teal-200 dark:border-teal-800/50 overflow-hidden">
      <div className="px-4 py-2.5 bg-teal-50 dark:bg-teal-950/30 border-b border-teal-200 dark:border-teal-800/50 flex items-center gap-2">
        <ToggleLeft className="h-3.5 w-3.5 text-teal-500" />
        <span className="text-xs font-semibold text-teal-700 dark:text-teal-300 uppercase tracking-wider">Zmiana wartości</span>
      </div>
      <div className="p-4">
        <DiffChangeRow fieldName={fieldName || 'wartość'} oldVal={oldValue} newVal={newValue} />
      </div>
    </div>
  );
}

/** Status change card (oldStatus → newStatus) */
function StatusChangeCard({ oldStatus, newStatus }: { oldStatus?: string; newStatus?: string }) {
  const oldLabel = oldStatus ? (statusLabels[oldStatus] || oldStatus) : '—';
  const newLabel = newStatus ? (statusLabels[newStatus] || newStatus) : '—';

  return (
    <div className="rounded-xl border border-violet-200 dark:border-violet-800/50 overflow-hidden">
      <div className="px-4 py-2.5 bg-violet-50 dark:bg-violet-950/30 border-b border-violet-200 dark:border-violet-800/50 flex items-center gap-2">
        <RefreshCw className="h-3.5 w-3.5 text-violet-500" />
        <span className="text-xs font-semibold text-violet-700 dark:text-violet-300 uppercase tracking-wider">Zmiana statusu</span>
      </div>
      <div className="p-4">
        <div className="flex items-center gap-3 justify-center">
          <span className="inline-block px-3 py-1.5 rounded-lg bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 text-sm font-medium border border-red-100 dark:border-red-900/50">
            {oldLabel}
          </span>
          <ArrowRight className="h-4 w-4 text-zinc-400 dark:text-zinc-500 flex-shrink-0" />
          <span className="inline-block px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 text-sm font-medium border border-emerald-100 dark:border-emerald-900/50">
            {newLabel}
          </span>
        </div>
      </div>
    </div>
  );
}

/** Diff changes card (from diffObjects: { field: {old, new} }) */
function DiffChangesCard({ changes }: { changes: Record<string, { old: any; new: any }> }) {
  const entries = Object.entries(changes);
  return (
    <div className="rounded-xl border border-amber-200 dark:border-amber-800/50 overflow-hidden">
      <div className="px-4 py-2.5 bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-800/50 flex items-center gap-2">
        <Repeat className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
        <span className="text-xs font-semibold text-amber-700 dark:text-amber-300 uppercase tracking-wider">
          {'Zmienione pola (' + entries.length + ')'}
        </span>
      </div>
      <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
        {entries.map(([field, val]) => (
          <DiffChangeRow key={field} fieldName={field} oldVal={val.old} newVal={val.new} />
        ))}
      </div>
    </div>
  );
}

/** Flat changes card (for simple key:value changes without old/new) */
function FlatChangesCard({ changes }: { changes: Record<string, any> }) {
  return (
    <div className="rounded-xl border border-amber-200 dark:border-amber-800/50 overflow-hidden">
      <div className="px-4 py-2.5 bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-800/50 flex items-center gap-2">
        <Layers className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
        <span className="text-xs font-semibold text-amber-700 dark:text-amber-300 uppercase tracking-wider">Zmienione dane</span>
      </div>
      <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
        {Object.entries(changes).map(([key, value]) => (
          <FlatChangeRow key={key} fieldName={key} value={value} />
        ))}
      </div>
    </div>
  );
}

/** Discount card */
function DiscountCard({ details }: { details: Record<string, any> }) {
  const isApplied = !!details.discountType;
  const isRemoved = !!details.removedDiscount;

  return (
    <div className="rounded-xl border border-purple-200 dark:border-purple-800/50 overflow-hidden">
      <div className="px-4 py-2.5 bg-purple-50 dark:bg-purple-950/30 border-b border-purple-200 dark:border-purple-800/50 flex items-center gap-2">
        <Percent className="h-3.5 w-3.5 text-purple-500" />
        <span className="text-xs font-semibold text-purple-700 dark:text-purple-300 uppercase tracking-wider">
          {isRemoved ? 'Usunięty rabat' : 'Naliczony rabat'}
        </span>
      </div>
      <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
        {isApplied && (
          <>
            <FlatChangeRow fieldName="discountType" value={details.discountType} />
            <FlatChangeRow fieldName="discountValue" value={details.discountValue} />
            {details.discountAmount && <FlatChangeRow fieldName="discountAmount" value={details.discountAmount} />}
            {details.reason && <FlatChangeRow fieldName="reason" value={details.reason} />}
          </>
        )}
        {isRemoved && (
          <>
            <FlatChangeRow fieldName="discountType" value={details.removedDiscount?.type} />
            <FlatChangeRow fieldName="discountValue" value={details.removedDiscount?.value} />
            <FlatChangeRow fieldName="discountAmount" value={details.removedDiscount?.amount} />
            {details.restoredPrice && <FlatChangeRow fieldName="restoredPrice" value={details.restoredPrice} />}
          </>
        )}
      </div>
    </div>
  );
}

/** Payment card */
function PaymentCard({ details }: { details: Record<string, any> }) {
  return (
    <div className="rounded-xl border border-green-200 dark:border-green-800/50 overflow-hidden">
      <div className="px-4 py-2.5 bg-green-50 dark:bg-green-950/30 border-b border-green-200 dark:border-green-800/50 flex items-center gap-2">
        <CreditCard className="h-3.5 w-3.5 text-green-500" />
        <span className="text-xs font-semibold text-green-700 dark:text-green-300 uppercase tracking-wider">Dane płatności</span>
      </div>
      <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
        {details.data?.amountPaid && <FlatChangeRow fieldName="amountPaid" value={details.data.amountPaid} />}
        {details.data?.paymentMethod && <FlatChangeRow fieldName="paymentMethod" value={details.data.paymentMethod} />}
        {details.data?.status && <FlatChangeRow fieldName="status" value={details.data.status} />}
      </div>
    </div>
  );
}

/** Reorder card */
function ReorderCard({ orderedIds }: { orderedIds: string[] }) {
  return (
    <div className="rounded-xl border border-indigo-200 dark:border-indigo-800/50 overflow-hidden">
      <div className="px-4 py-2.5 bg-indigo-50 dark:bg-indigo-950/30 border-b border-indigo-200 dark:border-indigo-800/50 flex items-center gap-2">
        <ListOrdered className="h-3.5 w-3.5 text-indigo-500" />
        <span className="text-xs font-semibold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider">
          {'Nowa kolejność (' + orderedIds.length + ' elementów)'}
        </span>
      </div>
      <div className="p-4">
        <div className="flex flex-wrap gap-1.5">
          {orderedIds.map((id, i) => (
            <span
              key={id}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/30 text-xs text-indigo-600 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800/50"
            >
              <span className="font-semibold text-indigo-400 dark:text-indigo-500">{i + 1}.</span>
              <span className="font-mono">{id.slice(0, 8)}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main details renderer ───────────────────────────────────────────────────

/** Renders the appropriate visualization for the details section */
function DetailsVisualization({ details, action }: { details: Record<string, any>; action: string }) {
  const cards: React.ReactNode[] = [];

  // 1) Description
  if (details.description) {
    cards.push(
      <div key="desc" className="flex items-start gap-2.5 p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/30 border border-zinc-100 dark:border-zinc-700/50">
        <Info className="h-4 w-4 text-zinc-400 mt-0.5 flex-shrink-0" />
        <p className="text-sm text-zinc-700 dark:text-zinc-200 leading-relaxed">{details.description}</p>
      </div>
    );
  }

  // 2) Reason
  if (details.reason) {
    cards.push(
      <div key="reason" className="flex items-start gap-2.5 p-3.5 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-800/30">
        <Tag className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-[11px] font-medium text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-0.5">Powód</p>
          <p className="text-sm text-zinc-700 dark:text-zinc-200">{details.reason}</p>
        </div>
      </div>
    );
  }

  // 3) Status change (oldStatus/newStatus)
  if (details.oldStatus || details.newStatus) {
    cards.push(
      <StatusChangeCard key="status-change" oldStatus={details.oldStatus} newStatus={details.newStatus} />
    );
  }

  // 4) Changes (diffObjects format: { field: {old, new} })
  if (details.changes) {
    if (isDiffFormat(details.changes)) {
      cards.push(<DiffChangesCard key="diff-changes" changes={details.changes} />);
    } else {
      // Flat changes (key: value without old/new)
      cards.push(<FlatChangesCard key="flat-changes" changes={details.changes} />);
    }
  }

  // 5) Toggle (oldValue/newValue at top level)
  if ('oldValue' in details || 'newValue' in details) {
    cards.push(
      <ToggleCard key="toggle" oldValue={details.oldValue} newValue={details.newValue} fieldName={details.fieldName} />
    );
  }

  // 6) Created data
  if (details.data && (action.includes('CREATE') || action === 'DEPOSIT_CREATED' || action === 'MARK_PAID')) {
    if (action === 'MARK_PAID') {
      cards.push(<PaymentCard key="payment" details={details} />);
    } else {
      cards.push(<CreatedDataCard key="created" data={details.data} />);
    }
  }

  // 7) Deleted data
  if (details.deletedData) {
    cards.push(<DeletedDataCard key="deleted" data={details.deletedData} />);
  }

  // 8) Discount
  if (details.discountType || details.removedDiscount) {
    cards.push(<DiscountCard key="discount" details={details} />);
  }

  // 9) Reorder
  if (details.orderedIds && Array.isArray(details.orderedIds)) {
    cards.push(<ReorderCard key="reorder" orderedIds={details.orderedIds} />);
  }

  // 10) Duplicate source
  if (details.sourceId) {
    cards.push(
      <div key="source" className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-800/30">
        <Package className="h-3.5 w-3.5 text-indigo-500" />
        <span className="text-xs text-zinc-500 dark:text-zinc-400">{'Źródło:'}</span>
        <span className="text-xs font-mono text-indigo-600 dark:text-indigo-300">{details.sourceId.slice(0, 12)}...</span>
      </div>
    );
  }

  // 11) Fallback for any remaining unknown keys (excluding already rendered)
  const renderedKeys = new Set([
    'description', 'reason', 'changes', 'oldValue', 'newValue', 'fieldName',
    'data', 'deletedData', 'discountType', 'discountValue', 'discountAmount',
    'removedDiscount', 'restoredPrice', 'orderedIds', 'sourceId',
    'oldStatus', 'newStatus',
  ]);
  const remainingEntries = Object.entries(details).filter(([k]) => !renderedKeys.has(k));

  if (remainingEntries.length > 0) {
    cards.push(
      <div key="extra" className="rounded-xl border border-zinc-200 dark:border-zinc-700 overflow-hidden">
        <div className="px-4 py-2 bg-zinc-50 dark:bg-zinc-800/30 border-b border-zinc-100 dark:border-zinc-700">
          <span className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Dodatkowe informacje</span>
        </div>
        <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {remainingEntries.map(([key, value]) => (
            <FlatChangeRow key={key} fieldName={key} value={value} />
          ))}
        </div>
      </div>
    );
  }

  if (cards.length === 0) return null;

  return <div className="space-y-3">{cards}</div>;
}

// ─── Main component ──────────────────────────────────────────────────────────

interface Props {
  log: AuditLogEntry;
  open: boolean;
  onClose: () => void;
}

export function AuditLogDetails({ log, open, onClose }: Props) {
  const [showTechnical, setShowTechnical] = useState(false);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl !p-0 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Gradient Header */}
        <div className="relative bg-gradient-to-r from-zinc-800 via-zinc-700 to-neutral-700 dark:from-zinc-900 dark:via-zinc-800 dark:to-neutral-800 px-6 py-5 flex-shrink-0">
          <div className="flex items-center gap-3 pr-8">
            <div className="p-2.5 bg-white/15 rounded-xl backdrop-blur-sm">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">{'Szczegóły wpisu'}</h2>
              <p className="text-sm text-white/60">
                {format(new Date(log.createdAt), 'd MMMM yyyy, HH:mm:ss', { locale: pl })}
              </p>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Info Grid */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-700/50">
              <div className="p-1.5 rounded-lg bg-zinc-200/70 dark:bg-zinc-700 flex-shrink-0">
                <Calendar className="h-3.5 w-3.5 text-zinc-600 dark:text-zinc-300" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Data i czas</p>
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mt-0.5">
                  {format(new Date(log.createdAt), 'd MMMM yyyy', { locale: pl })}
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {format(new Date(log.createdAt), 'HH:mm:ss')}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-700/50">
              <div className="p-1.5 rounded-lg bg-zinc-200/70 dark:bg-zinc-700 flex-shrink-0">
                <User className="h-3.5 w-3.5 text-zinc-600 dark:text-zinc-300" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">{'Użytkownik'}</p>
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mt-0.5">
                  {log.user?.firstName || 'System'} {log.user?.lastName || ''}
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">{log.user?.email || 'Akcja automatyczna'}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-700/50">
              <div className="p-1.5 rounded-lg bg-zinc-200/70 dark:bg-zinc-700 flex-shrink-0">
                <Tag className="h-3.5 w-3.5 text-zinc-600 dark:text-zinc-300" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Wykonana akcja</p>
                <Badge
                  variant="outline"
                  className={`mt-1.5 text-xs font-medium ${actionColors[log.action] || 'bg-zinc-100 text-zinc-600'}`}
                >
                  {actionLabels[log.action] || log.action}
                </Badge>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-700/50">
              <div className="p-1.5 rounded-lg bg-zinc-200/70 dark:bg-zinc-700 flex-shrink-0">
                <FileText className="h-3.5 w-3.5 text-zinc-600 dark:text-zinc-300" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Typ obiektu</p>
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mt-0.5">
                  {entityLabels[log.entityType] || log.entityType}
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 font-mono break-all">
                  {'ID: '}{log.entityId}
                </p>
              </div>
            </div>
          </div>

          {/* Szczegóły zmiany — Premium visualization */}
          {log.details && (
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 overflow-hidden">
              <div className="px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-700">
                <h4 className="text-sm font-semibold flex items-center gap-2 text-zinc-700 dark:text-zinc-200">
                  <Hash className="h-4 w-4 text-zinc-400" />
                  {'Szczegóły zmiany'}
                </h4>
              </div>
              <div className="p-4">
                <DetailsVisualization details={log.details} action={log.action} />
              </div>
            </div>
          )}

          {/* Informacje techniczne — collapsible */}
          <div className="rounded-xl border border-dashed border-zinc-200 dark:border-zinc-700">
            <button
              onClick={() => setShowTechnical(!showTechnical)}
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors rounded-xl"
            >
              <h4 className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                Informacje techniczne
              </h4>
              {showTechnical ? (
                <ChevronUp className="h-3.5 w-3.5 text-zinc-400" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5 text-zinc-400" />
              )}
            </button>
            {showTechnical && (
              <div className="px-4 pb-4 pt-0">
                <div className="grid gap-2.5 sm:grid-cols-2">
                  <div className="flex items-center gap-2">
                    <Globe className="h-3.5 w-3.5 text-zinc-400 flex-shrink-0" />
                    <span className="text-xs text-zinc-500">Adres IP:</span>
                    <span className="text-xs font-mono text-zinc-700 dark:text-zinc-300">
                      {log.ipAddress || 'Nieznany'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 min-w-0">
                    <Monitor className="h-3.5 w-3.5 text-zinc-400 flex-shrink-0" />
                    <span className="text-xs text-zinc-500 flex-shrink-0">{'Przeglądarka:'}</span>
                    <span className="text-xs font-mono text-zinc-700 dark:text-zinc-300 truncate">
                      {log.userAgent ? log.userAgent.split(' ').slice(0, 3).join(' ') : 'Nieznana'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-2.5 pt-2.5 border-t border-dashed border-zinc-200 dark:border-zinc-700">
                  <Hash className="h-3.5 w-3.5 text-zinc-400 flex-shrink-0" />
                  <span className="text-xs text-zinc-500">ID wpisu:</span>
                  <span className="text-xs font-mono text-zinc-700 dark:text-zinc-300 select-all break-all">{log.id}</span>
                </div>

                {/* Raw JSON fallback — for developers */}
                {log.details && (
                  <div className="mt-3 pt-3 border-t border-dashed border-zinc-200 dark:border-zinc-700">
                    <p className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-2">Surowe dane (JSON)</p>
                    <pre className="rounded-lg bg-zinc-950 text-zinc-100 p-3 text-[11px] overflow-auto max-h-36 font-mono leading-relaxed">
                      {JSON.stringify(log.details, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
