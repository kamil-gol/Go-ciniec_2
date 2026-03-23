import {
  User,
  CalendarDays,
  BookOpen,
  Package,
  Truck,
  ClipboardCheck,
} from 'lucide-react';
import type { StepConfig } from '@/components/ui/stepper';
import type {
  CateringDeliveryType,
  CreateOrderItemInput,
  CreateOrderExtraInput,
} from '@/types/catering-order.types';

// ═══ STEP CONFIGURATION ═══

export const STEPS: StepConfig[] = [
  { id: 'client',    title: 'Klient',          icon: User },
  { id: 'event',     title: 'Szczegóły',        icon: CalendarDays },
  { id: 'template',  title: 'Szablon / Pakiet', icon: BookOpen },
  { id: 'items',     title: 'Dania i Extras',   icon: Package },
  { id: 'logistics', title: 'Logistyka',        icon: Truck },
  { id: 'summary',   title: 'Podsumowanie',     icon: ClipboardCheck },
];

export const STEP_META = [
  {
    gradient: 'from-indigo-500 to-violet-500',
    title: 'Wybierz klienta',
    subtitle: 'Wyszukaj istniejącego klienta lub dodaj nowego',
  },
  {
    gradient: 'from-orange-500 to-amber-500',
    title: 'Szczegóły zamówienia',
    subtitle: 'Podaj okazję, datę realizacji i liczbę osób',
  },
  {
    gradient: 'from-blue-500 to-cyan-500',
    title: 'Szablon i pakiet',
    subtitle: 'Opcjonalnie wybierz gotowy szablon cateringu',
  },
  {
    gradient: 'from-green-500 to-emerald-500',
    title: 'Dania i usługi dodatkowe',
    subtitle: 'Dodaj pozycje menu i extra usługi do zamówienia',
  },
  {
    gradient: 'from-rose-500 to-pink-500',
    title: 'Logistyka dostawy',
    subtitle: 'Określ sposób dostarczenia zamówienia',
  },
  {
    gradient: 'from-teal-500 to-green-500',
    title: 'Sprawdź i utwórz',
    subtitle: 'Uzupełnij dane kontaktowe i przejrzyj zamówienie',
  },
];

export const stepVariants = {
  enter: { opacity: 0, x: 30 },
  center: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -30 },
};

// ═══ STATE ═══

export interface WizardState {
  clientId: string;
  clientName: string;
  eventName: string;
  eventDate: string;
  guestsCount: string;
  templateId: string;
  packageId: string;
  items: CreateOrderItemInput[];
  extras: CreateOrderExtraInput[];
  deliveryType: CateringDeliveryType;
  deliveryStreet: string;
  deliveryNumber: string;
  deliveryCity: string;
  deliveryTime: string;
  deliveryNotes: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  notes: string;
  specialRequirements: string;
}

export const INITIAL: WizardState = {
  clientId: '',
  clientName: '',
  eventName: '',
  eventDate: '',
  guestsCount: '0',
  templateId: '',
  packageId: '',
  items: [],
  extras: [],
  deliveryType: 'ON_SITE',
  deliveryStreet: '',
  deliveryNumber: '',
  deliveryCity: '',
  deliveryTime: '',
  deliveryNotes: '',
  contactName: '',
  contactPhone: '',
  contactEmail: '',
  notes: '',
  specialRequirements: '',
};

export type SetState = (partial: Partial<WizardState>) => void;
