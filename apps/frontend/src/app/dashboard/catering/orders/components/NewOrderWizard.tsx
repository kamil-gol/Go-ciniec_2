// apps/frontend/src/app/dashboard/catering/orders/components/NewOrderWizard.tsx
'use client';

import { useState } from 'react';
import { useCreateCateringOrder } from '@/hooks/use-catering-orders';
import { useCateringTemplates } from '@/hooks/use-catering';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, ChevronRight, ChevronLeft, Check, Plus, Trash2 } from 'lucide-react';
import type {
  CateringDeliveryType,
  CreateOrderItemInput,
  CreateOrderExtraInput,
} from '@/types/catering-order.types';
import { DELIVERY_TYPE_LABEL } from '@/types/catering-order.types';
import { PackageCards } from './PackageCards';

// ─── Typy stanu formularza ────────────────────────────────

interface WizardState {
  // Krok 1 — klient
  clientId: string;
  clientName: string;
  // Krok 2 — wydarzenie
  eventName: string;
  eventDate: string;
  eventTime: string;
  eventLocation: string;
  guestsCount: string;
  // Krok 3 — szablon / pakiet
  templateId: string;
  packageId: string;
  // Krok 4 — dania
  items: CreateOrderItemInput[];
  extras: CreateOrderExtraInput[];
  // Krok 5 — logistyka
  deliveryType: CateringDeliveryType;
  deliveryAddress: string;
  deliveryDate: string;
  deliveryTime: string;
  deliveryNotes: string;
  // Krok 6 — kontakt + uwagi
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

const STEPS = [
  'Klient',
  'Wydarzenie',
  'Szablon / Pakiet',
  'Dania i Extras',
  'Logistyka',
  'Podsumowanie',
];

interface Props {
  onSuccess: (id: string) => void;
}

export function NewOrderWizard({ onSuccess }: Props) {
  const [step, setStep] = useState(0);
  const [state, setState] = useState<WizardState>(INITIAL);
  const [clientSearch, setClientSearch] = useState('');
  const [clients, setClients] = useState<{ id: string; label: string }[]>([]);
  const [clientSearching, setClientSearching] = useState(false);

  const { data: templates } = useCateringTemplates(false);
  const createOrder = useCreateCateringOrder();

  const set = (partial: Partial<WizardState>) =>
    setState(prev => ({ ...prev, ...partial }));

  const searchClients = async () => {
    if (!clientSearch.trim()) return;
    setClientSearching(true);
    try {
      const { api } = await import('@/lib/api');
      const res = await api.get(`/clients?search=${encodeURIComponent(clientSearch)}&limit=10`);
      const data = res.data.data ?? [];
      setClients(
        data.map((c: {
          id: string;
          firstName: string;
          lastName: string;
          companyName?: string;
          clientType: string;
        }) => ({
          id: c.id,
          label:
            c.clientType === 'COMPANY' && c.companyName
              ? c.companyName
              : `${c.firstName} ${c.lastName}`,
        }))
      );
    } finally {
      setClientSearching(false);
    }
  };

  const selectedTemplate = templates?.find(t => t.id === state.templateId);
  const templatePackages =
    selectedTemplate && Array.isArray(selectedTemplate.packages) && selectedTemplate.packages.length > 0
      ? selectedTemplate.packages as { id: string; name: string; basePrice: number }[]
      : null;

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

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Stepper */}
      <div className="flex items-center gap-1">
        {STEPS.map((label, i) => (
          <div key={i} className="flex items-center gap-1">
            <div
              className={`flex items-center justify-center h-7 w-7 rounded-full text-xs font-bold transition-colors ${
                i < step
                  ? 'bg-primary text-primary-foreground'
                  : i === step
                  ? 'bg-primary text-primary-foreground ring-2 ring-primary/30'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {i < step ? <Check className="h-3.5 w-3.5" /> : i + 1}
            </div>
            {i < STEPS.length - 1 && (
              <div className={`h-0.5 w-8 ${
                i < step ? 'bg-primary' : 'bg-muted'
              }`} />
            )}
          </div>
        ))}
        <span className="ml-3 text-sm font-medium">{STEPS[step]}</span>
      </div>

      <Card>
        <CardContent className="pt-6">
          {/* KROK 0 — Klient */}
          {step === 0 && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Szukaj klienta (imię, nazwisko, firma)..."
                  value={clientSearch}
                  onChange={e => setClientSearch(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && searchClients()}
                />
                <Button variant="outline" onClick={searchClients} disabled={clientSearching}>
                  {clientSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Szukaj'}
                </Button>
              </div>
              {clients.length > 0 && (
                <div className="border rounded-md divide-y">
                  {clients.map(c => (
                    <button
                      key={c.id}
                      className={`w-full text-left px-4 py-2.5 text-sm hover:bg-muted transition-colors ${
                        state.clientId === c.id ? 'bg-primary/10 font-medium' : ''
                      }`}
                      onClick={() => set({ clientId: c.id, clientName: c.label })}
                    >
                      {c.label}
                      {state.clientId === c.id && (
                        <Check className="inline ml-2 h-3.5 w-3.5 text-primary" />
                      )}
                    </button>
                  ))}
                </div>
              )}
              {state.clientName && (
                <p className="text-sm text-green-600 font-medium">Wybrany: {state.clientName}</p>
              )}
            </div>
          )}

          {/* KROK 1 — Wydarzenie */}
          {step === 1 && (
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1.5">
                <Label>Nazwa wydarzenia</Label>
                <Input value={state.eventName} onChange={e => set({ eventName: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Data</Label>
                <Input type="date" value={state.eventDate} onChange={e => set({ eventDate: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Godzina</Label>
                <Input type="time" value={state.eventTime} onChange={e => set({ eventTime: e.target.value })} />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>Miejsce</Label>
                <Input value={state.eventLocation} onChange={e => set({ eventLocation: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Liczba gości</Label>
                <Input type="number" min={0} value={state.guestsCount} onChange={e => set({ guestsCount: e.target.value })} />
              </div>
            </div>
          )}

          {/* KROK 2 — Szablon / Pakiet */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="space-y-1.5">
                <Label>Szablon cateringu (opcjonalnie)</Label>
                <Select
                  value={state.templateId || 'NONE'}
                  onValueChange={v => set({ templateId: v === 'NONE' ? '' : v, packageId: '' })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Wybierz szablon" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NONE">— Bez szablonu —</SelectItem>
                    {templates?.map(t => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {templatePackages && (
                <div className="space-y-2">
                  <Label>Pakiet (opcjonalnie)</Label>
                  <PackageCards
                    packages={templatePackages}
                    selectedId={state.packageId}
                    onSelect={id => set({ packageId: id })}
                  />
                </div>
              )}

              {!templatePackages && state.templateId && (
                <p className="text-sm text-muted-foreground">
                  Wybrany szablon nie ma zdefiniowanych pakietów.
                </p>
              )}

              {!state.templateId && (
                <p className="text-sm text-muted-foreground">
                  Wybierz szablon, aby zobaczyć dostępne pakiety.
                </p>
              )}
            </div>
          )}

          {/* KROK 3 — Dania i Extras */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-base">Dania</Label>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      set({ items: [...state.items, { dishId: '', quantity: 1, unitPrice: 0 }] })
                    }
                  >
                    <Plus className="mr-1 h-3 w-3" /> Dodaj danie
                  </Button>
                </div>
                {state.items.map((item, i) => (
                  <div key={i} className="flex gap-2 items-start">
                    <Input
                      placeholder="UUID dania"
                      value={item.dishId}
                      onChange={e => {
                        const items = [...state.items];
                        items[i] = { ...items[i], dishId: e.target.value };
                        set({ items });
                      }}
                      className="flex-1"
                    />
                    <Input
                      type="number"
                      min={1}
                      placeholder="Ilość"
                      value={item.quantity}
                      onChange={e => {
                        const items = [...state.items];
                        items[i] = { ...items[i], quantity: parseInt(e.target.value, 10) || 1 };
                        set({ items });
                      }}
                      className="w-20"
                    />
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      placeholder="Cena"
                      value={item.unitPrice}
                      onChange={e => {
                        const items = [...state.items];
                        items[i] = { ...items[i], unitPrice: parseFloat(e.target.value) || 0 };
                        set({ items });
                      }}
                      className="w-28"
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => set({ items: state.items.filter((_, j) => j !== i) })}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
                {state.items.length === 0 && (
                  <p className="text-sm text-muted-foreground">Brak dań — możesz dodać je później</p>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-base">Usługi dodatkowe</Label>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      set({ extras: [...state.extras, { name: '', quantity: 1, unitPrice: 0 }] })
                    }
                  >
                    <Plus className="mr-1 h-3 w-3" /> Dodaj
                  </Button>
                </div>
                {state.extras.map((extra, i) => (
                  <div key={i} className="flex gap-2 items-start">
                    <Input
                      placeholder="Nazwa usługi"
                      value={extra.name}
                      onChange={e => {
                        const extras = [...state.extras];
                        extras[i] = { ...extras[i], name: e.target.value };
                        set({ extras });
                      }}
                      className="flex-1"
                    />
                    <Input
                      type="number"
                      min={1}
                      placeholder="Ilość"
                      value={extra.quantity}
                      onChange={e => {
                        const extras = [...state.extras];
                        extras[i] = { ...extras[i], quantity: parseInt(e.target.value, 10) || 1 };
                        set({ extras });
                      }}
                      className="w-20"
                    />
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      placeholder="Cena"
                      value={extra.unitPrice}
                      onChange={e => {
                        const extras = [...state.extras];
                        extras[i] = { ...extras[i], unitPrice: parseFloat(e.target.value) || 0 };
                        set({ extras });
                      }}
                      className="w-28"
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => set({ extras: state.extras.filter((_, j) => j !== i) })}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* KROK 4 — Logistyka */}
          {step === 4 && (
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1.5">
                <Label>Typ dostawy</Label>
                <Select
                  value={state.deliveryType}
                  onValueChange={v => set({ deliveryType: v as CateringDeliveryType })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.entries(DELIVERY_TYPE_LABEL) as [CateringDeliveryType, string][]).map(([v, l]) => (
                      <SelectItem key={v} value={v}>{l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {state.deliveryType === 'DELIVERY' && (
                <>
                  <div className="col-span-2 space-y-1.5">
                    <Label>Adres dostawy</Label>
                    <Textarea
                      value={state.deliveryAddress}
                      onChange={e => set({ deliveryAddress: e.target.value })}
                      rows={2}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Data dostawy</Label>
                    <Input type="date" value={state.deliveryDate} onChange={e => set({ deliveryDate: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Godzina dostawy</Label>
                    <Input type="time" value={state.deliveryTime} onChange={e => set({ deliveryTime: e.target.value })} />
                  </div>
                </>
              )}
              <div className="col-span-2 space-y-1.5">
                <Label>Uwagi do logistyki</Label>
                <Textarea
                  value={state.deliveryNotes}
                  onChange={e => set({ deliveryNotes: e.target.value })}
                  rows={2}
                />
              </div>
            </div>
          )}

          {/* KROK 5 — Podsumowanie */}
          {step === 5 && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-1.5">
                  <Label>Osoba kontaktowa</Label>
                  <Input
                    placeholder="Imię i nazwisko"
                    value={state.contactName}
                    onChange={e => set({ contactName: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Telefon kontaktowy</Label>
                  <Input
                    placeholder="+48..."
                    value={state.contactPhone}
                    onChange={e => set({ contactPhone: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>E-mail kontaktowy</Label>
                  <Input
                    type="email"
                    value={state.contactEmail}
                    onChange={e => set({ contactEmail: e.target.value })}
                  />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label>Uwagi</Label>
                  <Textarea
                    rows={3}
                    value={state.notes}
                    onChange={e => set({ notes: e.target.value })}
                  />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label>Specjalne wymagania</Label>
                  <Textarea
                    rows={2}
                    value={state.specialRequirements}
                    onChange={e => set({ specialRequirements: e.target.value })}
                  />
                </div>
              </div>
              <div className="border rounded-md p-4 space-y-2 bg-muted/30">
                <p className="font-semibold">Podsumowanie</p>
                <p><span className="text-muted-foreground">Klient:</span> {state.clientName || '—'}</p>
                <p><span className="text-muted-foreground">Wydarzenie:</span> {state.eventName || '—'} {state.eventDate && `(${state.eventDate})`}</p>
                <p><span className="text-muted-foreground">Goście:</span> {state.guestsCount}</p>
                <p><span className="text-muted-foreground">Typ dostawy:</span> {DELIVERY_TYPE_LABEL[state.deliveryType]}</p>
                <p><span className="text-muted-foreground">Dania:</span> {state.items.length} pozycji</p>
                <p><span className="text-muted-foreground">Extras:</span> {state.extras.length} pozycji</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => setStep(s => s - 1)}
          disabled={step === 0}
        >
          <ChevronLeft className="mr-1 h-4 w-4" /> Wstecz
        </Button>

        {step < STEPS.length - 1 ? (
          <Button
            onClick={() => setStep(s => s + 1)}
            disabled={step === 0 && !state.clientId}
          >
            Dalej <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={createOrder.isPending || !state.clientId}
          >
            {createOrder.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Utwórz zamówienie
          </Button>
        )}
      </div>
    </div>
  );
}
