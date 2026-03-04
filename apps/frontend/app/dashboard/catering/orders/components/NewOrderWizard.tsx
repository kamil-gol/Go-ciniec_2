'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQueryClient } from '@tanstack/react-query';
import { useCreateCateringOrder } from '@/hooks/use-catering-orders';
import { useCateringTemplates } from '@/hooks/use-catering';
import { useClients } from '@/hooks/use-clients';
import { Combobox } from '@/components/ui/combobox';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Stepper, StepNavigation } from '@/components/ui/stepper';
import type { StepConfig } from '@/components/ui/stepper';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  User,
  CalendarDays,
  BookOpen,
  Package,
  Truck,
  ClipboardCheck,
  Plus,
  Trash2,
  Building2,
  UserPlus,
  Clock,
  MapPin,
  ShoppingBag,
} from 'lucide-react';
import { CreateClientModal } from '@/components/clients/create-client-modal';
import type {
  CateringDeliveryType,
  CreateOrderItemInput,
  CreateOrderExtraInput,
} from '@/types/catering-order.types';
import { DELIVERY_TYPE_LABEL } from '@/types/catering-order.types';

// ═══ STEP CONFIGURATION ═══

const STEPS: StepConfig[] = [
  { id: 'client',    title: 'Klient',           icon: User },
  { id: 'event',     title: 'Szczegóły',         icon: CalendarDays },
  { id: 'template',  title: 'Szablon / Pakiet',  icon: BookOpen },
  { id: 'items',     title: 'Dania i Extras',    icon: Package },
  { id: 'logistics', title: 'Logistyka',         icon: Truck },
  { id: 'summary',   title: 'Podsumowanie',      icon: ClipboardCheck },
];

const STEP_META = [
  {
    gradient: 'from-indigo-500 to-violet-500',
    title: 'Wybierz klienta',
    subtitle: 'Wyszukaj istniejącego klienta lub dodaj nowego',
  },
  {
    gradient: 'from-orange-500 to-amber-500',
    title: 'Szczegóły zamówienia',
    subtitle: 'Podaj okazję, datę, miejsce i liczbę gości',
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

const stepVariants = {
  enter: { opacity: 0, x: 30 },
  center: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -30 },
};

// ═══ STATE ═══

interface WizardState {
  clientId: string;
  clientName: string;
  eventName: string;
  eventDate: string;
  eventTime: string;
  eventLocation: string;
  guestsCount: string;
  templateId: string;
  packageId: string;
  items: CreateOrderItemInput[];
  extras: CreateOrderExtraInput[];
  deliveryType: CateringDeliveryType;
  deliveryAddress: string;
  deliveryDate: string;
  deliveryTime: string;
  deliveryNotes: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  notes: string;
  specialRequirements: string;
}

const INITIAL: WizardState = {
  clientId: '',
  clientName: '',
  eventName: '',
  eventDate: '',
  eventTime: '',
  eventLocation: '',
  guestsCount: '0',
  templateId: '',
  packageId: '',
  items: [],
  extras: [],
  deliveryType: 'ON_SITE',
  deliveryAddress: '',
  deliveryDate: '',
  deliveryTime: '',
  deliveryNotes: '',
  contactName: '',
  contactPhone: '',
  contactEmail: '',
  notes: '',
  specialRequirements: '',
};

interface Props {
  onSuccess: (id: string) => void;
}

// ═══ COMPONENT ═══

export function NewOrderWizard({ onSuccess }: Props) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [state, setState] = useState<WizardState>(INITIAL);
  const [showCreateClientModal, setShowCreateClientModal] = useState(false);

  const { data: clientsData, isLoading: clientsLoading } = useClients();
  const { data: templates } = useCateringTemplates(false);
  const createOrder = useCreateCateringOrder();

  const set = useCallback((partial: Partial<WizardState>) =>
    setState(prev => ({ ...prev, ...partial })), []);

  // ─── Clients ───

  const clientsArray = useMemo(
    () => (Array.isArray(clientsData) ? clientsData : []),
    [clientsData]
  );

  const clientComboboxOptions = useMemo(() =>
    clientsArray.map((client: any) => {
      const isCompany = client.clientType === 'COMPANY';
      const companyName = client.companyName;
      const nip = client.nip;
      if (isCompany && companyName) {
        return {
          value: client.id,
          label: `🏢 ${companyName} · ${client.firstName} ${client.lastName}`,
          description: nip ? `NIP: ${nip}` : client.email || undefined,
          secondaryLabel: client.phone || undefined,
        };
      }
      return {
        value: client.id,
        label: `${client.firstName} ${client.lastName}`,
        description: client.email || undefined,
        secondaryLabel: client.phone || undefined,
      };
    }),
    [clientsArray]
  );

  const selectedClient = useMemo(
    () => clientsArray.find((c: any) => c.id === state.clientId) as any | undefined,
    [clientsArray, state.clientId]
  );

  // ─── Auto-fill contact from selected client ───

  useEffect(() => {
    if (!selectedClient) return;
    const isCompany = selectedClient.clientType === 'COMPANY';
    if (isCompany) {
      const primaryContact = (selectedClient.contacts as any[])?.find((c: any) => c.isPrimary);
      const contact = primaryContact ?? (selectedClient.contacts as any[])?.[0];
      set({
        contactName: contact
          ? `${contact.firstName} ${contact.lastName}`
          : `${selectedClient.firstName} ${selectedClient.lastName}`,
        contactPhone: contact?.phone ?? selectedClient.phone ?? '',
        contactEmail: contact?.email ?? selectedClient.email ?? '',
      });
    } else {
      set({
        contactName: `${selectedClient.firstName} ${selectedClient.lastName}`,
        contactPhone: selectedClient.phone ?? '',
        contactEmail: selectedClient.email ?? '',
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.clientId]);

  const handleClientCreated = useCallback(async (newClient: any) => {
    await queryClient.invalidateQueries({ queryKey: ['clients'] });
    set({
      clientId: newClient.id,
      clientName:
        newClient.clientType === 'COMPANY' && newClient.companyName
          ? newClient.companyName
          : `${newClient.firstName} ${newClient.lastName}`,
    });
    setShowCreateClientModal(false);
  }, [queryClient, set]);

  // ─── Templates / Packages ───

  const selectedTemplate = templates?.find((t: any) => t.id === state.templateId);
  const templatePackages =
    selectedTemplate &&
    Array.isArray(selectedTemplate.packages) &&
    selectedTemplate.packages.length > 0
      ? (selectedTemplate.packages as { id: string; name: string; basePrice: number }[])
      : null;

  // ─── Navigation ───

  const goToNextStep = useCallback(() => {
    setCompletedSteps(prev => new Set([...prev, step]));
    setStep(s => Math.min(s + 1, STEPS.length - 1));
  }, [step]);

  const goToPrevStep = useCallback(() => {
    setStep(s => Math.max(s - 1, 0));
  }, []);

  const goToStep = useCallback((index: number) => {
    if (index <= step || completedSteps.has(index - 1)) {
      setStep(index);
    }
  }, [step, completedSteps]);

  const isNextDisabled = step === 0 && !state.clientId;

  // ─── Submit ───

  const handleSubmit = async () => {
    const order = await createOrder.mutateAsync({
      clientId: state.clientId,
      templateId: state.templateId || null,
      packageId: state.packageId || null,
      deliveryType: state.deliveryType,
      eventName: state.eventName || null,
      eventDate: state.eventDate || null,
      eventTime: state.eventTime || null,
      eventLocation: state.eventLocation || null,
      guestsCount: parseInt(state.guestsCount, 10) || 0,
      deliveryAddress: state.deliveryAddress || null,
      deliveryDate: state.deliveryDate || null,
      deliveryTime: state.deliveryTime || null,
      deliveryNotes: state.deliveryNotes || null,
      contactName: state.contactName || null,
      contactPhone: state.contactPhone || null,
      contactEmail: state.contactEmail || null,
      notes: state.notes || null,
      specialRequirements: state.specialRequirements || null,
      items: state.items.length > 0 ? state.items : undefined,
      extras: state.extras.length > 0 ? state.extras : undefined,
    });
    onSuccess(order.id);
  };

  // ═════════════════════════════════════════════
  // STEP RENDERERS
  // ═════════════════════════════════════════════

  const renderStepHeader = (idx: number) => {
    const meta = STEP_META[idx];
    const StepIcon = STEPS[idx].icon;
    return (
      <div className="text-center mb-6">
        <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br ${meta.gradient} text-white mb-3`}>
          <StepIcon className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">{meta.title}</h2>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">{meta.subtitle}</p>
      </div>
    );
  };

  // ─── Step 0: Klient ───

  const renderStep0 = () => {
    const isCompany = selectedClient?.clientType === 'COMPANY';
    const companyName = selectedClient?.companyName;
    const nip = selectedClient?.nip;
    const primaryContact = (selectedClient?.contacts as any[])?.find((c: any) => c.isPrimary);

    return (
      <div className="space-y-6">
        {renderStepHeader(0)}
        <div className="space-y-3">
          <Combobox
            options={clientComboboxOptions}
            value={state.clientId}
            onChange={(val) => set({ clientId: val })}
            label="Klient"
            placeholder="Wyszukaj po nazwisku, firmie lub NIP..."
            searchPlaceholder="Wpisz imię, nazwisko, firmę lub NIP..."
            emptyMessage="Nie znaleziono klienta."
            disabled={clientsLoading}
          />
          <button
            type="button"
            onClick={() => setShowCreateClientModal(true)}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border-2 border-dashed border-primary-300 dark:border-primary-700 text-primary-600 dark:text-primary-400 font-medium text-sm hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:border-primary-400 dark:hover:border-primary-600 transition-colors"
          >
            <UserPlus className="h-4 w-4" />
            Dodaj nowego klienta
          </button>
        </div>

        {selectedClient && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl"
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                isCompany ? 'bg-purple-200 dark:bg-purple-800' : 'bg-green-200 dark:bg-green-800'
              }`}>
                {isCompany
                  ? <Building2 className="w-5 h-5 text-purple-700 dark:text-purple-300" />
                  : <User className="w-5 h-5 text-green-700 dark:text-green-300" />}
              </div>
              <div className="flex-1 min-w-0">
                {isCompany && companyName ? (
                  <>
                    <p className="font-semibold text-green-900 dark:text-green-100">{companyName}</p>
                    {nip && <p className="text-xs text-green-700 dark:text-green-300">NIP: {nip}</p>}
                    <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-300 mt-1">
                      <User className="w-3.5 h-3.5 shrink-0" />
                      <span>{selectedClient.firstName} {selectedClient.lastName}</span>
                      {primaryContact && primaryContact.firstName !== selectedClient.firstName && (
                        <span className="text-xs">
                          · {primaryContact.firstName} {primaryContact.lastName}
                          {primaryContact.role ? ` (${primaryContact.role})` : ''}
                        </span>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <p className="font-semibold text-green-900 dark:text-green-100">
                      {selectedClient.firstName} {selectedClient.lastName}
                    </p>
                    <div className="flex items-center gap-3 text-sm text-green-700 dark:text-green-300">
                      {selectedClient.phone && <span>{selectedClient.phone}</span>}
                      {selectedClient.email && <span>{selectedClient.email}</span>}
                    </div>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    );
  };

  // ─── Step 1: Szczegóły ───

  const renderStep1 = () => (
    <div className="space-y-6">
      {renderStepHeader(1)}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2 space-y-1.5">
          <Label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Okazja / cel zamówienia</Label>
          <Input
            placeholder="np. Komunia, impreza firmowa, urodziny..."
            value={state.eventName}
            onChange={e => set({ eventName: e.target.value })}
            className="h-11"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Data</Label>
          <Input type="date" value={state.eventDate} onChange={e => set({ eventDate: e.target.value })} className="h-11" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Godzina</Label>
          <Input type="time" value={state.eventTime} onChange={e => set({ eventTime: e.target.value })} className="h-11" />
        </div>
        <div className="md:col-span-2 space-y-1.5">
          <Label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Miejsce</Label>
          <Input
            placeholder="Adres lub nazwa miejsca..."
            value={state.eventLocation}
            onChange={e => set({ eventLocation: e.target.value })}
            className="h-11"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Liczba gości</Label>
          <Input type="number" min={0} value={state.guestsCount} onChange={e => set({ guestsCount: e.target.value })} className="h-11" />
        </div>
      </div>
    </div>
  );

  // ─── Step 2: Szablon / Pakiet ───

  const renderStep2 = () => (
    <div className="space-y-6">
      {renderStepHeader(2)}
      <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-xl space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-500 flex items-center justify-center text-white text-xs font-bold">1</div>
          <Label className="font-semibold text-neutral-800 dark:text-neutral-200">Szablon cateringu</Label>
          <span className="text-xs text-neutral-500 dark:text-neutral-400">(opcjonalnie)</span>
        </div>
        <Select
          value={state.templateId || 'NONE'}
          onValueChange={v => set({ templateId: v === 'NONE' ? '' : v, packageId: '' })}
        >
          <SelectTrigger className="h-11 bg-white dark:bg-neutral-900"><SelectValue placeholder="Wybierz szablon" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="NONE">— Bez szablonu —</SelectItem>
            {templates?.map((t: any) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      {templatePackages && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl space-y-3"
        >
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500 flex items-center justify-center text-white text-xs font-bold">2</div>
            <Label className="font-semibold text-neutral-800 dark:text-neutral-200">Pakiet cenowy</Label>
            <span className="text-xs text-neutral-500 dark:text-neutral-400">(opcjonalnie)</span>
          </div>
          <Select value={state.packageId || 'NONE'} onValueChange={v => set({ packageId: v === 'NONE' ? '' : v })}>
            <SelectTrigger className="h-11 bg-white dark:bg-neutral-900"><SelectValue placeholder="Wybierz pakiet" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="NONE">— Bez pakietu —</SelectItem>
              {templatePackages.map(p => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name} — {new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(p.basePrice)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </motion.div>
      )}
      {!state.templateId && (
        <p className="text-sm text-neutral-500 dark:text-neutral-400 text-center py-2">
          Możesz pominąć ten krok — szablon i pakiet nie są wymagane.
        </p>
      )}
    </div>
  );

  // ─── Step 3: Dania i Extras ───

  const renderStep3 = () => (
    <div className="space-y-6">
      {renderStepHeader(3)}
      <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl space-y-3">
        <div className="flex items-center justify-between">
          <Label className="font-semibold text-neutral-800 dark:text-neutral-200">Dania</Label>
          <button type="button" onClick={() => set({ items: [...state.items, { dishId: '', quantity: 1, unitPrice: 0 }] })}
            className="flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <Plus className="h-3 w-3" /> Dodaj danie
          </button>
        </div>
        {state.items.map((item, i) => (
          <div key={i} className="flex gap-2 items-start">
            <Input placeholder="UUID dania" value={item.dishId} onChange={e => { const items = [...state.items]; items[i] = { ...items[i], dishId: e.target.value }; set({ items }); }} className="flex-1 h-9" />
            <Input type="number" min={1} placeholder="Ilość" value={item.quantity} onChange={e => { const items = [...state.items]; items[i] = { ...items[i], quantity: parseInt(e.target.value, 10) || 1 }; set({ items }); }} className="w-20 h-9" />
            <Input type="number" min={0} step="0.01" placeholder="Cena" value={item.unitPrice} onChange={e => { const items = [...state.items]; items[i] = { ...items[i], unitPrice: parseFloat(e.target.value) || 0 }; set({ items }); }} className="w-28 h-9" />
            <button type="button" className="h-9 w-9 flex items-center justify-center rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" onClick={() => set({ items: state.items.filter((_, j) => j !== i) })}>
              <Trash2 className="h-4 w-4 text-red-500" />
            </button>
          </div>
        ))}
        {state.items.length === 0 && <p className="text-sm text-neutral-500 dark:text-neutral-400">Brak dań — możesz dodać je później</p>}
      </div>
      <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl space-y-3">
        <div className="flex items-center justify-between">
          <Label className="font-semibold text-neutral-800 dark:text-neutral-200">Usługi dodatkowe</Label>
          <button type="button" onClick={() => set({ extras: [...state.extras, { name: '', quantity: 1, unitPrice: 0 }] })}
            className="flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <Plus className="h-3 w-3" /> Dodaj
          </button>
        </div>
        {state.extras.map((extra, i) => (
          <div key={i} className="flex gap-2 items-start">
            <Input placeholder="Nazwa usługi" value={extra.name} onChange={e => { const extras = [...state.extras]; extras[i] = { ...extras[i], name: e.target.value }; set({ extras }); }} className="flex-1 h-9" />
            <Input type="number" min={1} placeholder="Ilość" value={extra.quantity} onChange={e => { const extras = [...state.extras]; extras[i] = { ...extras[i], quantity: parseInt(e.target.value, 10) || 1 }; set({ extras }); }} className="w-20 h-9" />
            <Input type="number" min={0} step="0.01" placeholder="Cena" value={extra.unitPrice} onChange={e => { const extras = [...state.extras]; extras[i] = { ...extras[i], unitPrice: parseFloat(e.target.value) || 0 }; set({ extras }); }} className="w-28 h-9" />
            <button type="button" className="h-9 w-9 flex items-center justify-center rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" onClick={() => set({ extras: state.extras.filter((_, j) => j !== i) })}>
              <Trash2 className="h-4 w-4 text-red-500" />
            </button>
          </div>
        ))}
        {state.extras.length === 0 && <p className="text-sm text-neutral-500 dark:text-neutral-400">Brak usług dodatkowych</p>}
      </div>
    </div>
  );

  // ─── Step 4: Logistyka ───

  const renderStep4 = () => (
    <div className="space-y-6">
      {renderStepHeader(4)}

      {/* Typ dostawy — selector */}
      <div className="space-y-1.5">
        <Label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Typ realizacji</Label>
        <Select
          value={state.deliveryType}
          onValueChange={v => set({ deliveryType: v as CateringDeliveryType, deliveryAddress: '', deliveryTime: '', deliveryDate: '' })}
        >
          <SelectTrigger className="h-11">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.entries(DELIVERY_TYPE_LABEL) as [CateringDeliveryType, string][]).map(([v, l]) => (
              <SelectItem key={v} value={v}>{l}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* PICKUP — Odbiór osobisty: tylko godzina */}
      {state.deliveryType === 'PICKUP' && (
        <motion.div
          key="pickup"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className="p-5 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl space-y-4"
        >
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-semibold text-blue-800 dark:text-blue-200">Odbiór osobisty</span>
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" /> Godzina odbioru
            </Label>
            <Input
              type="time"
              value={state.deliveryTime}
              onChange={e => set({ deliveryTime: e.target.value })}
              className="h-11 max-w-[160px]"
            />
          </div>
        </motion.div>
      )}

      {/* ON_SITE — U klienta: godzina + adres */}
      {state.deliveryType === 'ON_SITE' && (
        <motion.div
          key="on-site"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className="p-5 bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800 rounded-xl space-y-4"
        >
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-violet-600 dark:text-violet-400" />
            <span className="text-sm font-semibold text-violet-800 dark:text-violet-200">U klienta</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" /> Godzina
              </Label>
              <Input
                type="time"
                value={state.deliveryTime}
                onChange={e => set({ deliveryTime: e.target.value })}
                className="h-11"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" /> Adres klienta
            </Label>
            <Textarea
              value={state.deliveryAddress}
              onChange={e => set({ deliveryAddress: e.target.value })}
              rows={2}
              placeholder="Ulica, numer, miasto..."
            />
          </div>
        </motion.div>
      )}

      {/* DELIVERY — Dostawa: adres + data + godzina */}
      {state.deliveryType === 'DELIVERY' && (
        <motion.div
          key="delivery"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className="p-5 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-xl space-y-4"
        >
          <div className="flex items-center gap-2">
            <Truck className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            <span className="text-sm font-semibold text-rose-800 dark:text-rose-200">Dostawa</span>
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" /> Adres dostawy
            </Label>
            <Textarea
              value={state.deliveryAddress}
              onChange={e => set({ deliveryAddress: e.target.value })}
              rows={2}
              placeholder="Ulica, nr, miasto..."
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Data dostawy</Label>
              <Input type="date" value={state.deliveryDate} onChange={e => set({ deliveryDate: e.target.value })} className="h-11" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" /> Godzina dostawy
              </Label>
              <Input type="time" value={state.deliveryTime} onChange={e => set({ deliveryTime: e.target.value })} className="h-11" />
            </div>
          </div>
        </motion.div>
      )}

      {/* Uwagi — zawsze widoczne */}
      <div className="space-y-1.5">
        <Label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Uwagi do logistyki</Label>
        <Textarea
          value={state.deliveryNotes}
          onChange={e => set({ deliveryNotes: e.target.value })}
          rows={2}
          placeholder="Dodatkowe instrukcje, dostęp do obiektu..."
        />
      </div>
    </div>
  );

  // ─── Step 5: Podsumowanie ───

  const renderStep5 = () => (
    <div className="space-y-6">
      {renderStepHeader(5)}

      <div className="p-4 bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800 rounded-xl space-y-4">
        <div>
          <Label className="font-semibold text-neutral-800 dark:text-neutral-200">Dane kontaktowe</Label>
          <p className="text-xs text-teal-700 dark:text-teal-300 mt-0.5">
            Wypełnione automatycznie z profilu klienta — możesz zmienić.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2 space-y-1.5">
            <Label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Osoba kontaktowa</Label>
            <Input placeholder="Imię i nazwisko" value={state.contactName} onChange={e => set({ contactName: e.target.value })} className="h-11" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Telefon kontaktowy</Label>
            <Input placeholder="+48..." value={state.contactPhone} onChange={e => set({ contactPhone: e.target.value })} className="h-11" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">E-mail kontaktowy</Label>
            <Input type="email" value={state.contactEmail} onChange={e => set({ contactEmail: e.target.value })} className="h-11" />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Uwagi</Label>
          <Textarea rows={3} value={state.notes} onChange={e => set({ notes: e.target.value })} placeholder="Dodatkowe informacje..." />
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Specjalne wymagania</Label>
          <Textarea rows={2} value={state.specialRequirements} onChange={e => set({ specialRequirements: e.target.value })} placeholder="np. alergie, dieta bezglutenowa..." />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl border bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800 cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-600 transition-colors" onClick={() => goToStep(0)}>
          <div className="flex items-center gap-2 mb-2">
            {selectedClient?.clientType === 'COMPANY' ? <Building2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> : <User className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />}
            <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400 uppercase">Klient</span>
            {selectedClient?.clientType === 'COMPANY' && (
              <span className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-1.5 py-0.5 rounded font-medium">Firma</span>
            )}
          </div>
          {selectedClient ? (
            <div>
              {selectedClient.clientType === 'COMPANY' && selectedClient.companyName ? (
                <>
                  <p className="font-semibold text-neutral-900 dark:text-neutral-100">{selectedClient.companyName}</p>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">{selectedClient.firstName} {selectedClient.lastName}{selectedClient.nip ? ` · NIP: ${selectedClient.nip}` : ''}</p>
                </>
              ) : (
                <>
                  <p className="font-semibold text-neutral-900 dark:text-neutral-100">{selectedClient.firstName} {selectedClient.lastName}</p>
                  <div className="flex items-center gap-3 text-sm text-neutral-600 dark:text-neutral-400">
                    {selectedClient.phone && <span>{selectedClient.phone}</span>}
                    {selectedClient.email && <span>{selectedClient.email}</span>}
                  </div>
                </>
              )}
            </div>
          ) : <p className="text-neutral-500 dark:text-neutral-400">—</p>}
        </div>

        <div className="p-4 rounded-xl border bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800 cursor-pointer hover:border-orange-400 dark:hover:border-orange-600 transition-colors" onClick={() => goToStep(1)}>
          <div className="flex items-center gap-2 mb-2">
            <CalendarDays className="w-4 h-4 text-orange-600 dark:text-orange-400" />
            <span className="text-xs font-medium text-orange-600 dark:text-orange-400 uppercase">Szczegóły</span>
          </div>
          <p className="font-semibold text-neutral-900 dark:text-neutral-100">{state.eventName || '—'}</p>
          {state.eventDate && (
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              {new Date(state.eventDate).toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' })}
              {state.eventTime && ` · ${state.eventTime}`}
            </p>
          )}
          {state.guestsCount && parseInt(state.guestsCount) > 0 && (
            <p className="text-sm text-neutral-600 dark:text-neutral-400">{state.guestsCount} gości</p>
          )}
        </div>

        <div className="p-4 rounded-xl border bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 cursor-pointer hover:border-green-400 dark:hover:border-green-600 transition-colors" onClick={() => goToStep(3)}>
          <div className="flex items-center gap-2 mb-2">
            <Package className="w-4 h-4 text-green-600 dark:text-green-400" />
            <span className="text-xs font-medium text-green-600 dark:text-green-400 uppercase">Menu</span>
          </div>
          <p className="font-semibold text-neutral-900 dark:text-neutral-100">
            {state.items.length} {state.items.length === 1 ? 'danie' : state.items.length < 5 ? 'dania' : 'dań'}
          </p>
          {state.extras.length > 0 && (
            <p className="text-sm text-neutral-600 dark:text-neutral-400">{state.extras.length} usług dodatkowych</p>
          )}
        </div>

        <div className="p-4 rounded-xl border bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800 cursor-pointer hover:border-rose-400 dark:hover:border-rose-600 transition-colors" onClick={() => goToStep(4)}>
          <div className="flex items-center gap-2 mb-2">
            <Truck className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            <span className="text-xs font-medium text-rose-600 dark:text-rose-400 uppercase">Logistyka</span>
          </div>
          <p className="font-semibold text-neutral-900 dark:text-neutral-100">{DELIVERY_TYPE_LABEL[state.deliveryType]}</p>
          {(state.deliveryType === 'DELIVERY' || state.deliveryType === 'ON_SITE') && state.deliveryAddress && (
            <p className="text-sm text-neutral-600 dark:text-neutral-400 truncate">{state.deliveryAddress}</p>
          )}
          {state.deliveryTime && (
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              {state.deliveryType === 'PICKUP' ? 'Odbiór:' : 'Godzina:'} {state.deliveryTime}
              {state.deliveryType === 'DELIVERY' && state.deliveryDate && ` · ${new Date(state.deliveryDate).toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' })}`}
            </p>
          )}
        </div>
      </div>
    </div>
  );

  const stepRenderers = [
    renderStep0,
    renderStep1,
    renderStep2,
    renderStep3,
    renderStep4,
    renderStep5,
  ];

  // ═══ RENDER ═══

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-primary-50 to-blue-50 dark:from-primary-900/20 dark:to-blue-900/20 border-b border-neutral-200 dark:border-neutral-700">
            <CardTitle className="text-xl">Nowe zamówienie cateringowe</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <Stepper
              steps={STEPS}
              currentStep={step}
              completedSteps={completedSteps}
              onStepClick={goToStep}
              className="mb-8"
            />
            <AnimatePresence mode="wait">
              <motion.div
                key={`step-${step}`}
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.25, ease: 'easeInOut' }}
              >
                {stepRenderers[step]()}
              </motion.div>
            </AnimatePresence>
            <StepNavigation
              currentStep={step}
              totalSteps={STEPS.length}
              onNext={goToNextStep}
              onPrev={goToPrevStep}
              onSubmit={handleSubmit}
              isNextDisabled={isNextDisabled}
              isSubmitting={createOrder.isPending}
              submitLabel="Utwórz zamówienie"
              className="mt-8"
            />
          </CardContent>
        </Card>
      </motion.div>

      <CreateClientModal
        open={showCreateClientModal}
        onClose={() => setShowCreateClientModal(false)}
        onSuccess={handleClientCreated}
      />
    </>
  );
}
