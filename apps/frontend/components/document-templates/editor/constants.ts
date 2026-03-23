import {
  Bold,
  Italic,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Minus,
  Quote,
} from 'lucide-react';
import type { ToolbarAction } from './types';

// ── Human-readable variable labels ─────────────────────

export const VAR_LABELS: Record<string, string> = {
  hallName: 'Nazwa sali',
  eventDate: 'Data wydarzenia',
  guestCount: 'Liczba gości',
  depositAmount: 'Kwota zaliczki',
  depositDueDate: 'Termin zaliczki',
  companyName: 'Nazwa firmy',
  generatedDate: 'Data wygenerowania',
  clientName: 'Imię i nazwisko klienta',
  clientEmail: 'E-mail klienta',
  clientPhone: 'Telefon klienta',
  eventType: 'Typ wydarzenia',
  totalPrice: 'Cena całkowita',
  menuName: 'Nazwa menu',
  cateringDate: 'Data cateringu',
  servingCount: 'Liczba porcji',
  cancellationDays: 'Dni na anulowanie',
  cancellationFee: 'Opłata za anulowanie',
  companyAddress: 'Adres firmy',
  companyNIP: 'NIP firmy',
  companyPhone: 'Telefon firmy',
  companyEmail: 'E-mail firmy',
  companyBankName: 'Nazwa banku',
  companyBankAccount: 'Numer konta',
  remainingAmount: 'Pozostała kwota',
  effectiveDate: 'Data obowiązywania',
};

// ── Sample variable values for preview ─────────────────

export const SAMPLE_VARS: Record<string, string> = {
  hallName: 'Sala Złota',
  eventDate: '15 czerwca 2026',
  guestCount: '120',
  depositAmount: '5 000 zł',
  depositDueDate: '15 marca 2026',
  companyName: 'Gościniec Rodzinny',
  generatedDate: '25 lutego 2026',
  clientName: 'Jan Kowalski',
  clientEmail: 'jan@example.com',
  clientPhone: '+48 600 123 456',
  eventType: 'Wesele',
  totalPrice: '25 000 zł',
  menuName: 'Pakiet Premium',
  cateringDate: '15 czerwca 2026',
  servingCount: '120',
  cancellationDays: '30',
  cancellationFee: '50%',
  companyAddress: 'ul. Weselna 12, 00-001 Warszawa',
  companyNIP: '123-456-78-90',
  companyPhone: '+48 22 123 45 67',
  companyEmail: 'kontakt@gosciniec.pl',
  companyBankName: 'Bank PKO BP',
  companyBankAccount: '12 3456 7890 1234 5678 9012 3456',
  remainingAmount: '20 000 zł',
  effectiveDate: '1 marca 2026',
};

// ── Markdown toolbar definitions ──────────────────────

export const MD_TOOLBAR: ToolbarAction[] = [
  { icon: Bold,        label: 'Pogrubienie',      shortcut: 'Ctrl+B', action: 'wrap',   before: '**', after: '**' },
  { icon: Italic,      label: 'Kursywa',          shortcut: 'Ctrl+I', action: 'wrap',   before: '*',  after: '*' },
  { icon: Heading2,    label: 'Nagłówek H2',                          action: 'prefix', prefix: '## ' },
  { icon: Heading3,    label: 'Nagłówek H3',                          action: 'prefix', prefix: '### ' },
  { icon: List,        label: 'Lista punktowa',                       action: 'prefix', prefix: '- ' },
  { icon: ListOrdered, label: 'Lista numerowana',                     action: 'prefix', prefix: '1. ' },
  { icon: Quote,       label: 'Cytat',                                action: 'prefix', prefix: '> ' },
  { icon: Minus,       label: 'Separator',                            action: 'insert', insert: '\n---\n' },
];
