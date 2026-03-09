// apps/frontend/src/app/dashboard/catering/orders/[id]/page.tsx
'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  CheckCircle2,
  Edit,
  Loader2,
  MoreVertical,
  Pencil,
  Plus,
  Tag,
  Trash2,
} from 'lucide-react';
import {
  useCateringOrder,
  useDeleteCateringOrder,
  useUpdateCateringDeposit,
  useDeleteCateringDeposit,
  useCreateCateringDeposit,
  useMarkDepositPaid,
  useUpdateCateringOrder,
} from '@/hooks/use-catering-orders';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { OrderStatusBadge } from '../components/OrderStatusBadge';
import { OrderTimeline } from '../components/OrderTimeline';
import { ChangeStatusDialog } from '../components/ChangeStatusDialog';
import {
  DELIVERY_TYPE_LABEL,
  type CateringDeposit,
  type CateringDiscountType,
} from '@/types/catering-order.types';

type PaymentMethod = 'CASH' | 'TRANSFER' | 'BLIK' | 'CARD';

const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  CASH: 'Gotówka',
  TRANSFER: 'Przelew',
  BLIK: 'BLIK',
  CARD: 'Karta',
};

function formatPrice(value: number | string) {
  return new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(
    Number(value),
  );
}

/** Wyciąga czytelny komunikat z błędu Axios lub zwykłego Error */
function extractApiErrorMessage(err: unknown): string {
  if (err && typeof err === 'object') {
    const e = err as Record<string, any>;
    const msg =
      e?.response?.data?.message ??
      e?.response?.data?.error ??
      e?.message;
    if (msg && typeof msg === 'string') return msg;
  }
  return 'Wystąpił błąd. Spróbuj ponownie.';
}

// ─── Add Deposit Dialog ───────────────────────────────────────

interface AddDepositDialogProps {
  orderId: string;
  maxAmount: number;
  open: boolean;
  onClose: () => void;
}

function AddDepositDialog({ orderId, maxAmount, open, onClose }: AddDepositDialogProps) {
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [apiError, setApiError] = useState<string | null>(null);

  const createMutation = useCreateCateringDeposit(orderId);

  const parsedAmount = parseFloat(amount);
  const amountExceedsMax = !isNaN(parsedAmount) && parsedAmount > maxAmount;
  const canSave =
    !!amount && !!dueDate && !isNaN(parsedAmount) && parsedAmount > 0 && !amountExceedsMax;

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setAmount('');
      setDueDate('');
      setTitle('');
      setDescription('');
      setApiError(null);
      onClose();
    }
  };

  // Używamy mutate (nie mutateAsync) — błędy trafiają tylko do onError,
  // dzięki temu nie ma unhandled promise rejection i Next.js dev overlay się nie pokazuje
  const handleSave = () => {
    if (!canSave) return;
    setApiError(null);
    createMutation.mutate(
      { amount: parsedAmount, dueDate, title: title || null, description: description || null },
      {
        onSuccess: () => handleOpenChange(false),
        onError: (err) => setApiError(extractApiErrorMessage(err)),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Dodaj zaliczkę</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="add-dep-title">Tytuł <span className="text-muted-foreground font-normal">(opcjonalnie)</span></Label>
            <Input
              id="add-dep-title"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="np. Zaliczka 30%, Zadatek"
            />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="add-dep-amount">Kwota (PLN) *</Label>
              <span className="text-xs text-muted-foreground">maks. {formatPrice(maxAmount)}</span>
            </div>
            <Input
              id="add-dep-amount"
              type="number"
              min={0.01}
              max={maxAmount}
              step={0.01}
              value={amount}
              onChange={e => { setAmount(e.target.value); setApiError(null); }}
              placeholder="0.00"
              className={amountExceedsMax ? 'border-destructive focus-visible:ring-destructive' : ''}
            />
            {amountExceedsMax && (
              <p className="text-xs text-destructive">
                Zaliczka nie może przekroczyć pozostałej kwoty do wpłaty ({formatPrice(maxAmount)})
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="add-dep-date">Termin płatności *</Label>
            <Input
              id="add-dep-date"
              type="date"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="add-dep-desc">Opis <span className="text-muted-foreground font-normal">(opcjonalnie)</span></Label>
            <Textarea
              id="add-dep-desc"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Dodatkowe informacje..."
              rows={2}
            />
          </div>
          {apiError && (
            <p className="text-sm text-destructive rounded-md bg-destructive/10 px-3 py-2">
              {apiError}
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>Anuluj</Button>
          <Button onClick={handleSave} disabled={createMutation.isPending || !canSave}>
            {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Dodaj zaliczkę'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Edit Deposit Dialog ──────────────────────────────────────

interface EditDepositDialogProps {
  orderId: string;
  deposit: CateringDeposit | null;
  maxAmount: number;
  open: boolean;
  onClose: () => void;
}

function EditDepositDialog({ orderId, deposit, maxAmount, open, onClose }: EditDepositDialogProps) {
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [title, setTitle] = useState('');
  const [apiError, setApiError] = useState<string | null>(null);

  const updateMutation = useUpdateCateringDeposit(orderId, deposit?.id ?? '');

  const parsedAmount = parseFloat(amount);
  const amountExceedsMax = !isNaN(parsedAmount) && parsedAmount > maxAmount;
  const canSave =
    !!amount && !!dueDate && !isNaN(parsedAmount) && parsedAmount > 0 && !amountExceedsMax;

  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen && deposit) {
      setAmount(String(deposit.amount));
      setDueDate(deposit.dueDate);
      setTitle(deposit.title ?? '');
      setApiError(null);
    }
    if (!isOpen) {
      setApiError(null);
      onClose();
    }
  };

  // mutate zamiast mutateAsync — j.w.
  const handleSave = () => {
    if (!deposit || !canSave) return;
    setApiError(null);
    updateMutation.mutate(
      { amount: parsedAmount, dueDate, title: title || null },
      {
        onSuccess: () => onClose(),
        onError: (err) => setApiError(extractApiErrorMessage(err)),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Edytuj zaliczkę</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="dep-title">Tytuł</Label>
            <Input
              id="dep-title"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="np. Zaliczka 1"
            />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="dep-amount">Kwota (PLN)</Label>
              <span className="text-xs text-muted-foreground">maks. {formatPrice(maxAmount)}</span>
            </div>
            <Input
              id="dep-amount"
              type="number"
              min={0.01}
              max={maxAmount}
              step={0.01}
              value={amount}
              onChange={e => { setAmount(e.target.value); setApiError(null); }}
              className={amountExceedsMax ? 'border-destructive focus-visible:ring-destructive' : ''}
            />
            {amountExceedsMax && (
              <p className="text-xs text-destructive">
                Zaliczka nie może przekroczyć pozostałej kwoty do wpłaty ({formatPrice(maxAmount)})
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="dep-date">Termin płatności</Label>
            <Input
              id="dep-date"
              type="date"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
            />
          </div>
          {apiError && (
            <p className="text-sm text-destructive rounded-md bg-destructive/10 px-3 py-2">
              {apiError}
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Anuluj</Button>
          <Button onClick={handleSave} disabled={updateMutation.isPending || !canSave}>
            {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Zapisz'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Mark Deposit Paid Dialog ────────────────────────────────

interface MarkDepositPaidDialogProps {
  orderId: string;
  deposit: CateringDeposit | null;
  open: boolean;
  onClose: () => void;
}

function MarkDepositPaidDialog({ orderId, deposit, open, onClose }: MarkDepositPaidDialogProps) {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | ''>('');

  const markPaidMutation = useMarkDepositPaid(orderId, deposit?.id ?? '');

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setPaymentMethod('');
      onClose();
    }
  };

  const handleConfirm = async () => {
    await markPaidMutation.mutateAsync({ paymentMethod: paymentMethod || undefined });
    handleOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Oznacz zaliczkę jako opłaconą</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {deposit && (
            <div className="rounded-lg bg-muted px-4 py-3 text-sm">
              <p className="font-medium">{deposit.title ?? 'Zaliczka'}</p>
              <p className="text-muted-foreground mt-0.5">
                {formatPrice(deposit.amount)} · termin: {deposit.dueDate}
              </p>
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="pay-method">Forma płatności (opcjonalnie)</Label>
            <Select value={paymentMethod} onValueChange={v => setPaymentMethod(v as PaymentMethod)}>
              <SelectTrigger id="pay-method">
                <SelectValue placeholder="Wybierz formę..." />
              </SelectTrigger>
              <SelectContent>
                {(Object.entries(PAYMENT_METHOD_LABEL) as [PaymentMethod, string][]).map(
                  ([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ),
                )}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>Anuluj</Button>
          <Button onClick={handleConfirm} disabled={markPaidMutation.isPending}>
            {markPaidMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <><CheckCircle2 className="mr-1.5 h-4 w-4" /> Potwierdź wpłatę</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Discount Dialog ──────────────────────────────────────────

interface DiscountDialogProps {
  orderId: string;
  baseAmount: number;
  initialType?: CateringDiscountType | null;
  initialValue?: number | null;
  initialReason?: string | null;
  open: boolean;
  onClose: () => void;
}

function DiscountDialog({
  orderId,
  baseAmount,
  initialType,
  initialValue,
  initialReason,
  open,
  onClose,
}: DiscountDialogProps) {
  const [discountType, setDiscountType] = useState<CateringDiscountType>('PERCENTAGE');
  const [value, setValue] = useState('');
  const [reason, setReason] = useState('');

  const updateMutation = useUpdateCateringOrder(orderId);

  const parsedValue = parseFloat(value);
  const isValidValue = !isNaN(parsedValue) && parsedValue > 0;

  const previewAmount =
    isValidValue
      ? discountType === 'PERCENTAGE'
        ? (baseAmount * parsedValue) / 100
        : parsedValue
      : null;

  const percentageExceeds100 = discountType === 'PERCENTAGE' && !isNaN(parsedValue) && parsedValue > 100;
  const amountExceedsBase = discountType === 'AMOUNT' && !isNaN(parsedValue) && parsedValue > baseAmount;
  const hasError = percentageExceeds100 || amountExceedsBase;
  const canSave = !!value && isValidValue && !hasError;

  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      setDiscountType(initialType ?? 'PERCENTAGE');
      setValue(initialValue != null ? String(initialValue) : '');
      setReason(initialReason ?? '');
    }
    if (!isOpen) onClose();
  };

  const handleSave = async () => {
    if (!canSave) return;
    await updateMutation.mutateAsync({
      discountType,
      discountValue: parsedValue,
      discountReason: reason || null,
    });
    onClose();
  };

  const handleRemove = async () => {
    await updateMutation.mutateAsync({
      discountType: null,
      discountValue: null,
      discountReason: null,
    });
    onClose();
  };

  const hasExistingDiscount = initialValue != null && initialValue > 0;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{hasExistingDiscount ? 'Edytuj rabat' : 'Dodaj rabat'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Typ rabatu</Label>
            <Tabs
              value={discountType}
              onValueChange={v => { setDiscountType(v as CateringDiscountType); setValue(''); }}
            >
              <TabsList className="w-full">
                <TabsTrigger value="PERCENTAGE" className="flex-1">Procent (%)</TabsTrigger>
                <TabsTrigger value="AMOUNT" className="flex-1">Kwota (PLN)</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="disc-value">
                {discountType === 'PERCENTAGE' ? 'Wartość (%)' : 'Kwota (PLN)'} *
              </Label>
              {previewAmount !== null && !hasError && (
                <span className="text-xs text-green-600 font-medium">
                  = -{formatPrice(previewAmount)}
                </span>
              )}
            </div>
            <Input
              id="disc-value"
              type="number"
              min={0.01}
              max={discountType === 'PERCENTAGE' ? 100 : baseAmount}
              step={discountType === 'PERCENTAGE' ? 0.1 : 0.01}
              value={value}
              onChange={e => setValue(e.target.value)}
              placeholder={discountType === 'PERCENTAGE' ? 'np. 10' : 'np. 200.00'}
              className={hasError ? 'border-destructive focus-visible:ring-destructive' : ''}
            />
            {percentageExceeds100 && (
              <p className="text-xs text-destructive">Rabat procentowy nie może przekroczyć 100%</p>
            )}
            {amountExceedsBase && (
              <p className="text-xs text-destructive">
                Rabat nie może przekroczyć wartości zamówienia ({formatPrice(baseAmount)})
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="disc-reason">Powód (opcjonalnie)</Label>
            <Input
              id="disc-reason"
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="np. Stały klient, rabat okolicznościowy..."
            />
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          {hasExistingDiscount && (
            <Button
              variant="ghost"
              className="text-destructive hover:text-destructive sm:mr-auto"
              onClick={handleRemove}
              disabled={updateMutation.isPending}
            >
              <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Usuń rabat
            </Button>
          )}
          <Button variant="outline" onClick={() => handleOpenChange(false)}>Anuluj</Button>
          <Button onClick={handleSave} disabled={updateMutation.isPending || !canSave}>
            {updateMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : hasExistingDiscount ? (
              'Zapisz'
            ) : (
              'Dodaj rabat'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Strona główna ────────────────────────────────────────────

export default function CateringOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [editDepositOpen, setEditDepositOpen] = useState(false);
  const [editDeposit, setEditDeposit] = useState<CateringDeposit | null>(null);
  const [addDepositOpen, setAddDepositOpen] = useState(false);
  const [markPaidOpen, setMarkPaidOpen] = useState(false);
  const [markPaidDeposit, setMarkPaidDeposit] = useState<CateringDeposit | null>(null);
  const [discountOpen, setDiscountOpen] = useState(false);

  const { data: order, isLoading } = useCateringOrder(id);
  const deleteMutation = useDeleteCateringOrder();
  const deleteDepositMutation = useDeleteCateringDeposit(id);

  const handleDelete = async () => {
    if (!confirm('Czy na pewno usunąć to zamówienie?')) return;
    await deleteMutation.mutateAsync(id);
    router.push('/dashboard/catering/orders');
  };

  const handleDeleteDeposit = async (depositId: string) => {
    if (!confirm('Czy na pewno usunąć tę zaliczkę?')) return;
    await deleteDepositMutation.mutateAsync(depositId);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-4 sm:p-6">
        <p className="text-muted-foreground">Zamówienie nie istnieje</p>
      </div>
    );
  }

  const clientName =
    order.client.clientType === 'COMPANY' && order.client.companyName
      ? order.client.companyName
      : `${order.client.firstName} ${order.client.lastName}`;

  const canDelete = order.status === 'DRAFT' || order.status === 'CANCELLED';
  const hasDiscount = order.discountAmount != null && Number(order.discountAmount) > 0;

  const depositsTotal = order.deposits.reduce((sum, d) => sum + Number(d.amount), 0);
  const remainingForDeposit = Math.max(0, Number(order.totalPrice) - depositsTotal);
  const maxAmountForEdit = (dep: CateringDeposit | null) => {
    if (!dep) return 0;
    const othersTotal = order.deposits
      .filter(d => d.id !== dep.id)
      .reduce((sum, d) => sum + Number(d.amount), 0);
    return Math.max(0, Number(order.totalPrice) - othersTotal);
  };

  const discountBase = Number(order.subtotal) + Number(order.extrasTotalPrice);

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* ── Header ────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0"
            onClick={() => router.push('/dashboard/catering/orders')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold font-mono">{order.orderNumber}</h1>
              <OrderStatusBadge status={order.status} />
            </div>
            <p className="text-muted-foreground text-sm mt-0.5 truncate">{clientName}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:shrink-0">
          <Button variant="outline" size="sm" onClick={() => setStatusDialogOpen(true)}>
            Zmień status
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/dashboard/catering/orders/${id}/edit`)}
          >
            <Edit className="mr-1.5 h-3.5 w-3.5" /> Edytuj
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuSeparator />
              <DropdownMenuItem
                disabled={!canDelete}
                className="text-destructive focus:text-destructive"
                onClick={handleDelete}
              >
                <Trash2 className="mr-2 h-4 w-4" /> Usuń zamówienie
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* ── Siatka treści ────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Lewa kolumna */}
        <div className="lg:col-span-2 space-y-6">

          <Card>
            <CardHeader><CardTitle className="text-base">Wydarzenie</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Nazwa</p>
                <p className="font-medium">{order.eventName ?? '—'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Data i godzina</p>
                <p className="font-medium">
                  {order.eventDate ?? '—'}{order.eventTime ? ` · ${order.eventTime}` : ''}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Miejsce</p>
                <p className="font-medium">{order.eventLocation ?? '—'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Goście</p>
                <p className="font-medium">{order.guestsCount}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Dostawa</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Typ</p>
                <p className="font-medium">{DELIVERY_TYPE_LABEL[order.deliveryType]}</p>
              </div>
              {order.deliveryType === 'DELIVERY' && (
                <>
                  <div>
                    <p className="text-muted-foreground">Adres dostawy</p>
                    <p className="font-medium">{order.deliveryAddress ?? '—'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Data dostawy</p>
                    <p className="font-medium">
                      {order.deliveryDate ?? '—'}{order.deliveryTime ? ` · ${order.deliveryTime}` : ''}
                    </p>
                  </div>
                </>
              )}
              {order.deliveryNotes && (
                <div className="sm:col-span-2">
                  <p className="text-muted-foreground">Uwagi do dostawy</p>
                  <p className="font-medium">{order.deliveryNotes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {order.items.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-base">Dania</CardTitle></CardHeader>
              <CardContent>
                <div className="overflow-x-auto -mx-2 px-2">
                  <table className="w-full text-sm min-w-[400px]">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left pb-2 font-medium text-muted-foreground">Danie</th>
                        <th className="text-right pb-2 font-medium text-muted-foreground">Ilość</th>
                        <th className="text-right pb-2 font-medium text-muted-foreground">Cena</th>
                        <th className="text-right pb-2 font-medium text-muted-foreground">Razem</th>
                      </tr>
                    </thead>
                    <tbody>
                      {order.items.map(item => (
                        <tr key={item.id} className="border-b last:border-0">
                          <td className="py-2">
                            {item.dishNameSnapshot}
                            {item.note && (
                              <span className="block text-xs text-muted-foreground">{item.note}</span>
                            )}
                          </td>
                          <td className="text-right py-2">{item.quantity}</td>
                          <td className="text-right py-2">{formatPrice(item.unitPrice)}</td>
                          <td className="text-right py-2 font-medium">{formatPrice(item.totalPrice)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {order.extras.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-base">Usługi dodatkowe</CardTitle></CardHeader>
              <CardContent>
                <div className="overflow-x-auto -mx-2 px-2">
                  <table className="w-full text-sm min-w-[400px]">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left pb-2 font-medium text-muted-foreground">Usługa</th>
                        <th className="text-right pb-2 font-medium text-muted-foreground">Ilość</th>
                        <th className="text-right pb-2 font-medium text-muted-foreground">Cena</th>
                        <th className="text-right pb-2 font-medium text-muted-foreground">Razem</th>
                      </tr>
                    </thead>
                    <tbody>
                      {order.extras.map(extra => (
                        <tr key={extra.id} className="border-b last:border-0">
                          <td className="py-2">
                            {extra.name}
                            {extra.description && (
                              <span className="block text-xs text-muted-foreground">{extra.description}</span>
                            )}
                          </td>
                          <td className="text-right py-2">{extra.quantity}</td>
                          <td className="text-right py-2">{formatPrice(extra.unitPrice)}</td>
                          <td className="text-right py-2 font-medium">{formatPrice(extra.totalPrice)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Prawa kolumna */}
        <div className="space-y-6">

          <Card>
            <CardHeader><CardTitle className="text-base">Klient</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="font-medium">{clientName}</p>
              {order.client.email && <p className="text-muted-foreground">{order.client.email}</p>}
              {order.client.phone && <p className="text-muted-foreground">{order.client.phone}</p>}
              {(order.contactName || order.contactPhone || order.contactEmail) && (
                <div className="pt-2 border-t">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Kontakt do zamówienia</p>
                  {order.contactName && <p>{order.contactName}</p>}
                  {order.contactPhone && <p className="text-muted-foreground">{order.contactPhone}</p>}
                  {order.contactEmail && <p className="text-muted-foreground">{order.contactEmail}</p>}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Rozliczenie</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Dania</span>
                <span>{formatPrice(order.subtotal)}</span>
              </div>
              {order.extrasTotalPrice > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Usługi dodatkowe</span>
                  <span>{formatPrice(order.extrasTotalPrice)}</span>
                </div>
              )}

              {hasDiscount ? (
                <div className="flex items-center justify-between text-green-600">
                  <button
                    onClick={() => setDiscountOpen(true)}
                    className="flex items-center gap-1 hover:underline transition-colors"
                    title="Edytuj rabat"
                  >
                    <span>
                      Rabat
                      {order.discountType === 'PERCENTAGE' && order.discountValue
                        ? ` (${order.discountValue}%)`
                        : ''}
                    </span>
                    <Pencil className="h-3 w-3 opacity-60" />
                  </button>
                  <span>-{formatPrice(order.discountAmount!)}</span>
                </div>
              ) : (
                <div className="flex justify-end">
                  <button
                    onClick={() => setDiscountOpen(true)}
                    className="flex items-center gap-0.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Tag className="h-3 w-3" /> Dodaj rabat
                  </button>
                </div>
              )}

              <div className="flex justify-between font-bold border-t pt-2">
                <span>Łącznie</span>
                <span>{formatPrice(order.totalPrice)}</span>
              </div>

              {/* Zaliczki */}
              <div className="pt-2 border-t space-y-1.5">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Zaliczki</p>
                  {remainingForDeposit > 0 && (
                    <button
                      onClick={() => setAddDepositOpen(true)}
                      className="flex items-center gap-0.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                      title="Dodaj zaliczkę"
                    >
                      <Plus className="h-3 w-3" /> Dodaj
                    </button>
                  )}
                </div>
                {order.deposits.length === 0 && (
                  <p className="text-xs text-muted-foreground italic">Brak zaliczek</p>
                )}
                {order.deposits.map(d => (
                  <div key={d.id} className="flex items-center justify-between text-xs gap-1">
                    <span className={d.paid ? 'text-green-600' : 'text-muted-foreground'}>
                      {d.title ?? 'Zaliczka'} · {d.dueDate}
                    </span>
                    <div className="flex items-center gap-1 shrink-0">
                      <span className={d.paid ? 'text-green-600 font-medium' : ''}>
                        {d.paid ? '✓ ' : ''}{formatPrice(d.amount)}
                      </span>
                      {!d.paid && (
                        <>
                          <button
                            onClick={() => { setMarkPaidDeposit(d); setMarkPaidOpen(true); }}
                            className="p-0.5 text-muted-foreground hover:text-green-600 transition-colors rounded"
                            title="Oznacz jako opłaconą"
                          >
                            <CheckCircle2 className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => { setEditDeposit(d); setEditDepositOpen(true); }}
                            className="p-0.5 text-muted-foreground hover:text-foreground transition-colors rounded"
                            title="Edytuj zaliczkę"
                          >
                            <Pencil className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => handleDeleteDeposit(d.id)}
                            disabled={deleteDepositMutation.isPending}
                            className="p-0.5 text-muted-foreground hover:text-destructive transition-colors rounded disabled:opacity-50"
                            title="Usuń zaliczkę"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
                {depositsTotal > 0 && (
                  <>
                    <div className="flex justify-between text-xs pt-1 border-t">
                      <span className="text-muted-foreground">Wpłacono</span>
                      <span className="font-medium">{formatPrice(depositsTotal)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Pozostało do zapłaty</span>
                      <span className={remainingForDeposit === 0 ? 'text-green-600 font-medium' : 'font-medium'}>
                        {remainingForDeposit === 0 ? 'Opłacone ✓' : formatPrice(remainingForDeposit)}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {(order.notes || order.specialRequirements) && (
            <Card>
              <CardHeader><CardTitle className="text-base">Uwagi</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                {order.notes && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Uwagi</p>
                    <p>{order.notes}</p>
                  </div>
                )}
                {order.specialRequirements && (
                  <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground mb-1">Specjalne wymagania</p>
                    <p>{order.specialRequirements}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="pt-6">
              <OrderTimeline orderId={id} />
            </CardContent>
          </Card>
        </div>
      </div>

      <ChangeStatusDialog
        orderId={id}
        currentStatus={order.status}
        open={statusDialogOpen}
        onClose={() => setStatusDialogOpen(false)}
      />

      <EditDepositDialog
        orderId={id}
        deposit={editDeposit}
        maxAmount={maxAmountForEdit(editDeposit)}
        open={editDepositOpen}
        onClose={() => { setEditDepositOpen(false); setEditDeposit(null); }}
      />

      <AddDepositDialog
        orderId={id}
        maxAmount={remainingForDeposit}
        open={addDepositOpen}
        onClose={() => setAddDepositOpen(false)}
      />

      <MarkDepositPaidDialog
        orderId={id}
        deposit={markPaidDeposit}
        open={markPaidOpen}
        onClose={() => { setMarkPaidOpen(false); setMarkPaidDeposit(null); }}
      />

      <DiscountDialog
        orderId={id}
        baseAmount={discountBase}
        initialType={order.discountType}
        initialValue={order.discountValue}
        initialReason={order.discountReason}
        open={discountOpen}
        onClose={() => setDiscountOpen(false)}
      />
    </div>
  );
}
