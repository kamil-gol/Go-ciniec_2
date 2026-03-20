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
  Calendar, User, Tag, FileText, Globe, Monitor, Hash, X,
  ArrowRight, Plus, Trash2, ToggleLeft, Repeat, ChevronDown, ChevronUp,
  Info, CreditCard, Package, Percent, ListOrdered, Layers,
} from 'lucide-react';
import { useState } from 'react';
import type { AuditLogEntry } from '@/types/audit-log.types';

// ─── Polish labels ───────────────────────────────────────────────────────────

const actionLabels: Record<string, string> = {
  CREATE: 'Utworzenie',
  UPDATE: 'Aktualizacja',
  DELETE: 'Usuni\u0119cie',
  SOFT_DELETE: 'Usuni\u0119cie (mi\u0119kkie)',
  TOGGLE: 'Prze\u0142\u0105czenie',
  TOGGLE_ACTIVE: 'Prze\u0142\u0105czenie aktywno\u015bci',
  REORDER: 'Zmiana kolejno\u015bci',
  DUPLICATE: 'Duplikacja',
  STATUS_CHANGE: 'Zmiana statusu',
  CANCEL: 'Anulowanie',
  ARCHIVE: 'Archiwizacja',
  UNARCHIVE: 'Przywr\u00f3cenie',
  RESTORE: 'Przywr\u00f3cenie',
  AUTO_ARCHIVED: 'Auto-archiwizacja',
  AUTO_CONFIRM: 'Auto-potwierdzenie',
  MENU_UPDATE: 'Aktualizacja menu',
  MENU_UPDATED: 'Aktualizacja menu',
  MENU_REMOVE: 'Usuni\u0119cie menu',
  MENU_REMOVED: 'Usuni\u0119cie menu',
  MENU_SELECTED: 'Wyb\u00f3r menu',
  MENU_RECALCULATED: 'Przeliczenie menu',
  MENU_DIRECT_REMOVED: 'Bezpo\u015brednie usuni\u0119cie menu',
  CATEGORY_EXTRAS_UPDATED: 'Aktualizacja dodatkowo p\u0142atnych porcji',
  CATEGORY_EXTRAS_REMOVED: 'Usuni\u0119cie dodatkowo p\u0142atnych porcji',
  PAYMENT_UPDATE: 'Aktualizacja p\u0142atno\u015bci',
  MARK_PAID: 'Oznaczenie jako op\u0142acone',
  MARK_UNPAID: 'Oznaczenie jako nieop\u0142acone',
  DEPOSIT_CREATED: 'Dodanie zaliczki',
  DEPOSIT_DELETED: 'Usuni\u0119cie zaliczki',
  DEPOSIT_PAID: 'Op\u0142acenie zaliczki',
  DEPOSIT_CANCELLED: 'Anulowanie zaliczki',
  DISCOUNT_APPLIED: 'Naliczenie rabatu',
  DISCOUNT_REMOVED: 'Usuni\u0119cie rabatu',
  BULK_ASSIGN: 'Zbiorcze przypisanie',
  QUEUE_ADD: 'Dodanie do kolejki',
  QUEUE_UPDATE: 'Aktualizacja w kolejce',
  QUEUE_REMOVE: 'Usuni\u0119cie z kolejki',
  QUEUE_SWAP: 'Zamiana pozycji',
  QUEUE_MOVE: 'Przeniesienie w kolejce',
  QUEUE_REORDER: 'Zmiana kolejno\u015bci',
  QUEUE_REBUILD: 'Przebudowa kolejki',
  QUEUE_PROMOTE: 'Awans z kolejki',
  QUEUE_AUTO_CANCEL: 'Auto-anulowanie z kolejki',
  ATTACHMENT_UPLOAD: 'Wgranie za\u0142\u0105cznika',
  ATTACHMENT_ADD: 'Dodanie za\u0142\u0105cznika',
  ATTACHMENT_UPDATE: 'Aktualizacja za\u0142\u0105cznika',
  ATTACHMENT_ARCHIVE: 'Archiwizacja za\u0142\u0105cznika',
  ATTACHMENT_DELETE: 'Usuni\u0119cie za\u0142\u0105cznika',
  ATTACHMENT_DEDUP: 'Deduplikacja za\u0142\u0105cznika',
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
  RESERVATION_EXTRA: 'Us\u0142uga dodatkowa',
  CLIENT: 'Klient',
  CLIENT_CONTACT: 'Kontakt klienta',
  ROOM: 'Sala',
  HALL: 'Sala',
  MENU: 'Menu',
  USER: 'U\u017cytkownik',
  DEPOSIT: 'Zaliczka',
  EVENT_TYPE: 'Typ wydarzenia',
  ATTACHMENT: 'Za\u0142\u0105cznik',
  QUEUE: 'Kolejka',
  DISH: 'Danie',
  MENU_TEMPLATE: 'Szablon menu',
  MENU_PACKAGE: 'Pakiet menu',
  PACKAGE: 'Pakiet',
  DOCUMENT_TEMPLATE: 'Szablon dokumentu',
  CATERING_ORDER: 'Zam\u00f3wienie catering',
  SERVICE_CATEGORY: 'Kategoria us\u0142ug',
  SERVICE_ITEM: 'Pozycja us\u0142ugi',
  Role: 'Rola',
  CompanySettings: 'Ustawienia firmy',
  ServiceExtra: 'Us\u0142uga dodatkowa',
  ServiceCategory: 'Kategoria us\u0142ug',
  ServiceItem: 'Pozycja us\u0142ugi',
};

// ─── Field name translations (technical → Polish) ───────────────────────────

const fieldLabels: Record<string, string> = {
  // Reservation fields
  status: 'Status',
  eventDate: 'Data wydarzenia',
  eventEndDate: 'Data zako\u0144czenia',
  startTime: 'Godzina rozpocz\u0119cia',
  endTime: 'Godzina zako\u0144czenia',
  guestCount: 'Liczba go\u015bci',
  adultCount: 'Doro\u015bli',
  childCount: 'Dzieci',
  notes: 'Notatki',
  internalNotes: 'Notatki wewn\u0119trzne',
  totalPrice: 'Cena ca\u0142kowita',
  pricePerPerson: 'Cena za osob\u0119',
  advanceAmount: 'Kwota zaliczki',
  isArchived: 'Zarchiwizowana',
  confirmedAt: 'Data potwierdzenia',
  cancelledAt: 'Data anulowania',
  archivedAt: 'Data archiwizacji',
  // Client fields
  firstName: 'Imi\u0119',
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
  category: 'Kategoria',
  // Hall / Room fields
  capacity: 'Pojemno\u015b\u0107',
  isWholeVenue: 'Ca\u0142y obiekt',
  allowWithWholeVenue: 'Dost\u0119pna z ca\u0142ym obiektem',
  allowMultipleBookings: 'Wielokrotne rezerwacje',
  // Deposit fields
  amount: 'Kwota',
  dueDate: 'Termin p\u0142atno\u015bci',
  paidAt: 'Data op\u0142aty',
  paymentMethod: 'Metoda p\u0142atno\u015bci',
  amountPaid: 'Kwota zap\u0142acona',
  wasPaid: 'By\u0142a op\u0142acona',
  // Discount fields
  discountType: 'Typ rabatu',
  discountValue: 'Warto\u015b\u0107 rabatu',
  discountAmount: 'Kwota rabatu',
  reason: 'Pow\u00f3d',
  restoredPrice: 'Przywr\u00f3cona cena',
  // Service fields
  slug: 'Identyfikator',
  isExclusive: 'Wy\u0142\u0105czny',
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
  // Common
  reservationId: 'ID rezerwacji',
  clientId: 'ID klienta',
  sourceId: 'ID \u017ar\u00f3d\u0142a',
  orderedIds: 'Kolejno\u015b\u0107 element\u00f3w',
  contacts: 'Osoby kontaktowe',
  role: 'Stanowisko',
  menu: 'Menu',
  type: 'Typ',
  value: 'Warto\u015b\u0107',
};

// ─── Value formatting helpers ────────────────────────────────────────────────

const statusLabels: Record<string, string> = {
  PENDING: 'Oczekuj\u0105ca',
  CONFIRMED: 'Potwierdzona',
  CANCELLED: 'Anulowana',
  COMPLETED: 'Zako\u0144czona',
  DRAFT: 'Wersja robocza',
  TENTATIVE: 'Wst\u0119pna',
  PAID: 'Op\u0142acona',
  UNPAID: 'Nieop\u0142acona',
  PARTIAL: 'Cz\u0119\u015bciowo op\u0142acona',
  OVERDUE: 'Zaleg\u0142a',
  ACTIVE: 'Aktywna',
  INACTIVE: 'Nieaktywna',
  ARCHIVED: 'Zarchiwizowana',
};

const paymentMethodLabels: Record<string, string> = {
  CASH: 'Got\u00f3wka',
  BANK_TRANSFER: 'Przelew bankowy',
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
  FLAT: 'Sta\u0142a',
  PER_PERSON: 'Za osob\u0119',
  PER_HOUR: 'Za godzin\u0119',
};

function formatValue(value: any, fieldName?: string): string {
  if (value === null || value === undefined) return '\u2014';
  if (value === true) return 'Tak';
  if (value === false) return 'Nie';

  const str = String(value);

  // Status values
  if (fieldName === 'status' && statusLabels[str]) return statusLabels[str];
  if (fieldName === 'paymentMethod' && paymentMethodLabels[str]) return paymentMethodLabels[str];
  if (fieldName === 'clientType' && clientTypeLabels[str]) return clientTypeLabels[str];
  if (fieldName === 'discountType' && discountTypeLabels[str]) return discountTypeLabels[str];
  if (fieldName === 'priceType' && priceTypeLabels[str]) return priceTypeLabels[str];

  // Currency amounts (numeric fields with money-related names)
  if (typeof value === 'number' && /amount|price|totalPrice|pricePerPerson|advanceAmount|basePrice|restoredPrice|discountAmount/.test(fieldName || '')) {
    return `${value.toLocaleString('pl-PL')} z\u0142`;
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
    if (value.length === 0) return 'Brak';
    // Array of objects (like contacts) — show count
    if (typeof value[0] === 'object') return `${value.length} element\u00f3w`;
    return value.join(', ');
  }

  // Objects — short summary
  if (typeof value === 'object') {
    const keys = Object.keys(value);
    if (keys.length === 0) return 'Brak danych';
    return `Obiekt (${keys.length} p\u00f3l)`;
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
  // Check first few keys
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
        <span className="text-xs font-semibold text-red-700 dark:text-red-300 uppercase tracking-wider">Usuni\u0119te dane</span>
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
        <span className="text-xs font-semibold text-teal-700 dark:text-teal-300 uppercase tracking-wider">Zmiana warto\u015bci</span>
      </div>
      <div className="p-4">
        <DiffChangeRow fieldName={fieldName || 'warto\u015b\u0107'} oldVal={oldValue} newVal={newValue} />
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
          Zmienione pola ({entries.length})
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
          {isRemoved ? 'Usuni\u0119ty rabat' : 'Naliczony rabat'}
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
        <span className="text-xs font-semibold text-green-700 dark:text-green-300 uppercase tracking-wider">Dane p\u0142atno\u015bci</span>
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
          Nowa kolejno\u015b\u0107 ({orderedIds.length} element\u00f3w)
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
          <p className="text-[11px] font-medium text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-0.5">Pow\u00f3d</p>
          <p className="text-sm text-zinc-700 dark:text-zinc-200">{details.reason}</p>
        </div>
      </div>
    );
  }

  // 3) Changes (diffObjects format: { field: {old, new} })
  if (details.changes) {
    if (isDiffFormat(details.changes)) {
      cards.push(<DiffChangesCard key="diff-changes" changes={details.changes} />);
    } else {
      // Flat changes (key: value without old/new)
      cards.push(<FlatChangesCard key="flat-changes" changes={details.changes} />);
    }
  }

  // 4) Toggle (oldValue/newValue at top level)
  if ('oldValue' in details || 'newValue' in details) {
    cards.push(
      <ToggleCard key="toggle" oldValue={details.oldValue} newValue={details.newValue} fieldName={details.fieldName} />
    );
  }

  // 5) Created data
  if (details.data && (action.includes('CREATE') || action === 'DEPOSIT_CREATED' || action === 'MARK_PAID')) {
    if (action === 'MARK_PAID') {
      cards.push(<PaymentCard key="payment" details={details} />);
    } else {
      cards.push(<CreatedDataCard key="created" data={details.data} />);
    }
  }

  // 6) Deleted data
  if (details.deletedData) {
    cards.push(<DeletedDataCard key="deleted" data={details.deletedData} />);
  }

  // 7) Discount
  if (details.discountType || details.removedDiscount) {
    cards.push(<DiscountCard key="discount" details={details} />);
  }

  // 8) Reorder
  if (details.orderedIds && Array.isArray(details.orderedIds)) {
    cards.push(<ReorderCard key="reorder" orderedIds={details.orderedIds} />);
  }

  // 9) Duplicate source
  if (details.sourceId) {
    cards.push(
      <div key="source" className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-800/30">
        <Package className="h-3.5 w-3.5 text-indigo-500" />
        <span className="text-xs text-zinc-500 dark:text-zinc-400">\u0179r\u00f3d\u0142o:</span>
        <span className="text-xs font-mono text-indigo-600 dark:text-indigo-300">{details.sourceId.slice(0, 12)}...</span>
      </div>
    );
  }

  // 10) Fallback for any remaining unknown keys (excluding already rendered)
  const renderedKeys = new Set([
    'description', 'reason', 'changes', 'oldValue', 'newValue', 'fieldName',
    'data', 'deletedData', 'discountType', 'discountValue', 'discountAmount',
    'removedDiscount', 'restoredPrice', 'orderedIds', 'sourceId',
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
          <button
            onClick={onClose}
            className="absolute top-3.5 right-3.5 p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-all duration-200"
            aria-label="Zamknij"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-3 pr-8">
            <div className="p-2.5 bg-white/15 rounded-xl backdrop-blur-sm">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Szczeg\u00f3\u0142y wpisu</h2>
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
                <p className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">U\u017cytkownik</p>
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
                <p className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">
                  ID: {log.entityId.slice(0, 8)}...
                </p>
              </div>
            </div>
          </div>

          {/* Szczeg\u00f3\u0142y zmiany — Premium visualization */}
          {log.details && (
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 overflow-hidden">
              <div className="px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-700">
                <h4 className="text-sm font-semibold flex items-center gap-2 text-zinc-700 dark:text-zinc-200">
                  <Hash className="h-4 w-4 text-zinc-400" />
                  Szczeg\u00f3\u0142y zmiany
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
                    <span className="text-xs text-zinc-500 flex-shrink-0">Przegl\u0105darka:</span>
                    <span className="text-xs font-mono text-zinc-700 dark:text-zinc-300 truncate">
                      {log.userAgent ? log.userAgent.split(' ').slice(0, 3).join(' ') : 'Nieznana'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-2.5 pt-2.5 border-t border-dashed border-zinc-200 dark:border-zinc-700">
                  <Hash className="h-3.5 w-3.5 text-zinc-400 flex-shrink-0" />
                  <span className="text-xs text-zinc-500">ID wpisu:</span>
                  <span className="text-xs font-mono text-zinc-700 dark:text-zinc-300 select-all">{log.id}</span>
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
